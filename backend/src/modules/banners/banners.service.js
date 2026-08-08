const prisma = require("../../config/prisma");
const {
  getBannerImagePublicUrl,
  getDefaultProductImageUrl,
  getProductImagePublicUrl
} = require("../../config/assets");
const {
  activeBannerWhere
} = require("../../services/promo/promo-pricing.service");
const {
  deleteProductImageFromStorage,
  uploadBannerImageBuffer
} = require("../../services/storage/storage.service");

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function serializeDecimal(value) {
  if (value === null || value === undefined) {
    return null;
  }
  return value.toString();
}

function parseMoney(value, fieldName) {
  const num = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(num) || num < 0) {
    throw createServiceError(`${fieldName} must be a non-negative number.`, 400);
  }
  return Number(num.toFixed(2));
}

function parseOptionalDate(value, fieldName) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createServiceError(`${fieldName} must be a valid date.`, 400);
  }
  return date;
}

function parseSortOrder(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const n = Number.parseInt(value, 10);
  if (!Number.isInteger(n)) {
    throw createServiceError("sortOrder must be an integer.", 400);
  }
  return n;
}

function assertUuid(value, fieldName) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  ) {
    throw createServiceError(`${fieldName} must be a valid UUID.`, 400);
  }
}

function getProductCoverUrl(product) {
  if (!product) {
    return getDefaultProductImageUrl();
  }
  const images = Array.isArray(product.images) ? product.images : [];
  if (images.length === 0) {
    return getDefaultProductImageUrl();
  }
  const coverIndex =
    typeof product.coverImageIndex === "number" &&
    product.coverImageIndex >= 0 &&
    product.coverImageIndex < images.length
      ? product.coverImageIndex
      : 0;
  const cover = images[coverIndex] || images[0];
  return (
    getProductImagePublicUrl(product.id, cover) || getDefaultProductImageUrl()
  );
}

function resolveBannerImageUrl(banner) {
  if (banner.imagePath) {
    return getBannerImagePublicUrl(banner.id, banner.imagePath);
  }
  if (banner.imageMode === "composed") {
    return getProductCoverUrl(banner.product);
  }
  return null;
}

function mapBanner(banner, { publicOnly = false } = {}) {
  const product = banner.product;
  const sku = banner.sku;
  const imageUrl = resolveBannerImageUrl(banner);

  const base = {
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle || null,
    productId: banner.productId,
    skuId: banner.skuId,
    salePrice: serializeDecimal(banner.salePrice),
    compareAtPrice: serializeDecimal(banner.compareAtPrice),
    imageMode: banner.imageMode,
    imagePath: banner.imagePath || null,
    imageUrl,
    sortOrder: banner.sortOrder,
    isActive: banner.isActive,
    startsAt: banner.startsAt,
    endsAt: banner.endsAt,
    createdAt: banner.createdAt,
    updatedAt: banner.updatedAt,
    product: product
      ? {
          id: product.id,
          name: product.name,
          slug: product.slug,
          coverImageUrl: getProductCoverUrl(product)
        }
      : null,
    sku: sku
      ? {
          id: sku.id,
          label: sku.label || null,
          volume: serializeDecimal(sku.volume),
          measurementUnit: sku.measurementUnit,
          price: serializeDecimal(sku.price)
        }
      : null
  };

  if (!publicOnly) {
    base.deletedAt = banner.deletedAt;
  }

  return base;
}

const bannerInclude = {
  product: true,
  sku: true
};

async function assertPurchasableProductSku(productId, skuId) {
  assertUuid(productId, "productId");
  assertUuid(skuId, "skuId");

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true }
  });

  if (
    !product ||
    product.deletedAt != null ||
    !product.category ||
    product.category.deletedAt != null
  ) {
    throw createServiceError("Product not found or unavailable.", 400);
  }

  const sku = await prisma.productSku.findUnique({
    where: { id: skuId }
  });

  if (!sku || sku.productId !== productId) {
    throw createServiceError("Selected pack does not belong to this product.", 400);
  }

  if (sku.isVisible === false) {
    throw createServiceError("Selected pack is hidden.", 400);
  }

  return { product, sku };
}

function normalizeBannerPayload(body = {}, { partial = false } = {}) {
  const data = {};

  if (!partial || body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      throw createServiceError("title is required.", 400);
    }
    data.title = title;
  }

  if (!partial || body.subtitle !== undefined) {
    if (body.subtitle === null || body.subtitle === undefined || body.subtitle === "") {
      data.subtitle = null;
    } else if (typeof body.subtitle === "string") {
      data.subtitle = body.subtitle.trim() || null;
    } else {
      throw createServiceError("subtitle must be a string.", 400);
    }
  }

  if (!partial || body.productId !== undefined) {
    assertUuid(body.productId, "productId");
    data.productId = body.productId;
  }

  if (!partial || body.skuId !== undefined) {
    assertUuid(body.skuId, "skuId");
    data.skuId = body.skuId;
  }

  if (!partial || body.salePrice !== undefined) {
    data.salePrice = parseMoney(body.salePrice, "salePrice");
  }

  if (!partial || body.compareAtPrice !== undefined) {
    data.compareAtPrice = parseMoney(body.compareAtPrice, "compareAtPrice");
  }

  if (!partial || body.imageMode !== undefined) {
    const mode = body.imageMode === "uploaded" ? "uploaded" : "composed";
    data.imageMode = mode;
  }

  if (!partial || body.sortOrder !== undefined) {
    data.sortOrder = parseSortOrder(body.sortOrder);
  }

  if (!partial || body.isActive !== undefined) {
    data.isActive = body.isActive !== false && body.isActive !== "false";
  }

  if (!partial || body.startsAt !== undefined) {
    data.startsAt = parseOptionalDate(body.startsAt, "startsAt");
  }

  if (!partial || body.endsAt !== undefined) {
    data.endsAt = parseOptionalDate(body.endsAt, "endsAt");
  }

  if (
    data.salePrice != null &&
    data.compareAtPrice != null &&
    data.salePrice >= data.compareAtPrice
  ) {
    throw createServiceError("salePrice must be less than compareAtPrice.", 400);
  }

  if (
    data.startsAt &&
    data.endsAt &&
    data.startsAt.getTime() > data.endsAt.getTime()
  ) {
    throw createServiceError("startsAt must be before endsAt.", 400);
  }

  return data;
}

async function listAdminBanners({ includeDeleted = true } = {}) {
  const banners = await prisma.promoBanner.findMany({
    where: includeDeleted ? {} : { deletedAt: null },
    include: bannerInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });

  return banners.map((b) => mapBanner(b));
}

async function getAdminBannerById(id) {
  assertUuid(id, "id");
  const banner = await prisma.promoBanner.findUnique({
    where: { id },
    include: bannerInclude
  });

  if (!banner) {
    throw createServiceError("Banner not found.", 404);
  }

  return mapBanner(banner);
}

async function createAdminBanner(body = {}) {
  const data = normalizeBannerPayload(body, { partial: false });
  await assertPurchasableProductSku(data.productId, data.skuId);

  if (data.imageMode === "uploaded") {
    // Image uploaded after create via POST /:id/image
  }

  const banner = await prisma.promoBanner.create({
    data: {
      title: data.title,
      subtitle: data.subtitle ?? null,
      productId: data.productId,
      skuId: data.skuId,
      salePrice: data.salePrice.toFixed(2),
      compareAtPrice: data.compareAtPrice.toFixed(2),
      imageMode: data.imageMode || "composed",
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive !== false,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null
    },
    include: bannerInclude
  });

  return mapBanner(banner);
}

async function updateAdminBanner(id, body = {}) {
  assertUuid(id, "id");
  const existing = await prisma.promoBanner.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    throw createServiceError("Banner not found.", 404);
  }

  const data = normalizeBannerPayload(
    {
      title: body.title !== undefined ? body.title : existing.title,
      subtitle: body.subtitle !== undefined ? body.subtitle : existing.subtitle,
      productId:
        body.productId !== undefined ? body.productId : existing.productId,
      skuId: body.skuId !== undefined ? body.skuId : existing.skuId,
      salePrice:
        body.salePrice !== undefined ? body.salePrice : existing.salePrice,
      compareAtPrice:
        body.compareAtPrice !== undefined
          ? body.compareAtPrice
          : existing.compareAtPrice,
      imageMode:
        body.imageMode !== undefined ? body.imageMode : existing.imageMode,
      sortOrder:
        body.sortOrder !== undefined ? body.sortOrder : existing.sortOrder,
      isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
      startsAt: body.startsAt !== undefined ? body.startsAt : existing.startsAt,
      endsAt: body.endsAt !== undefined ? body.endsAt : existing.endsAt
    },
    { partial: false }
  );

  await assertPurchasableProductSku(data.productId, data.skuId);

  if (data.imageMode === "uploaded" && !existing.imagePath && body.imageMode === "uploaded") {
    // allow save; image can be uploaded next — validate on public list
  }

  const banner = await prisma.promoBanner.update({
    where: { id },
    data: {
      title: data.title,
      subtitle: data.subtitle ?? null,
      productId: data.productId,
      skuId: data.skuId,
      salePrice: data.salePrice.toFixed(2),
      compareAtPrice: data.compareAtPrice.toFixed(2),
      imageMode: data.imageMode,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
      startsAt: data.startsAt,
      endsAt: data.endsAt
    },
    include: bannerInclude
  });

  return mapBanner(banner);
}

async function softDeleteAdminBanner(id) {
  assertUuid(id, "id");
  const existing = await prisma.promoBanner.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    throw createServiceError("Banner not found.", 404);
  }

  const banner = await prisma.promoBanner.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
    include: bannerInclude
  });

  return mapBanner(banner);
}

async function restoreAdminBanner(id) {
  assertUuid(id, "id");
  const existing = await prisma.promoBanner.findUnique({ where: { id } });
  if (!existing) {
    throw createServiceError("Banner not found.", 404);
  }
  if (!existing.deletedAt) {
    throw createServiceError("Banner is not deleted.", 400);
  }

  const banner = await prisma.promoBanner.update({
    where: { id },
    data: { deletedAt: null },
    include: bannerInclude
  });

  return mapBanner(banner);
}

async function uploadAdminBannerImage(bannerId, file) {
  assertUuid(bannerId, "id");
  if (!file || !file.buffer) {
    throw createServiceError("Image file is required.", 400);
  }

  const existing = await prisma.promoBanner.findUnique({
    where: { id: bannerId }
  });
  if (!existing || existing.deletedAt) {
    throw createServiceError("Banner not found.", 404);
  }

  const uploaded = await uploadBannerImageBuffer({
    bannerId,
    buffer: file.buffer,
    originalName: file.originalname
  });

  if (existing.imagePath) {
    try {
      await deleteProductImageFromStorage(existing.imagePath);
    } catch {
      // best-effort cleanup
    }
  }

  const banner = await prisma.promoBanner.update({
    where: { id: bannerId },
    data: {
      imagePath: uploaded.path,
      imageMode:
        existing.imageMode === "uploaded" ? "uploaded" : existing.imageMode
    },
    include: bannerInclude
  });

  return mapBanner(banner);
}

async function listPublicActiveBanners() {
  const now = new Date();
  const banners = await prisma.promoBanner.findMany({
    where: {
      ...activeBannerWhere(now),
      product: {
        deletedAt: null,
        isVisible: true,
        category: {
          deletedAt: null,
          isActive: true
        }
      },
      sku: {
        isVisible: true
      }
    },
    include: bannerInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });

  return banners
    .filter((b) => {
      if (b.imageMode === "uploaded" && !b.imagePath) {
        return false;
      }
      return true;
    })
    .map((b) => mapBanner(b, { publicOnly: true }));
}

module.exports = {
  createAdminBanner,
  getAdminBannerById,
  listAdminBanners,
  listPublicActiveBanners,
  restoreAdminBanner,
  softDeleteAdminBanner,
  updateAdminBanner,
  uploadAdminBannerImage
};
