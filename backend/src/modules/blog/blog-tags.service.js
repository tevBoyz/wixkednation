const crypto = require("crypto");

const prisma = require("../../config/prisma");
const { getBlogImagePublicUrl } = require("../../config/assets");

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

function parsePageLimit(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 12));
  return { page, limit, skip: (page - 1) * limit };
}

function mapTag(tag, { postCount } = {}) {
  if (!tag) {
    return null;
  }
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    description: tag.description ?? null,
    seoTitle: tag.seoTitle ?? null,
    seoDescription: tag.seoDescription ?? null,
    isActive: tag.isActive,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
    ...(typeof postCount === "number" ? { postCount } : {})
  };
}

function mapPublicPostSummary(post) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImagePath: post.coverImagePath || null,
    coverImageUrl: post.coverImagePath
      ? getBlogImagePublicUrl(post.id, post.coverImagePath)
      : null,
    status: post.status,
    publishedAt: post.publishedAt,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    authorName: post.authorName,
    showOnHomepage: post.showOnHomepage,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    tags: []
  };
}

async function ensureUniqueTagSlug(baseSlug, excludeId = null) {
  let slug = baseSlug || `tag-${Date.now()}`;
  let attempt = 0;

  while (attempt < 50) {
    const existing = await prisma.blogTag.findFirst({
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

async function listAdminBlogTags(query = {}) {
  const includeInactive =
    query.includeInactive === true || query.includeInactive === "true";

  const tags = await prisma.blogTag.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ name: "asc" }],
    include: {
      _count: {
        select: {
          posts: true
        }
      }
    }
  });

  return tags.map((tag) =>
    mapTag(tag, { postCount: tag._count?.posts ?? 0 })
  );
}

async function createAdminBlogTag(payload = {}) {
  const name = requireNonEmptyString(payload.name, "name");
  const requestedSlug =
    optionalString(payload.slug, "slug", 160) || slugify(name);
  const slug = await ensureUniqueTagSlug(slugify(requestedSlug) || slugify(name));
  const isActive = parseBoolean(payload.isActive, "isActive");

  const tag = await prisma.blogTag.create({
    data: {
      id: crypto.randomUUID(),
      name,
      slug,
      description: optionalString(payload.description, "description", 5000),
      seoTitle: optionalString(payload.seoTitle, "seoTitle", 200),
      seoDescription: optionalString(
        payload.seoDescription,
        "seoDescription",
        500
      ),
      isActive: isActive === undefined ? true : isActive
    }
  });

  return mapTag(tag, { postCount: 0 });
}

async function updateAdminBlogTag(id, payload = {}) {
  const existing = await prisma.blogTag.findUnique({ where: { id } });
  if (!existing) {
    throw createServiceError("Blog tag not found.", 404);
  }

  const data = {};

  if (payload.name !== undefined) {
    data.name = requireNonEmptyString(payload.name, "name");
  }

  if (payload.slug !== undefined) {
    const nextSlug = slugify(
      optionalString(payload.slug, "slug", 160) || existing.slug
    );
    data.slug = await ensureUniqueTagSlug(nextSlug || existing.slug, id);
  }

  if (payload.description !== undefined) {
    data.description = optionalString(payload.description, "description", 5000);
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

  const isActive = parseBoolean(payload.isActive, "isActive");
  if (isActive !== undefined) {
    data.isActive = isActive;
  }

  const tag = await prisma.blogTag.update({
    where: { id },
    data,
    include: {
      _count: { select: { posts: true } }
    }
  });

  return mapTag(tag, { postCount: tag._count?.posts ?? 0 });
}

async function listPublicBlogTags() {
  const tags = await prisma.blogTag.findMany({
    where: { isActive: true },
    orderBy: [{ name: "asc" }],
    include: {
      _count: {
        select: {
          posts: {
            where: {
              post: {
                deletedAt: null,
                status: "published"
              }
            }
          }
        }
      }
    }
  });

  return tags
    .map((tag) => mapTag(tag, { postCount: tag._count?.posts ?? 0 }))
    .filter((tag) => (tag.postCount ?? 0) > 0);
}

async function getPublicBlogTagBySlug(slug, query = {}) {
  if (typeof slug !== "string" || !slug.trim()) {
    throw createServiceError("slug is required.", 400);
  }

  const tag = await prisma.blogTag.findFirst({
    where: {
      slug: slug.trim(),
      isActive: true
    }
  });

  if (!tag) {
    throw createServiceError("Blog tag not found.", 404);
  }

  const { page, limit, skip } = parsePageLimit(query);
  const postWhere = {
    deletedAt: null,
    status: "published",
    tags: { some: { tagId: tag.id } }
  };

  const [total, posts] = await Promise.all([
    prisma.blogPost.count({ where: postWhere }),
    prisma.blogPost.findMany({
      where: postWhere,
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
    tag: mapTag(tag, { postCount: total }),
    posts: posts.map(mapPublicPostSummary),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  };
}

async function listActiveTagSlugsForSitemap() {
  const tags = await prisma.blogTag.findMany({
    where: {
      isActive: true,
      posts: {
        some: {
          post: {
            deletedAt: null,
            status: "published"
          }
        }
      }
    },
    select: { slug: true, updatedAt: true },
    orderBy: { name: "asc" }
  });
  return tags;
}

module.exports = {
  createAdminBlogTag,
  getPublicBlogTagBySlug,
  listActiveTagSlugsForSitemap,
  listAdminBlogTags,
  listPublicBlogTags,
  mapTag,
  updateAdminBlogTag
};
