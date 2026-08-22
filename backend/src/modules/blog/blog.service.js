const crypto = require("crypto");

const prisma = require("../../config/prisma");
const { getBlogImagePublicUrl } = require("../../config/assets");
const {
  uploadBlogImageBuffer,
  deleteProductImageFromStorage
} = require("../../services/storage/storage.service");
const { resolveBodyHtml } = require("./blog-html");

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw createServiceError(`${fieldName} is required.`, 400);
  }
  return value.trim();
}

function optionalString(value, fieldName, max = 5000) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    throw createServiceError(`${fieldName} must be a string.`, 400);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw createServiceError(`${fieldName} is too long.`, 400);
  }
  return trimmed;
}

function parseBoolean(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true" || value === "1") {
    return true;
  }
  if (value === "false" || value === "0") {
    return false;
  }
  throw createServiceError(`${fieldName} must be a boolean.`, 400);
}

function parseStatus(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (value !== "draft" && value !== "published") {
    throw createServiceError("status must be draft or published.", 400);
  }
  return value;
}

function parseBodyJson(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value === "object") {
    return value;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      throw createServiceError("bodyJson must be valid JSON.", 400);
    }
  }
  throw createServiceError("bodyJson must be an object.", 400);
}

function parseTagIds(value) {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw createServiceError("tagIds must be an array of tag ids.", 400);
  }
  const ids = [];
  for (const item of value) {
    if (typeof item !== "string" || !item.trim()) {
      throw createServiceError("tagIds must contain non-empty string ids.", 400);
    }
    ids.push(item.trim());
  }
  return [...new Set(ids)];
}

const POST_TAG_INCLUDE = {
  tags: {
    include: {
      tag: true
    },
    orderBy: {
      tag: {
        name: "asc"
      }
    }
  }
};

const POST_ADMIN_INCLUDE = {
  media: { orderBy: { createdAt: "asc" } },
  ...POST_TAG_INCLUDE
};

function mapPostTags(post) {
  if (!Array.isArray(post.tags)) {
    return [];
  }
  return post.tags
    .map((row) => row.tag)
    .filter(Boolean)
    .map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description ?? null,
      seoTitle: tag.seoTitle ?? null,
      seoDescription: tag.seoDescription ?? null,
      isActive: tag.isActive
    }));
}

function mapPost(post, { includeBody = true } = {}) {
  if (!post) {
    return null;
  }

  const coverImageUrl = post.coverImagePath
    ? getBlogImagePublicUrl(post.id, post.coverImagePath)
    : null;

  const base = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImagePath: post.coverImagePath || null,
    coverImageUrl,
    status: post.status,
    publishedAt: post.publishedAt,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    authorName: post.authorName,
    showOnHomepage: post.showOnHomepage,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    deletedAt: post.deletedAt ?? null,
    tags: mapPostTags(post),
    media: Array.isArray(post.media)
      ? post.media.map((item) => ({
          id: item.id,
          path: item.path,
          alt: item.alt,
          url: getBlogImagePublicUrl(post.id, item.path),
          createdAt: item.createdAt
        }))
      : undefined
  };

  if (includeBody) {
    base.bodyJson = post.bodyJson;
    base.bodyHtml = post.bodyHtml;
  }

  return base;
}

async function assertTagIdsExist(tagIds) {
  if (!tagIds.length) {
    return;
  }
  const found = await prisma.blogTag.findMany({
    where: { id: { in: tagIds } },
    select: { id: true }
  });
  if (found.length !== tagIds.length) {
    throw createServiceError("One or more tagIds are invalid.", 400);
  }
}

async function syncPostTags(postId, tagIds) {
  if (tagIds === undefined) {
    return;
  }
  await assertTagIdsExist(tagIds);
  await prisma.$transaction([
    prisma.blogPostTag.deleteMany({ where: { postId } }),
    ...(tagIds.length
      ? [
          prisma.blogPostTag.createMany({
            data: tagIds.map((tagId) => ({ postId, tagId })),
            skipDuplicates: true
          })
        ]
      : [])
  ]);
}

async function ensureUniqueSlug(baseSlug, excludeId = null) {
  let slug = baseSlug || `post-${Date.now()}`;
  let attempt = 0;

  while (attempt < 50) {
    const existing = await prisma.blogPost.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {})
      },
      select: { id: true }
    });
    if (!existing) {
      return slug;
    }
    attempt += 1;
    slug = `${baseSlug}-${attempt + 1}`;
  }

  return `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
}

async function getPostOrThrow(id, { includeDeleted = false } = {}) {
  const post = await prisma.blogPost.findFirst({
    where: {
      id,
      ...(includeDeleted ? {} : { deletedAt: null })
    },
    include: POST_ADMIN_INCLUDE
  });
  if (!post) {
    throw createServiceError("Blog post not found.", 404);
  }
  return post;
}

async function listAdminBlogPosts(query = {}) {
  const status = parseStatus(query.status);
  const includeDeleted =
    query.includeDeleted === true || query.includeDeleted === "true";

  const posts = await prisma.blogPost.findMany({
    where: {
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(status ? { status } : {})
    },
    orderBy: [{ updatedAt: "desc" }],
    include: POST_ADMIN_INCLUDE
  });

  return posts.map((post) => mapPost(post));
}

async function getAdminBlogPostById(id) {
  const post = await getPostOrThrow(id, { includeDeleted: true });
  return mapPost(post);
}

async function createAdminBlogPost(payload = {}) {
  const title = requireNonEmptyString(payload.title, "title");
  const requestedSlug =
    optionalString(payload.slug, "slug", 160) || slugify(title);
  const slug = await ensureUniqueSlug(slugify(requestedSlug) || slugify(title));
  const bodyJson = parseBodyJson(payload.bodyJson) || EMPTY_DOC;
  const bodyHtml = resolveBodyHtml({
    bodyJson,
    bodyHtml: payload.bodyHtml
  });
  const status = parseStatus(payload.status) || "draft";
  const showOnHomepage = parseBoolean(payload.showOnHomepage, "showOnHomepage");
  const tagIds = parseTagIds(payload.tagIds);

  const publishedAt = status === "published" ? new Date() : null;
  const id = crypto.randomUUID();

  if (tagIds !== undefined) {
    await assertTagIdsExist(tagIds);
  }

  const post = await prisma.blogPost.create({
    data: {
      id,
      title,
      slug,
      excerpt: optionalString(payload.excerpt, "excerpt", 2000),
      bodyJson,
      bodyHtml,
      status,
      publishedAt,
      seoTitle: optionalString(payload.seoTitle, "seoTitle", 200),
      seoDescription: optionalString(payload.seoDescription, "seoDescription", 500),
      authorName: optionalString(payload.authorName, "authorName", 120),
      showOnHomepage: showOnHomepage === undefined ? false : showOnHomepage,
      ...(tagIds !== undefined && tagIds.length
        ? {
            tags: {
              create: tagIds.map((tagId) => ({ tagId }))
            }
          }
        : {})
    },
    include: POST_ADMIN_INCLUDE
  });

  return mapPost(post);
}

async function updateAdminBlogPost(id, payload = {}) {
  const existing = await getPostOrThrow(id);

  const data = {};

  if (payload.title !== undefined) {
    data.title = requireNonEmptyString(payload.title, "title");
  }

  if (payload.slug !== undefined) {
    const nextSlug = slugify(
      optionalString(payload.slug, "slug", 160) || existing.slug
    );
    data.slug = await ensureUniqueSlug(nextSlug || existing.slug, id);
  }

  if (payload.excerpt !== undefined) {
    data.excerpt = optionalString(payload.excerpt, "excerpt", 2000);
  }

  if (payload.seoTitle !== undefined) {
    data.seoTitle = optionalString(payload.seoTitle, "seoTitle", 200);
  }

  if (payload.seoDescription !== undefined) {
    data.seoDescription = optionalString(
      payload.seoDescription,
      "seoDescription",
      500
    );
  }

  if (payload.authorName !== undefined) {
    data.authorName = optionalString(payload.authorName, "authorName", 120);
  }

  const showOnHomepage = parseBoolean(payload.showOnHomepage, "showOnHomepage");
  if (showOnHomepage !== undefined) {
    data.showOnHomepage = showOnHomepage;
  }

  const bodyJson = parseBodyJson(payload.bodyJson);
  if (bodyJson !== undefined || payload.bodyHtml !== undefined) {
    const nextJson = bodyJson !== undefined ? bodyJson : existing.bodyJson;
    data.bodyJson = nextJson;
    data.bodyHtml = resolveBodyHtml({
      bodyJson: nextJson,
      bodyHtml: payload.bodyHtml
    });
  }

  const status = parseStatus(payload.status);
  if (status !== undefined) {
    data.status = status;
    if (status === "published") {
      data.publishedAt = existing.publishedAt || new Date();
    } else {
      data.publishedAt = null;
    }
  }

  const tagIds = parseTagIds(payload.tagIds);
  await syncPostTags(id, tagIds);

  const post = await prisma.blogPost.update({
    where: { id },
    data,
    include: POST_ADMIN_INCLUDE
  });

  return mapPost(post);
}

async function softDeleteAdminBlogPost(id) {
  await getPostOrThrow(id);
  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: "draft",
      publishedAt: null,
      showOnHomepage: false
    },
    include: POST_ADMIN_INCLUDE
  });
  return mapPost(post);
}

async function restoreAdminBlogPost(id) {
  const existing = await prisma.blogPost.findUnique({
    where: { id },
    include: POST_ADMIN_INCLUDE
  });
  if (!existing) {
    throw createServiceError("Blog post not found.", 404);
  }
  if (!existing.deletedAt) {
    return mapPost(existing);
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: { deletedAt: null },
    include: POST_ADMIN_INCLUDE
  });
  return mapPost(post);
}

async function uploadAdminBlogCover(id, file) {
  await getPostOrThrow(id);
  if (!file?.buffer) {
    throw createServiceError("Cover image file is required.", 400);
  }

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  const uploaded = await uploadBlogImageBuffer({
    postId: id,
    buffer: file.buffer,
    originalName: file.originalname,
    kind: "cover"
  });

  if (existing?.coverImagePath) {
    try {
      await deleteProductImageFromStorage(existing.coverImagePath);
    } catch {
      // Best-effort cleanup
    }
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: { coverImagePath: uploaded.path },
    include: POST_ADMIN_INCLUDE
  });

  return {
    post: mapPost(post),
    image: {
      id: uploaded.id,
      path: uploaded.path,
      url: uploaded.url
    }
  };
}

async function uploadAdminBlogMedia(id, file, alt) {
  await getPostOrThrow(id);
  if (!file?.buffer) {
    throw createServiceError("Media image file is required.", 400);
  }

  const uploaded = await uploadBlogImageBuffer({
    postId: id,
    buffer: file.buffer,
    originalName: file.originalname,
    kind: "media",
    mediaId: crypto.randomUUID()
  });

  const media = await prisma.blogMedia.create({
    data: {
      id: uploaded.id,
      postId: id,
      path: uploaded.path,
      alt: optionalString(alt, "alt", 300)
    }
  });

  return {
    media: {
      id: media.id,
      path: media.path,
      alt: media.alt,
      url: getBlogImagePublicUrl(id, media.path),
      createdAt: media.createdAt
    }
  };
}

function parsePageLimit(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 12));
  return { page, limit, skip: (page - 1) * limit };
}

async function listPublicBlogPosts(query = {}) {
  const { page, limit, skip } = parsePageLimit(query);
  const showOnHomepage = parseBoolean(query.showOnHomepage, "showOnHomepage");

  const where = {
    deletedAt: null,
    status: "published",
    ...(showOnHomepage === true ? { showOnHomepage: true } : {})
  };

  const [total, posts] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImagePath: true,
        status: true,
        publishedAt: true,
        seoTitle: true,
        seoDescription: true,
        authorName: true,
        showOnHomepage: true,
        createdAt: true,
        updatedAt: true
      }
    })
  ]);

  return {
    posts: posts.map((post) => mapPost(post, { includeBody: false })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  };
}

async function getPublicBlogPostBySlug(slug) {
  if (typeof slug !== "string" || !slug.trim()) {
    throw createServiceError("slug is required.", 400);
  }

  const post = await prisma.blogPost.findFirst({
    where: {
      slug: slug.trim(),
      deletedAt: null,
      status: "published"
    },
    include: {
      media: { orderBy: { createdAt: "asc" } },
      ...POST_TAG_INCLUDE
    }
  });

  if (!post) {
    throw createServiceError("Blog post not found.", 404);
  }

  return mapPost(post);
}

async function listPublishedSlugsForSitemap() {
  const posts = await prisma.blogPost.findMany({
    where: { deletedAt: null, status: "published" },
    select: { slug: true, updatedAt: true, publishedAt: true },
    orderBy: { publishedAt: "desc" }
  });
  return posts;
}

module.exports = {
  createAdminBlogPost,
  getAdminBlogPostById,
  getPublicBlogPostBySlug,
  listAdminBlogPosts,
  listPublicBlogPosts,
  listPublishedSlugsForSitemap,
  restoreAdminBlogPost,
  softDeleteAdminBlogPost,
  updateAdminBlogPost,
  uploadAdminBlogCover,
  uploadAdminBlogMedia
};
