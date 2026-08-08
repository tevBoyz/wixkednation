const prisma = require("../../config/prisma");
const { getProductImagePublicUrl } = require("../../config/assets");
const {
  deleteProductImageFromStorage,
  uploadProductImageBuffer
} = require("../../services/storage/storage.service");
const {
  effectivePriceFromMap,
  getActiveSalePricesBySkuIds
} = require("../../services/promo/promo-pricing.service");
const {
  resolveCategoryIdsIncludingDescendants
} = require("../categories/categories.service");

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

function normalizeStringArray(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw createServiceError(`${fieldName} must be an array of strings.`, 400);
  }

  return value.map((entry) => {
    if (typeof entry !== "string" || !entry.trim()) {
      throw createServiceError(`${fieldName} must be an array of strings.`, 400);
    }

    return entry.trim();
  });
}

function normalizeProductImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images;
}

function mapProductImagesForResponse(productId, images) {
  return normalizeProductImages(images).map((image) => ({
    id: image.id,
    url: getProductImagePublicUrl(productId, image),
    ...(image.isCover != null ? { isCover: image.isCover } : {}),
    ...(image.sortOrder != null ? { sortOrder: image.sortOrder } : {})
  }));
}

function mapSku(sku, { includeVisibility = false } = {}) {
  if (!sku) {
    return null;
  }

  return {
    id: sku.id,
    label: sku.label || null,
    volume: serializeDecimal(sku.volume),
    measurementUnit: sku.measurementUnit,
    price: serializeDecimal(sku.price),
    sortOrder: sku.sortOrder,
    ...(includeVisibility ? { isVisible: sku.isVisible } : {})
  };
}

function mapProductSkus(product, { publicOnly = false } = {}) {
  const skus = Array.isArray(product.skus) ? product.skus : [];
  const filtered = publicOnly ? skus.filter((sku) => sku.isVisible) : skus;

  return filtered
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt)
    .map((sku) => mapSku(sku, { includeVisibility: !publicOnly }));
}

function mapPublicProduct(product) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: serializeDecimal(product.price),
    categoryId: product.categoryId,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug
        }
      : undefined,
    measurementUnit: product.measurementUnit,
    volume: serializeDecimal(product.volume),
    skus: mapProductSkus(product, { publicOnly: true }),
    productType: product.productType || "Flower",
    strainType: product.strainType || null,
    thcPercent: serializeDecimal(product.thcPercent),
    cbdPercent: serializeDecimal(product.cbdPercent),
    flavors: Array.isArray(product.flavors) ? product.flavors : [],
    effects: Array.isArray(product.effects) ? product.effects : [],
    images: mapProductImagesForResponse(product.id, product.images),
    coverImageIndex: product.coverImageIndex,
    isFeatured: product.isFeatured,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
}

async function applySalePricesToPublicProducts(mappedProducts) {
  const skuIds = mappedProducts.flatMap((product) =>
    (product.skus || []).map((sku) => sku.id)
  );
  const saleMap = await getActiveSalePricesBySkuIds(skuIds);

  if (saleMap.size === 0) {
    return mappedProducts;
  }

  return mappedProducts.map((product) => {
    const skus = (product.skus || []).map((sku) => {
      const sale = effectivePriceFromMap(sku.id, sku.price, saleMap);
      if (sale == null || Number(sale) === Number(sku.price)) {
        return sku;
      }
      return {
        ...sku,
        listPrice: sku.price,
        price: Number(sale).toFixed(2)
      };
    });

    let price = product.price;
    if (skus.length > 0) {
      const primary = skus[0];
      if (primary?.price != null) {
        price = primary.price;
      }
    }

    return {
      ...product,
      skus,
      price
    };
  });
}

const publicProductInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  },
  skus: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  }
};

const publicProductWhere = {
  isVisible: true,
  deletedAt: null,
  category: {
    isActive: true,
    deletedAt: null
  }
};

function parsePagination(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
}

/**
 * Text matches product fields OR category name/slug (so "hybrid" returns
 * every product in the Hybrid category), plus strain/product type.
 */
function buildProductSearchOr(search) {
  const term = String(search || "").trim();

  if (!term) {
    return undefined;
  }

  return [
    {
      name: {
        contains: term,
        mode: "insensitive"
      }
    },
    {
      description: {
        contains: term,
        mode: "insensitive"
      }
    },
    {
      slug: {
        contains: term,
        mode: "insensitive"
      }
    },
    {
      strainType: {
        contains: term,
        mode: "insensitive"
      }
    },
    {
      productType: {
        contains: term,
        mode: "insensitive"
      }
    },
    {
      category: {
        isActive: true,
        deletedAt: null,
        name: {
          contains: term,
          mode: "insensitive"
        }
      }
    },
    {
      category: {
        isActive: true,
        deletedAt: null,
        slug: {
          contains: term,
          mode: "insensitive"
        }
      }
    }
  ];
}

async function buildPublicListWhere(query = {}) {
  const where = {
    ...publicProductWhere
  };

  if (query.category) {
    const categoryIds = await resolveCategoryIdsIncludingDescendants(
      String(query.category).trim(),
      { activeOnly: true }
    );

    if (!categoryIds || categoryIds.length === 0) {
      where.categoryId = {
        in: []
      };
    } else {
      where.categoryId = {
        in: categoryIds
      };
      where.category = {
        isActive: true,
        deletedAt: null
      };
    }
  }

  if (query.search && String(query.search).trim()) {
    where.OR = buildProductSearchOr(String(query.search).trim());
  }

  return where;
}

async function listPublicProducts(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const where = await buildPublicListWhere(query);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: publicProductInclude,
      orderBy: {
        name: "asc"
      },
      skip,
      take: limit
    }),
    prisma.product.count({
      where
    })
  ]);

  return {
    products: await applySalePricesToPublicProducts(
      products.map(mapPublicProduct)
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0
    }
  };
}

async function listFeaturedPublicProducts(query = {}) {
  const { page, limit, skip } = parsePagination(query);

  const where = {
    ...publicProductWhere,
    isFeatured: true
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: publicProductInclude,
      orderBy: {
        name: "asc"
      },
      skip,
      take: limit
    }),
    prisma.product.count({
      where
    })
  ]);

  return {
    products: await applySalePricesToPublicProducts(
      products.map(mapPublicProduct)
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0
    }
  };
}

async function getPublicProductBySlug(slug) {
  const product = await prisma.product.findFirst({
    where: {
      slug,
      ...publicProductWhere
    },
    include: publicProductInclude
  });

  if (!product) {
    throw createServiceError("Product not found.", 404);
  }

  const [mapped] = await applySalePricesToPublicProducts([
    mapPublicProduct(product)
  ]);
  return mapped;
}

function mapAdminProduct(product) {
  return {
    ...mapPublicProduct(product),
    skus: mapProductSkus(product, { publicOnly: false }),
    isVisible: product.isVisible,
    deletedAt: product.deletedAt
  };
}

async function ensureUniqueProductSlug(slug, excludeId = null) {
  const existing = await prisma.product.findFirst({
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
    throw createServiceError("Product slug already exists.", 409);
  }
}

async function assertCategoryExists(categoryId) {
  if (!categoryId || typeof categoryId !== "string") {
    throw createServiceError("categoryId is required.", 400);
  }

  const category = await prisma.category.findUnique({
    where: {
      id: categoryId
    }
  });

  if (!category || category.deletedAt) {
    throw createServiceError("Category not found.", 404);
  }

  return category;
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseOptionalBoolean(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw createServiceError(`${fieldName} must be a boolean.`, 400);
  }

  return value;
}

function parseDecimalInput(value, fieldName, { required = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw createServiceError(`${fieldName} is required.`, 400);
    }

    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw createServiceError(`${fieldName} must be a non-negative number.`, 400);
  }

  return parsed.toFixed(2);
}

/**
 * Pack pricing: `price` is the fixed charge for one pack of `volume` `measurementUnit`.
 * Quantity multiplies both charge and effective volume (qty 2 = 2× price and 2× volume).
 * Both price+volume may be null for "contact for price"; setting only one is invalid.
 */
function assertPackPricing({ price, volume }) {
  const hasPrice = price != null;
  const hasVolume = volume != null;

  if (hasPrice && !hasVolume) {
    throw createServiceError(
      "volume is required when price is set. Price is the fixed charge for that pack size (e.g. 1 g = 500).",
      400
    );
  }

  if (hasVolume && !hasPrice) {
    throw createServiceError(
      "price is required when volume is set. Clear both for contact-for-price, or set both as a pack.",
      400
    );
  }

  if (hasVolume && Number(volume) <= 0) {
    throw createServiceError("volume must be greater than 0 for a sellable pack.", 400);
  }
}

const MAX_PRODUCT_SKUS = 3;

/**
 * Normalize admin `skus` payload into create rows + primary product fields.
 * Requires 1–3 sellable packs (price + volume > 0 each).
 */
function parseSkusPayload(skusInput, { measurementUnitFallback = null } = {}) {
  if (!Array.isArray(skusInput)) {
    throw createServiceError("skus must be an array of pack options.", 400);
  }

  if (skusInput.length < 1) {
    throw createServiceError("At least one SKU is required.", 400);
  }

  if (skusInput.length > MAX_PRODUCT_SKUS) {
    throw createServiceError(
      `A product may have at most ${MAX_PRODUCT_SKUS} SKUs.`,
      400
    );
  }

  const seen = new Set();
  const rows = skusInput.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw createServiceError(`skus[${index}] must be an object.`, 400);
    }

    const unitRaw =
      typeof entry.measurementUnit === "string" && entry.measurementUnit.trim()
        ? entry.measurementUnit.trim()
        : measurementUnitFallback;

    if (!unitRaw) {
      throw createServiceError(
        `skus[${index}].measurementUnit is required.`,
        400
      );
    }

    const price = parseDecimalInput(entry.price, `skus[${index}].price`, {
      required: true
    });
    const volume = parseDecimalInput(entry.volume, `skus[${index}].volume`, {
      required: true
    });

    if (price == null || Number(price) < 0) {
      throw createServiceError(`skus[${index}].price must be a non-negative number.`, 400);
    }

    if (volume == null || Number(volume) <= 0) {
      throw createServiceError(
        `skus[${index}].volume must be greater than 0.`,
        400
      );
    }

    const key = `${Number(volume).toFixed(2)}|${unitRaw.toLowerCase()}`;
    if (seen.has(key)) {
      throw createServiceError(
        "Each SKU must have a unique volume + measurementUnit combination.",
        400
      );
    }
    seen.add(key);

    const sortOrder =
      entry.sortOrder !== undefined && entry.sortOrder !== null
        ? parseIntegerInput(entry.sortOrder, `skus[${index}].sortOrder`, {
            min: 0
          })
        : index;

    const isVisible =
      entry.isVisible === undefined
        ? true
        : parseOptionalBoolean(entry.isVisible, `skus[${index}].isVisible`);

    const label =
      typeof entry.label === "string" && entry.label.trim()
        ? entry.label.trim()
        : null;

    return {
      id: typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : undefined,
      label,
      volume,
      measurementUnit: unitRaw,
      price,
      sortOrder,
      isVisible
    };
  });

  rows.sort((a, b) => a.sortOrder - b.sortOrder);
  rows.forEach((row, index) => {
    row.sortOrder = index;
  });

  const primary = rows[0];

  return {
    rows,
    primaryPrice: primary.price,
    primaryVolume: primary.volume,
    primaryMeasurementUnit: primary.measurementUnit
  };
}

function legacySkusFromProductFields({
  price,
  volume,
  measurementUnit
}) {
  assertPackPricing({ price, volume });

  if (price == null || volume == null) {
    throw createServiceError(
      "Provide skus (1–3 packs) or both price and volume for a single primary pack.",
      400
    );
  }

  return parseSkusPayload(
    [
      {
        price,
        volume,
        measurementUnit,
        sortOrder: 0,
        isVisible: true
      }
    ],
    { measurementUnitFallback: measurementUnit }
  );
}

function parseIntegerInput(value, fieldName, { min = 0 } = {}) {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < min) {
    throw createServiceError(`${fieldName} must be an integer >= ${min}.`, 400);
  }

  return parsed;
}

async function buildAdminListWhere(query = {}) {
  const where = {};

  if (query.category) {
    const categoryIds = await resolveCategoryIdsIncludingDescendants(
      String(query.category).trim(),
      { activeOnly: false }
    );

    if (!categoryIds || categoryIds.length === 0) {
      where.categoryId = {
        in: []
      };
    } else {
      where.categoryId = {
        in: categoryIds
      };
    }
  }

  if (query.search && String(query.search).trim()) {
    where.OR = buildProductSearchOr(String(query.search).trim());
  }

  if (query.isVisible === "true" || query.isVisible === true) {
    where.isVisible = true;
  } else if (query.isVisible === "false" || query.isVisible === false) {
    where.isVisible = false;
  }

  if (query.isFeatured === "true" || query.isFeatured === true) {
    where.isFeatured = true;
  } else if (query.isFeatured === "false" || query.isFeatured === false) {
    where.isFeatured = false;
  }

  if (query.includeDeleted !== "true" && query.includeDeleted !== true) {
    where.deletedAt = null;
  }

  return where;
}

async function listAdminProducts(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const where = await buildAdminListWhere(query);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: publicProductInclude,
      orderBy: [
        {
          deletedAt: {
            sort: "asc",
            nulls: "first"
          }
        },
        {
          isVisible: "desc"
        },
        {
          createdAt: "desc"
        }
      ],
      skip,
      take: limit
    }),
    prisma.product.count({
      where
    })
  ]);

  return {
    products: products.map(mapAdminProduct),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0
    }
  };
}

async function getAdminProductById(id) {
  const product = await prisma.product.findUnique({
    where: {
      id
    },
    include: publicProductInclude
  });

  if (!product) {
    throw createServiceError("Product not found.", 404);
  }

  return mapAdminProduct(product);
}

async function createAdminProduct(payload = {}) {
  const {
    name,
    slug,
    description,
    price,
    categoryId,
    measurementUnit,
    volume,
    skus,
    productType,
    strainType,
    thcPercent,
    cbdPercent,
    flavors,
    effects,
    isVisible,
    isFeatured
  } = payload;

  if (!name || typeof name !== "string" || !name.trim()) {
    throw createServiceError("Product name is required.", 400);
  }

  await assertCategoryExists(categoryId);

  const normalizedName = name.trim();
  const normalizedSlug = slugify(slug || normalizedName);

  if (!normalizedSlug) {
    throw createServiceError("Product slug is invalid.", 400);
  }

  await ensureUniqueProductSlug(normalizedSlug);

  const normalizedFlavors = normalizeStringArray(flavors, "flavors") ?? [];
  const normalizedEffects = normalizeStringArray(effects, "effects") ?? [];
  const normalizedProductType =
    typeof productType === "string" && productType.trim()
      ? productType.trim()
      : "Flower";
  const normalizedStrainType =
    typeof strainType === "string" && strainType.trim()
      ? strainType.trim()
      : null;

  const unitFallback =
    typeof measurementUnit === "string" && measurementUnit.trim()
      ? measurementUnit.trim()
      : null;

  const parsedSkus =
    skus !== undefined
      ? parseSkusPayload(skus, { measurementUnitFallback: unitFallback })
      : legacySkusFromProductFields({
          price: parseDecimalInput(price, "price", { required: false }),
          volume: parseDecimalInput(volume, "volume"),
          measurementUnit: unitFallback
        });

  if (!unitFallback && !parsedSkus.primaryMeasurementUnit) {
    throw createServiceError("measurementUnit is required.", 400);
  }

  const product = await prisma.product.create({
    data: {
      name: normalizedName,
      slug: normalizedSlug,
      description:
        typeof description === "string" ? description.trim() || null : null,
      price: parsedSkus.primaryPrice,
      categoryId,
      measurementUnit: parsedSkus.primaryMeasurementUnit,
      volume: parsedSkus.primaryVolume,
      productType: normalizedProductType,
      strainType: normalizedStrainType,
      thcPercent: parseDecimalInput(thcPercent, "thcPercent"),
      cbdPercent: parseDecimalInput(cbdPercent, "cbdPercent"),
      flavors: normalizedFlavors,
      effects: normalizedEffects,
      images: [],
      coverImageIndex: 0,
      isVisible: parseOptionalBoolean(isVisible, "isVisible") ?? true,
      isFeatured: parseOptionalBoolean(isFeatured, "isFeatured") ?? false,
      skus: {
        create: parsedSkus.rows.map((row) => ({
          label: row.label,
          volume: row.volume,
          measurementUnit: row.measurementUnit,
          price: row.price,
          sortOrder: row.sortOrder,
          isVisible: row.isVisible
        }))
      }
    },
    include: publicProductInclude
  });

  return mapAdminProduct(product);
}

async function replaceProductSkus(productId, parsedSkus) {
  const existing = await prisma.productSku.findMany({
    where: { productId },
    select: { id: true }
  });
  const existingIds = new Set(existing.map((row) => row.id));
  const keepIds = parsedSkus.rows
    .map((row) => row.id)
    .filter((id) => id && existingIds.has(id));

  await prisma.$transaction(async (tx) => {
    if (keepIds.length) {
      await tx.cartItem.deleteMany({
        where: {
          productId,
          skuId: { notIn: keepIds }
        }
      });
      await tx.productSku.deleteMany({
        where: {
          productId,
          id: { notIn: keepIds }
        }
      });
    } else {
      await tx.cartItem.deleteMany({ where: { productId } });
      await tx.productSku.deleteMany({ where: { productId } });
    }

    for (const row of parsedSkus.rows) {
      if (row.id && existingIds.has(row.id)) {
        await tx.productSku.update({
          where: { id: row.id },
          data: {
            label: row.label,
            volume: row.volume,
            measurementUnit: row.measurementUnit,
            price: row.price,
            sortOrder: row.sortOrder,
            isVisible: row.isVisible
          }
        });
      } else {
        await tx.productSku.create({
          data: {
            productId,
            label: row.label,
            volume: row.volume,
            measurementUnit: row.measurementUnit,
            price: row.price,
            sortOrder: row.sortOrder,
            isVisible: row.isVisible
          }
        });
      }
    }

    await tx.product.update({
      where: { id: productId },
      data: {
        price: parsedSkus.primaryPrice,
        volume: parsedSkus.primaryVolume,
        measurementUnit: parsedSkus.primaryMeasurementUnit
      }
    });
  });
}

async function updateAdminProduct(id, payload = {}) {
  const existing = await prisma.product.findUnique({
    where: {
      id
    },
    include: {
      skus: true
    }
  });

  if (!existing) {
    throw createServiceError("Product not found.", 404);
  }

  const data = {};

  if (payload.name !== undefined) {
    if (!payload.name || typeof payload.name !== "string" || !payload.name.trim()) {
      throw createServiceError("Product name cannot be empty.", 400);
    }

    data.name = payload.name.trim();
  }

  if (payload.slug !== undefined) {
    const normalizedSlug = slugify(payload.slug);

    if (!normalizedSlug) {
      throw createServiceError("Product slug is invalid.", 400);
    }

    await ensureUniqueProductSlug(normalizedSlug, id);
    data.slug = normalizedSlug;
  }

  if (payload.description !== undefined) {
    data.description =
      typeof payload.description === "string"
        ? payload.description.trim() || null
        : null;
  }

  if (payload.categoryId !== undefined) {
    await assertCategoryExists(payload.categoryId);
    data.categoryId = payload.categoryId;
  }

  if (payload.productType !== undefined) {
    if (
      !payload.productType ||
      typeof payload.productType !== "string" ||
      !payload.productType.trim()
    ) {
      throw createServiceError("productType cannot be empty.", 400);
    }

    data.productType = payload.productType.trim();
  }

  if (payload.strainType !== undefined) {
    data.strainType =
      typeof payload.strainType === "string" && payload.strainType.trim()
        ? payload.strainType.trim()
        : null;
  }

  if (payload.thcPercent !== undefined) {
    data.thcPercent = parseDecimalInput(payload.thcPercent, "thcPercent");
  }

  if (payload.cbdPercent !== undefined) {
    data.cbdPercent = parseDecimalInput(payload.cbdPercent, "cbdPercent");
  }

  if (payload.flavors !== undefined) {
    data.flavors = normalizeStringArray(payload.flavors, "flavors");
  }

  if (payload.effects !== undefined) {
    data.effects = normalizeStringArray(payload.effects, "effects");
  }

  if (payload.coverImageIndex !== undefined) {
    data.coverImageIndex = parseIntegerInput(
      payload.coverImageIndex,
      "coverImageIndex",
      { min: 0 }
    );
  }

  if (payload.isVisible !== undefined) {
    data.isVisible = parseOptionalBoolean(payload.isVisible, "isVisible");
  }

  if (payload.isFeatured !== undefined) {
    data.isFeatured = parseOptionalBoolean(payload.isFeatured, "isFeatured");
  }

  let parsedSkus = null;

  if (payload.skus !== undefined) {
    const unitFallback =
      payload.measurementUnit !== undefined &&
      typeof payload.measurementUnit === "string" &&
      payload.measurementUnit.trim()
        ? payload.measurementUnit.trim()
        : existing.measurementUnit;
    parsedSkus = parseSkusPayload(payload.skus, {
      measurementUnitFallback: unitFallback
    });
    data.price = parsedSkus.primaryPrice;
    data.volume = parsedSkus.primaryVolume;
    data.measurementUnit = parsedSkus.primaryMeasurementUnit;
  } else if (
    payload.price !== undefined ||
    payload.volume !== undefined ||
    payload.measurementUnit !== undefined
  ) {
    // Legacy single-pack patch: update primary SKU fields + product denormalized columns.
    const nextPrice =
      payload.price !== undefined
        ? parseDecimalInput(payload.price, "price", { required: false })
        : existing.price != null
          ? Number(existing.price).toFixed(2)
          : null;
    const nextVolume =
      payload.volume !== undefined
        ? parseDecimalInput(payload.volume, "volume")
        : existing.volume != null
          ? Number(existing.volume).toFixed(2)
          : null;
    const nextUnit =
      payload.measurementUnit !== undefined
        ? String(payload.measurementUnit).trim()
        : existing.measurementUnit;

    if (!nextUnit) {
      throw createServiceError("measurementUnit cannot be empty.", 400);
    }

    assertPackPricing({ price: nextPrice, volume: nextVolume });

    data.price = nextPrice;
    data.volume = nextVolume;
    data.measurementUnit = nextUnit;

    const primarySku =
      (existing.skus || []).slice().sort((a, b) => a.sortOrder - b.sortOrder)[0] ||
      null;

    if (nextPrice != null && nextVolume != null) {
      if (primarySku) {
        await prisma.productSku.update({
          where: { id: primarySku.id },
          data: {
            price: nextPrice,
            volume: nextVolume,
            measurementUnit: nextUnit
          }
        });
      } else {
        await prisma.productSku.create({
          data: {
            productId: id,
            price: nextPrice,
            volume: nextVolume,
            measurementUnit: nextUnit,
            sortOrder: 0,
            isVisible: true
          }
        });
      }
    }
  }

  if (parsedSkus) {
    await replaceProductSkus(id, parsedSkus);
  }

  const product = await prisma.product.update({
    where: {
      id
    },
    data,
    include: publicProductInclude
  });

  return mapAdminProduct(product);
}

async function setAdminProductVisibility(id, isVisible) {
  if (typeof isVisible !== "boolean") {
    throw createServiceError("isVisible must be a boolean.", 400);
  }

  const existing = await prisma.product.findUnique({
    where: {
      id
    }
  });

  if (!existing) {
    throw createServiceError("Product not found.", 404);
  }

  if (existing.deletedAt) {
    throw createServiceError(
      "Cannot change visibility of a soft-deleted product. Restore it first.",
      400
    );
  }

  const product = await prisma.product.update({
    where: {
      id
    },
    data: {
      isVisible
    },
    include: publicProductInclude
  });

  return mapAdminProduct(product);
}

async function softDeleteAdminProduct(id) {
  const existing = await prisma.product.findUnique({
    where: {
      id
    }
  });

  if (!existing) {
    throw createServiceError("Product not found.", 404);
  }

  if (existing.deletedAt) {
    throw createServiceError("Product is already deleted.", 400);
  }

  const product = await prisma.product.update({
    where: {
      id
    },
    data: {
      deletedAt: new Date(),
      isVisible: false
    },
    include: publicProductInclude
  });

  return mapAdminProduct(product);
}

async function restoreAdminProduct(id) {
  const existing = await prisma.product.findUnique({
    where: {
      id
    }
  });

  if (!existing) {
    throw createServiceError("Product not found.", 404);
  }

  if (!existing.deletedAt) {
    throw createServiceError("Product is not deleted.", 400);
  }

  const product = await prisma.product.update({
    where: {
      id
    },
    data: {
      deletedAt: null,
      isVisible: true
    },
    include: publicProductInclude
  });

  return mapAdminProduct(product);
}

async function uploadAdminProductImage(productId, file) {
  if (!file || !file.buffer) {
    throw createServiceError("Image file is required.", 400);
  }

  const existing = await prisma.product.findUnique({
    where: {
      id: productId
    }
  });

  if (!existing) {
    throw createServiceError("Product not found.", 404);
  }

  if (existing.deletedAt) {
    throw createServiceError(
      "Cannot upload images to a soft-deleted product. Restore it first.",
      400
    );
  }

  const currentImages = normalizeProductImages(existing.images);

  if (currentImages.length >= 4) {
    throw createServiceError("A product can have at most 4 images.", 400);
  }

  const uploadedImage = await uploadProductImageBuffer({
    productId,
    buffer: file.buffer,
    originalName: file.originalname
  });

  const nextImages = [...currentImages, uploadedImage];
  const coverImageIndex =
    currentImages.length === 0 ? 0 : existing.coverImageIndex;

  const product = await prisma.product.update({
    where: {
      id: productId
    },
    data: {
      images: nextImages,
      coverImageIndex
    },
    include: publicProductInclude
  });

  return {
    product: mapAdminProduct(product),
    image: uploadedImage
  };
}

function resolveCoverImageIndexAfterDelete(images, previousCoverIndex, deletedIndex) {
  if (images.length === 0) {
    return 0;
  }

  if (deletedIndex < previousCoverIndex) {
    return Math.min(previousCoverIndex - 1, images.length - 1);
  }

  if (deletedIndex === previousCoverIndex) {
    return 0;
  }

  return Math.min(previousCoverIndex, images.length - 1);
}

async function deleteAdminProductImage(productId, imageId) {
  if (!imageId) {
    throw createServiceError("Image id is required.", 400);
  }

  const existing = await prisma.product.findUnique({
    where: {
      id: productId
    }
  });

  if (!existing) {
    throw createServiceError("Product not found.", 404);
  }

  const currentImages = normalizeProductImages(existing.images);
  const imageIndex = currentImages.findIndex((image) => image.id === imageId);

  if (imageIndex === -1) {
    throw createServiceError("Product image not found.", 404);
  }

  const image = currentImages[imageIndex];

  if (image.path) {
    await deleteProductImageFromStorage(image.path);
  }

  const nextImages = currentImages.filter((item) => item.id !== imageId);
  const coverImageIndex = resolveCoverImageIndexAfterDelete(
    nextImages,
    existing.coverImageIndex,
    imageIndex
  );

  const product = await prisma.product.update({
    where: {
      id: productId
    },
    data: {
      images: nextImages,
      coverImageIndex
    },
    include: publicProductInclude
  });

  return {
    product: mapAdminProduct(product),
    deletedImageId: imageId
  };
}

async function setAdminProductCoverImage(productId, imageId) {
  if (!imageId) {
    throw createServiceError("Image id is required.", 400);
  }

  const existing = await prisma.product.findUnique({
    where: {
      id: productId
    }
  });

  if (!existing) {
    throw createServiceError("Product not found.", 404);
  }

  const currentImages = normalizeProductImages(existing.images);

  if (currentImages.length === 0) {
    throw createServiceError("Product has no images to set as cover.", 400);
  }

  const coverImageIndex = currentImages.findIndex((image) => image.id === imageId);

  if (coverImageIndex === -1) {
    throw createServiceError("Product image not found.", 404);
  }

  const product = await prisma.product.update({
    where: {
      id: productId
    },
    data: {
      coverImageIndex
    },
    include: publicProductInclude
  });

  return mapAdminProduct(product);
}

async function reorderAdminProductImages(productId, imageIds) {
  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    throw createServiceError("imageIds must be a non-empty array.", 400);
  }

  const existing = await prisma.product.findUnique({
    where: {
      id: productId
    }
  });

  if (!existing) {
    throw createServiceError("Product not found.", 404);
  }

  const currentImages = normalizeProductImages(existing.images);

  if (currentImages.length === 0) {
    throw createServiceError("Product has no images to reorder.", 400);
  }

  if (imageIds.length !== currentImages.length) {
    throw createServiceError(
      "imageIds must include every current product image exactly once.",
      400
    );
  }

  const uniqueIds = new Set(imageIds);

  if (uniqueIds.size !== imageIds.length) {
    throw createServiceError("imageIds contains duplicates.", 400);
  }

  const imagesById = new Map(currentImages.map((image) => [image.id, image]));
  const reorderedImages = [];

  for (const id of imageIds) {
    const image = imagesById.get(id);

    if (!image) {
      throw createServiceError(`Unknown image id in reorder payload: ${id}`, 400);
    }

    reorderedImages.push(image);
  }

  const previousCoverImage =
    currentImages[existing.coverImageIndex] || currentImages[0];
  const coverImageIndex = Math.max(
    0,
    reorderedImages.findIndex((image) => image.id === previousCoverImage.id)
  );

  const product = await prisma.product.update({
    where: {
      id: productId
    },
    data: {
      images: reorderedImages,
      coverImageIndex
    },
    include: publicProductInclude
  });

  return mapAdminProduct(product);
}

module.exports = {
  createAdminProduct,
  deleteAdminProductImage,
  getAdminProductById,
  getPublicProductBySlug,
  listAdminProducts,
  listFeaturedPublicProducts,
  listPublicProducts,
  reorderAdminProductImages,
  restoreAdminProduct,
  setAdminProductCoverImage,
  setAdminProductVisibility,
  softDeleteAdminProduct,
  updateAdminProduct,
  uploadAdminProductImage
};
