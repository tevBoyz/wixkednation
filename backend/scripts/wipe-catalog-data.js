/**
 * Hard-wipe catalog + order test data. Preserves users, addresses, admin_settings,
 * carts (emptied), OTP/session tables.
 *
 * Usage: node scripts/wipe-catalog-data.js
 */
require("dotenv").config();

const prisma = require("../src/config/prisma");
const env = require("../src/config/env");
const { supabaseAdmin } = require("../src/config/supabase");
const {
  deleteProductImageFromStorage
} = require("../src/services/storage/storage.service");

function collectImagePaths(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map((image) => (image && typeof image.path === "string" ? image.path : null))
    .filter(Boolean);
}

async function listAllStoragePathsUnderProducts() {
  const paths = [];
  const bucket = env.supabase.storageBucket;

  async function walk(prefix) {
    const { data, error } = await supabaseAdmin.storage.from(bucket).list(prefix, {
      limit: 1000
    });

    if (error) {
      console.warn(`[wipe] storage list failed for ${prefix}: ${error.message}`);
      return;
    }

    for (const entry of data || []) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;

      // Folders have id null / no metadata size in some API versions
      if (entry.id == null && !entry.metadata) {
        await walk(fullPath);
        continue;
      }

      if (entry.name) {
        paths.push(fullPath);
      }
    }
  }

  await walk("products");
  return paths;
}

async function wipeCatalogData() {
  console.log("Starting catalog wipe (users preserved)...");

  const products = await prisma.product.findMany({
    select: {
      id: true,
      images: true
    }
  });

  const dbImagePaths = products.flatMap((product) =>
    collectImagePaths(product.images)
  );

  const historyDeleted = await prisma.orderStatusHistory.deleteMany({});
  const notificationsDeleted = await prisma.notification.deleteMany({
    where: {
      orderId: {
        not: null
      }
    }
  });
  const ordersDeleted = await prisma.order.deleteMany({});
  const cartItemsDeleted = await prisma.cartItem.deleteMany({});

  const storagePaths = new Set([
    ...dbImagePaths,
    ...(await listAllStoragePathsUnderProducts())
  ]);

  let storageDeleted = 0;
  let storageFailed = 0;

  for (const path of storagePaths) {
    try {
      await deleteProductImageFromStorage(path);
      storageDeleted += 1;
    } catch (error) {
      storageFailed += 1;
      console.warn(`[wipe] storage delete failed ${path}: ${error.message}`);
    }
  }

  const productsDeleted = await prisma.product.deleteMany({});
  const categoriesDeleted = await prisma.category.deleteMany({});

  const summary = {
    orderStatusHistory: historyDeleted.count,
    orderNotifications: notificationsDeleted.count,
    orders: ordersDeleted.count,
    cartItems: cartItemsDeleted.count,
    storagePathsAttempted: storagePaths.size,
    storageDeleted,
    storageFailed,
    products: productsDeleted.count,
    categories: categoriesDeleted.count
  };

  console.log("Catalog wipe completed.", summary);
  return summary;
}

wipeCatalogData()
  .catch((error) => {
    console.error("Catalog wipe failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
