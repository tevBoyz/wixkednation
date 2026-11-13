/**
 * Temporary catalog copied from the public Gas Nation menu.
 * Remove it with: npm run seed:temp-catalog:clean
 *
 * Clean deletes products (and then empty categories) whose slugs still match
 * the live public menu. Do not run clean after you have replaced those slugs
 * with your own products.
 *
 * Usage:
 *   node scripts/seed-temp-catalog.js
 *   node scripts/seed-temp-catalog.js clean
 */
require("dotenv").config();

const prisma = require("../src/config/prisma");
const { uploadProductImageBuffer } = require("../src/services/storage/storage.service");

const SOURCE = "https://api.gasnationweed.com";

async function fetchJson(path) {
  const response = await fetch(`${SOURCE}${path}`);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.message || `Request failed: ${path}`);
  }
  return body.data;
}

function flattenCategories(nodes, list = []) {
  for (const node of nodes) {
    list.push(node);
    if (Array.isArray(node.children) && node.children.length > 0) {
      flattenCategories(node.children, list);
    }
  }
  return list;
}

async function fetchProducts() {
  const products = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const data = await fetchJson(`/api/products?limit=50&page=${page}`);
    products.push(...data.products);
    totalPages = data.pagination?.totalPages || 1;
    page += 1;
  }

  return products;
}

async function upsertCategories(categories) {
  const bySlug = new Map();
  const ordered = [
    ...categories.filter((category) => !category.parentId),
    ...categories.filter((category) => category.parentId)
  ];

  for (const category of ordered) {
    const parentSlug = category.parentId
      ? categories.find((item) => item.id === category.parentId)?.slug
      : null;
    const parent = parentSlug ? bySlug.get(parentSlug) : null;

    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description || null,
        isActive: category.isActive !== false,
        sortOrder: category.sortOrder || 0,
        parentId: parent?.id || null,
        deletedAt: null
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description || null,
        isActive: category.isActive !== false,
        sortOrder: category.sortOrder || 0,
        parentId: parent?.id || null
      }
    });

    bySlug.set(category.slug, saved);
  }

  return bySlug;
}

async function copyCoverImage(productId, image) {
  if (!image?.url) {
    return null;
  }

  const response = await fetch(image.url);
  if (!response.ok) {
    throw new Error(`Image download failed (${response.status})`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return uploadProductImageBuffer({
    productId,
    buffer,
    originalName: "cover.webp"
  });
}

async function seed() {
  const categoryData = await fetchJson("/api/categories");
  const categories = flattenCategories(categoryData.categories);
  const products = await fetchProducts();
  const categoryBySlug = await upsertCategories(categories);

  let withImage = 0;
  let withoutImage = 0;

  for (const product of products) {
    const category = categoryBySlug.get(product.category?.slug);
    if (!category) {
      console.warn(`Skipping ${product.slug}: unknown category ${product.category?.slug}`);
      continue;
    }

    const saved = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description || null,
        price: product.price,
        categoryId: category.id,
        measurementUnit: product.measurementUnit,
        volume: product.volume,
        productType: product.productType || "Flower",
        strainType: product.strainType || null,
        thcPercent: product.thcPercent,
        cbdPercent: product.cbdPercent,
        flavors: product.flavors || [],
        effects: product.effects || [],
        isVisible: true,
        isFeatured: Boolean(product.isFeatured),
        deletedAt: null
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description || null,
        price: product.price,
        categoryId: category.id,
        measurementUnit: product.measurementUnit,
        volume: product.volume,
        productType: product.productType || "Flower",
        strainType: product.strainType || null,
        thcPercent: product.thcPercent,
        cbdPercent: product.cbdPercent,
        flavors: product.flavors || [],
        effects: product.effects || [],
        images: [],
        isVisible: true,
        isFeatured: Boolean(product.isFeatured)
      }
    });

    await prisma.productSku.deleteMany({ where: { productId: saved.id } });

    const skus = Array.isArray(product.skus) ? product.skus : [];
    if (skus.length > 0) {
      await prisma.productSku.createMany({
        data: skus.map((sku, index) => ({
          productId: saved.id,
          label: sku.label || null,
          volume: sku.volume,
          measurementUnit: sku.measurementUnit,
          price: sku.price,
          sortOrder: sku.sortOrder ?? index,
          isVisible: true
        }))
      });
    }

    const existingImages = Array.isArray(saved.images) ? saved.images : [];
    if (existingImages.length === 0 && product.images?.[0]) {
      try {
        const uploaded = await copyCoverImage(saved.id, product.images[0]);
        if (uploaded) {
          await prisma.product.update({
            where: { id: saved.id },
            data: {
              images: [uploaded],
              coverImageIndex: 0
            }
          });
          withImage += 1;
        }
      } catch (error) {
        withoutImage += 1;
        console.warn(`No image for ${product.slug}: ${error.message}`);
      }
    } else if (existingImages.length > 0) {
      withImage += 1;
    } else {
      withoutImage += 1;
    }

    console.log(`Seeded ${product.slug}`);
  }

  console.log(
    `Done. ${products.length} products, ${withImage} with a cover, ${withoutImage} without.`
  );
}

async function clean() {
  const products = await fetchProducts();
  const slugs = products.map((product) => product.slug);
  const categoryData = await fetchJson("/api/categories");
  const categorySlugs = flattenCategories(categoryData.categories).map(
    (category) => category.slug
  );

  const deleted = await prisma.product.deleteMany({
    where: { slug: { in: slugs } }
  });

  const emptyCategories = await prisma.category.findMany({
    where: {
      slug: { in: categorySlugs },
      products: { none: {} },
      children: { none: {} }
    },
    select: { id: true, slug: true }
  });

  if (emptyCategories.length > 0) {
    await prisma.category.deleteMany({
      where: { id: { in: emptyCategories.map((category) => category.id) } }
    });
  }

  const leftoverParents = await prisma.category.findMany({
    where: {
      slug: { in: categorySlugs },
      products: { none: {} },
      children: { none: {} }
    },
    select: { id: true }
  });

  if (leftoverParents.length > 0) {
    await prisma.category.deleteMany({
      where: { id: { in: leftoverParents.map((category) => category.id) } }
    });
  }

  console.log(
    `Removed ${deleted.count} products and ${emptyCategories.length + leftoverParents.length} empty categories.`
  );
}

const command = process.argv[2] === "clean" ? clean : seed;

command()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
