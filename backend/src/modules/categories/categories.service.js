const prisma = require("../../config/prisma");

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function mapPublicCategory(category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    isActive: category.isActive,
    parentId: category.parentId || null,
    sortOrder: category.sortOrder ?? 0,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    children: []
  };
}

function mapAdminCategory(category) {
  return {
    ...mapPublicCategory(category),
    deletedAt: category.deletedAt
  };
}

function sortCategories(a, b) {
  const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  if (orderDiff !== 0) {
    return orderDiff;
  }

  return String(a.name).localeCompare(String(b.name));
}

function buildCategoryTree(flatRows, mapFn) {
  const nodesById = new Map();

  for (const row of flatRows) {
    nodesById.set(row.id, {
      ...mapFn(row),
      children: []
    });
  }

  const roots = [];

  for (const row of flatRows) {
    const node = nodesById.get(row.id);
    if (row.parentId && nodesById.has(row.parentId)) {
      nodesById.get(row.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }

  function sortRecursive(nodes) {
    nodes.sort(sortCategories);
    for (const node of nodes) {
      sortRecursive(node.children);
    }
  }

  sortRecursive(roots);
  return roots;
}

async function listPublicCategories() {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      deletedAt: null
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });

  return buildCategoryTree(categories, mapPublicCategory);
}

async function getPublicCategoryBySlug(slug) {
  const category = await prisma.category.findFirst({
    where: {
      slug,
      isActive: true,
      deletedAt: null
    }
  });

  if (!category) {
    throw createServiceError("Category not found.", 404);
  }

  const children = await prisma.category.findMany({
    where: {
      parentId: category.id,
      isActive: true,
      deletedAt: null
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });

  return {
    ...mapPublicCategory(category),
    children: children.map((child) => ({
      ...mapPublicCategory(child),
      children: []
    }))
  };
}

async function listAdminCategories() {
  const categories = await prisma.category.findMany({
    orderBy: [
      {
        deletedAt: {
          sort: "asc",
          nulls: "first"
        }
      },
      { sortOrder: "asc" },
      { name: "asc" }
    ]
  });

  return buildCategoryTree(categories, mapAdminCategory);
}

async function getAdminCategoryById(id) {
  const category = await prisma.category.findUnique({
    where: {
      id
    }
  });

  if (!category) {
    throw createServiceError("Category not found.", 404);
  }

  const children = await prisma.category.findMany({
    where: {
      parentId: category.id
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });

  return {
    ...mapAdminCategory(category),
    children: children.map((child) => ({
      ...mapAdminCategory(child),
      children: []
    }))
  };
}

async function ensureUniqueSlug(slug, excludeId = null) {
  const existing = await prisma.category.findFirst({
    where: {
      slug,
      ...(excludeId
        ? {
            NOT: {
              id: excludeId
            }
          }
        : {})
    }
  });

  if (existing) {
    throw createServiceError("Category slug already exists.", 409);
  }
}

async function assertValidParentId(parentId, selfId = null) {
  if (parentId === undefined) {
    return undefined;
  }

  if (parentId === null || parentId === "") {
    return null;
  }

  if (typeof parentId !== "string" || !UUID_REGEX.test(parentId)) {
    throw createServiceError("Invalid parentId.", 400);
  }

  if (selfId && parentId === selfId) {
    throw createServiceError("Category cannot be its own parent.", 400);
  }

  const parent = await prisma.category.findUnique({
    where: {
      id: parentId
    }
  });

  if (!parent || parent.deletedAt) {
    throw createServiceError("Parent category not found.", 404);
  }

  if (selfId) {
    // Prevent cycles: walk up from proposed parent.
    let cursor = parent;
    while (cursor) {
      if (cursor.id === selfId) {
        throw createServiceError(
          "Cannot set parentId: would create a cycle.",
          400
        );
      }

      if (!cursor.parentId) {
        break;
      }

      cursor = await prisma.category.findUnique({
        where: {
          id: cursor.parentId
        }
      });
    }
  }

  return parentId;
}

function parseSortOrder(value) {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed)) {
    throw createServiceError("sortOrder must be an integer.", 400);
  }

  return parsed;
}

async function createAdminCategory({
  name,
  slug,
  description,
  isActive,
  parentId,
  sortOrder
}) {
  if (!name || typeof name !== "string" || !name.trim()) {
    throw createServiceError("Category name is required.", 400);
  }

  const normalizedName = name.trim();
  const normalizedSlug = slugify(slug || normalizedName);

  if (!normalizedSlug) {
    throw createServiceError("Category slug is invalid.", 400);
  }

  await ensureUniqueSlug(normalizedSlug);
  const resolvedParentId = await assertValidParentId(parentId);
  const resolvedSortOrder = parseSortOrder(sortOrder);

  const category = await prisma.category.create({
    data: {
      name: normalizedName,
      slug: normalizedSlug,
      description:
        typeof description === "string" ? description.trim() || null : null,
      isActive: typeof isActive === "boolean" ? isActive : true,
      parentId: resolvedParentId === undefined ? null : resolvedParentId,
      sortOrder: resolvedSortOrder === undefined ? 0 : resolvedSortOrder
    }
  });

  return mapAdminCategory(category);
}

async function updateAdminCategory(
  id,
  { name, slug, description, isActive, parentId, sortOrder }
) {
  const existing = await prisma.category.findUnique({
    where: {
      id
    }
  });

  if (!existing) {
    throw createServiceError("Category not found.", 404);
  }

  const data = {};

  if (name !== undefined) {
    if (!name || typeof name !== "string" || !name.trim()) {
      throw createServiceError("Category name cannot be empty.", 400);
    }

    data.name = name.trim();
  }

  if (slug !== undefined) {
    const normalizedSlug = slugify(slug);

    if (!normalizedSlug) {
      throw createServiceError("Category slug is invalid.", 400);
    }

    await ensureUniqueSlug(normalizedSlug, id);
    data.slug = normalizedSlug;
  }

  if (description !== undefined) {
    data.description =
      typeof description === "string" ? description.trim() || null : null;
  }

  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
      throw createServiceError("isActive must be a boolean.", 400);
    }

    data.isActive = isActive;
  }

  if (parentId !== undefined) {
    data.parentId = await assertValidParentId(parentId, id);
  }

  if (sortOrder !== undefined) {
    data.sortOrder = parseSortOrder(sortOrder);
  }

  const category = await prisma.category.update({
    where: {
      id
    },
    data
  });

  return mapAdminCategory(category);
}

async function softDeleteAdminCategory(id) {
  const existing = await prisma.category.findUnique({
    where: {
      id
    }
  });

  if (!existing) {
    throw createServiceError("Category not found.", 404);
  }

  if (existing.deletedAt) {
    throw createServiceError("Category is already deleted.", 400);
  }

  const childCount = await prisma.category.count({
    where: {
      parentId: id,
      deletedAt: null
    }
  });

  if (childCount > 0) {
    throw createServiceError(
      "Move or delete child categories first.",
      400
    );
  }

  const productCount = await prisma.product.count({
    where: {
      categoryId: id,
      deletedAt: null
    }
  });

  if (productCount > 0) {
    throw createServiceError("Reassign or remove products first.", 400);
  }

  const category = await prisma.category.update({
    where: {
      id
    },
    data: {
      deletedAt: new Date(),
      isActive: false
    }
  });

  return mapAdminCategory(category);
}

async function restoreAdminCategory(id) {
  const existing = await prisma.category.findUnique({
    where: {
      id
    }
  });

  if (!existing) {
    throw createServiceError("Category not found.", 404);
  }

  if (!existing.deletedAt) {
    throw createServiceError("Category is not deleted.", 400);
  }

  const category = await prisma.category.update({
    where: {
      id
    },
    data: {
      deletedAt: null,
      isActive: true
    }
  });

  return mapAdminCategory(category);
}

/**
 * Resolve a category by id or slug, then return that id plus all descendant ids.
 */
async function resolveCategoryIdsIncludingDescendants(
  categoryValue,
  { activeOnly = false } = {}
) {
  if (!categoryValue || typeof categoryValue !== "string") {
    return null;
  }

  const trimmed = categoryValue.trim();
  const isUuid = UUID_REGEX.test(trimmed);

  const root = await prisma.category.findFirst({
    where: {
      ...(isUuid ? { id: trimmed } : { slug: trimmed }),
      ...(activeOnly
        ? {
            isActive: true,
            deletedAt: null
          }
        : {})
    }
  });

  if (!root) {
    return [];
  }

  const all = await prisma.category.findMany({
    where: activeOnly
      ? {
          deletedAt: null
        }
      : {},
    select: {
      id: true,
      parentId: true
    }
  });

  const childrenByParent = new Map();
  for (const row of all) {
    if (!row.parentId) {
      continue;
    }

    if (!childrenByParent.has(row.parentId)) {
      childrenByParent.set(row.parentId, []);
    }

    childrenByParent.get(row.parentId).push(row.id);
  }

  const ids = [root.id];
  const stack = [root.id];

  while (stack.length > 0) {
    const current = stack.pop();
    const kids = childrenByParent.get(current) || [];
    for (const kid of kids) {
      ids.push(kid);
      stack.push(kid);
    }
  }

  return ids;
}

module.exports = {
  createAdminCategory,
  getAdminCategoryById,
  getPublicCategoryBySlug,
  listAdminCategories,
  listPublicCategories,
  resolveCategoryIdsIncludingDescendants,
  restoreAdminCategory,
  softDeleteAdminCategory,
  updateAdminCategory
};
