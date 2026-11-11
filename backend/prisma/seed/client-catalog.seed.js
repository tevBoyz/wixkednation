const fs = require("fs");
const path = require("path");

const prisma = require("../../src/config/prisma");
const {
  uploadProductImageBuffer
} = require("../../src/services/storage/storage.service");

const FEATURED_SLUGS = new Set([
  "granddaddy-purple",
  "don-balla",
  "blue-dream",
  "gushers",
  "pluto"
]);

function resolveRepoRoot() {
  return path.resolve(__dirname, "../../..");
}

function loadManifest() {
  const manifestPath = path.join(
    resolveRepoRoot(),
    "baseDocs",
    "images",
    "catalog-seed-manifest.json"
  );

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Catalog manifest not found: ${manifestPath}`);
  }

  return {
    manifest: JSON.parse(fs.readFileSync(manifestPath, "utf8")),
    imageDir: path.join(resolveRepoRoot(), "baseDocs", "images")
  };
}

function normalizeImages(images) {
  return Array.isArray(images) ? images : [];
}

async function upsertCategory(category, categoryBySlug) {
  const parentId = category.parentSlug
    ? categoryBySlug[category.parentSlug]?.id || null
    : null;

  if (category.parentSlug && !parentId) {
    throw new Error(
      `Missing parent category for ${category.slug}: ${category.parentSlug}`
    );
  }

  const existing = await prisma.category.findFirst({
    where: {
      slug: category.slug
    }
  });

  const data = {
    name: category.name,
    description: category.description || null,
    isActive: category.isActive !== false,
    deletedAt: null,
    parentId,
    sortOrder:
      typeof category.sortOrder === "number" ? category.sortOrder : 0
  };

  if (existing) {
    return prisma.category.update({
      where: {
        id: existing.id
      },
      data
    });
  }

  return prisma.category.create({
    data: {
      ...data,
      slug: category.slug
    }
  });
}

async function upsertProduct(productDef, categoryId) {
  const existing = await prisma.product.findFirst({
    where: {
      slug: productDef.slug
    }
  });

  if (productDef.price == null || productDef.price === "") {
    throw new Error(
      `Product "${productDef.slug}" is missing a required price in the catalog manifest.`,
    );
  }

  const data = {
    name: productDef.name,
    slug: productDef.slug,
    description: productDef.description || null,
    price: String(productDef.price),
    categoryId,
    measurementUnit: productDef.measurementUnit || "g",
    volume: productDef.volume == null ? null : String(productDef.volume),
    productType: productDef.productType || "Flower",
    strainType: productDef.strainType || null,
    thcPercent:
      productDef.thcPercent == null ? null : String(productDef.thcPercent),
    cbdPercent:
      productDef.cbdPercent == null ? null : String(productDef.cbdPercent),
    flavors: Array.isArray(productDef.flavors) ? productDef.flavors : [],
    effects: Array.isArray(productDef.effects) ? productDef.effects : [],
    isVisible: productDef.isVisible !== false,
    isFeatured: FEATURED_SLUGS.has(productDef.slug),
    deletedAt: null
  };

  if (existing) {
    const updated = await prisma.product.update({
      where: {
        id: existing.id
      },
      data
    });
    await syncPrimarySku(updated);
    return updated;
  }

  const created = await prisma.product.create({
    data: {
      ...data,
      images: [],
      coverImageIndex: 0
    }
  });
  await syncPrimarySku(created);
  return created;
}

async function syncPrimarySku(product) {
  if (product.price == null || product.volume == null || Number(product.volume) <= 0) {
    return;
  }

  const existingSkus = await prisma.productSku.findMany({
    where: { productId: product.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  const primary = existingSkus[0];
  if (primary) {
    await prisma.productSku.update({
      where: { id: primary.id },
      data: {
        price: String(product.price),
        volume: String(product.volume),
        measurementUnit: product.measurementUnit || "g",
        sortOrder: 0,
        isVisible: true
      }
    });
    return;
  }

  await prisma.productSku.create({
    data: {
      productId: product.id,
      price: String(product.price),
      volume: String(product.volume),
      measurementUnit: product.measurementUnit || "g",
      sortOrder: 0,
      isVisible: true
    }
  });
}

async function ensureProductImages(product, imageFilenames, imageDir) {
  const currentImages = normalizeImages(product.images);
  const existingNames = new Set(
    currentImages
      .map((image) => image.originalName)
      .filter((name) => typeof name === "string")
  );

  let nextImages = [...currentImages];

  for (const filename of imageFilenames) {
    if (existingNames.has(filename)) {
      continue;
    }

    if (nextImages.length >= 4) {
      console.warn(
        `[catalog-seed] Skipping ${filename} for ${product.slug}: image cap 4 reached`
      );
      break;
    }

    const filePath = path.join(imageDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Image file missing: ${filePath}`);
    }

    const buffer = fs.readFileSync(filePath);
    const uploaded = await uploadProductImageBuffer({
      productId: product.id,
      buffer,
      originalName: filename
    });

    nextImages.push({
      id: uploaded.id,
      path: uploaded.path,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
      originalName: uploaded.originalName,
      createdAt: uploaded.createdAt
    });
  }

  if (nextImages.length === currentImages.length) {
    return product;
  }

  return prisma.product.update({
    where: {
      id: product.id
    },
    data: {
      images: nextImages,
      coverImageIndex: 0
    }
  });
}

async function seedClientCatalog() {
  const { manifest, imageDir } = loadManifest();
  const summary = {
    categories: { created: 0, updated: 0 },
    products: { created: 0, updated: 0 },
    imagesUploaded: 0
  };

  const categoryBySlug = {};

  // Parents first, then children (manifest ordered; also two-pass for safety).
  const categoryDefs = manifest.categories || [];
  const orderedCategories = [
    ...categoryDefs.filter((c) => !c.parentSlug),
    ...categoryDefs.filter((c) => c.parentSlug)
  ];

  for (const category of orderedCategories) {
    const before = await prisma.category.findFirst({
      where: { slug: category.slug }
    });
    const saved = await upsertCategory(category, categoryBySlug);
    categoryBySlug[saved.slug] = saved;

    if (before) {
      summary.categories.updated += 1;
    } else {
      summary.categories.created += 1;
    }
  }

  for (const productDef of manifest.products || []) {
    const category = categoryBySlug[productDef.categorySlug];

    if (!category) {
      throw new Error(
        `Missing category for product ${productDef.slug}: ${productDef.categorySlug}`
      );
    }

    const before = await prisma.product.findFirst({
      where: { slug: productDef.slug }
    });
    const beforeImageCount = normalizeImages(before?.images).length;

    let product = await upsertProduct(productDef, category.id);
    product = await ensureProductImages(
      product,
      productDef.images || [],
      imageDir
    );

    const afterImageCount = normalizeImages(product.images).length;
    summary.imagesUploaded += Math.max(0, afterImageCount - beforeImageCount);

    if (before) {
      summary.products.updated += 1;
    } else {
      summary.products.created += 1;
    }
  }

  return summary;
}

module.exports = seedClientCatalog;
