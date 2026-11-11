const prisma = require("../../../config/prisma");
const { getProductImagePublicUrl } = require("../../../config/assets");

function normalizeProductImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images;
}

function parseBooleanQuery(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["true", "1", "yes"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function buildProductWhere(query = {}) {
  const where = {};
  const includeArchived = parseBooleanQuery(query.includeArchived, false);

  if (!includeArchived) {
    where.deletedAt = null;
    where.isVisible = true;
  }

  if (query.search && String(query.search).trim()) {
    where.name = {
      contains: String(query.search).trim(),
      mode: "insensitive"
    };
  }

  return where;
}

function flattenProductImages(product) {
  const images = normalizeProductImages(product.images);
  const coverImage = images[product.coverImageIndex] || null;

  return images
    .filter((image) => image && image.id)
    .map((image) => ({
      imageId: image.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      url: getProductImagePublicUrl(product.id, image),
      size: Number.isFinite(image.size) ? image.size : 0,
      createdAt: image.createdAt || product.createdAt,
      isCover: Boolean(coverImage && coverImage.id === image.id),
      productIsVisible: product.isVisible,
      productDeletedAt: product.deletedAt
    }));
}

async function listAdminMedia(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));

  const products = await prisma.product.findMany({
    where: buildProductWhere(query),
    select: {
      id: true,
      name: true,
      slug: true,
      images: true,
      coverImageIndex: true,
      isVisible: true,
      deletedAt: true,
      createdAt: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  const flattened = products
    .flatMap((product) => flattenProductImages(product))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  const total = flattened.length;
  const skip = (page - 1) * limit;
  const items = flattened.slice(skip, skip + limit);
  const totalBytes = flattened.reduce((sum, item) => sum + (item.size || 0), 0);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0
    },
    summary: {
      totalImages: total,
      totalBytes
    }
  };
}

module.exports = {
  listAdminMedia
};
