const prisma = require("../../src/config/prisma");

const QA_SLUG_PREFIX = "qa-";

const TEST_CATEGORIES = [
  {
    slug: "qa-fruits",
    name: "QA Fruits",
    description: "Test-only fruit category (safe to remove with seed:test-products:clean)."
  },
  {
    slug: "qa-vegetables",
    name: "QA Vegetables",
    description: "Test-only vegetable category (safe to remove with seed:test-products:clean)."
  },
  {
    slug: "qa-dairy",
    name: "QA Dairy",
    description: "Test-only dairy category (safe to remove with seed:test-products:clean)."
  },
  {
    slug: "qa-grains",
    name: "QA Grains",
    description: "Test-only grains category (safe to remove with seed:test-products:clean)."
  }
];

const TEST_PRODUCTS = [
  {
    slug: "qa-banana",
    categorySlug: "qa-fruits",
    name: "QA Banana",
    description: "Seed test product — ripe bananas by the kilogram.",
    price: "89.00",
    measurementUnit: "kg",
    volume: "1.00",
    isVisible: true,
    isFeatured: true
  },
  {
    slug: "qa-mango",
    categorySlug: "qa-fruits",
    name: "QA Mango",
    description: "Seed test product — seasonal mangoes.",
    price: "145.50",
    measurementUnit: "kg",
    volume: "1.00",
    isVisible: true,
    isFeatured: false
  },
  {
    slug: "qa-avocado",
    categorySlug: "qa-fruits",
    name: "QA Avocado",
    description: "Seed test product — Hass avocados sold per piece.",
    price: "35.00",
    measurementUnit: "pcs",
    volume: "1.00",
    isVisible: true,
    isFeatured: false
  },
  {
    slug: "qa-onion",
    categorySlug: "qa-vegetables",
    name: "QA Red Onion",
    description: "Seed test product — red onions for cooking.",
    price: "62.00",
    measurementUnit: "kg",
    volume: "1.00",
    isVisible: true,
    isFeatured: true
  },
  {
    slug: "qa-potato",
    categorySlug: "qa-vegetables",
    name: "QA Potato",
    description: "Seed test product — white potatoes.",
    price: "48.75",
    measurementUnit: "kg",
    volume: "1.00",
    isVisible: true,
    isFeatured: false
  },
  {
    slug: "qa-carrot",
    categorySlug: "qa-vegetables",
    name: "QA Carrot",
    description: "Seed test product — fresh carrots.",
    price: "55.00",
    measurementUnit: "kg",
    volume: "1.00",
    isVisible: true,
    isFeatured: false
  },
  {
    slug: "qa-milk",
    categorySlug: "qa-dairy",
    name: "QA Fresh Milk",
    description: "Seed test product — pasteurized milk.",
    price: "95.00",
    measurementUnit: "L",
    volume: "1.00",
    isVisible: true,
    isFeatured: true
  },
  {
    slug: "qa-yogurt",
    categorySlug: "qa-dairy",
    name: "QA Yogurt",
    description: "Seed test product — plain yogurt cups.",
    price: "42.00",
    measurementUnit: "pcs",
    volume: "1.00",
    isVisible: true,
    isFeatured: false
  },
  {
    slug: "qa-rice",
    categorySlug: "qa-grains",
    name: "QA White Rice",
    description: "Seed test product — long-grain white rice.",
    price: "118.00",
    measurementUnit: "kg",
    volume: "5.00",
    isVisible: true,
    isFeatured: true
  },
  {
    slug: "qa-teff",
    categorySlug: "qa-grains",
    name: "QA Teff Flour",
    description: "Seed test product — teff flour for injera.",
    price: "210.00",
    measurementUnit: "kg",
    volume: "1.00",
    isVisible: true,
    isFeatured: false
  },
  {
    slug: "qa-hidden-item",
    categorySlug: "qa-grains",
    name: "QA Hidden Item",
    description: "Seed test product — hidden from public catalog (admin visibility testing).",
    price: "25.00",
    measurementUnit: "pcs",
    volume: "1.00",
    isVisible: false,
    isFeatured: false
  }
];

function isQaSlug(slug) {
  return typeof slug === "string" && slug.startsWith(QA_SLUG_PREFIX);
}

async function seedTestProducts() {
  const summary = {
    marker: QA_SLUG_PREFIX,
    categories: [],
    products: [],
    note:
      "All QA catalog rows use slug prefix qa-. Remove with: npm run seed:test-products:clean"
  };

  for (const category of TEST_CATEGORIES) {
    const saved = await prisma.category.upsert({
      where: {
        slug: category.slug
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        isActive: true
      },
      update: {
        name: category.name,
        description: category.description,
        isActive: true,
        deletedAt: null
      }
    });

    summary.categories.push({
      id: saved.id,
      slug: saved.slug,
      name: saved.name
    });
  }

  const categoryBySlug = Object.fromEntries(
    (
      await prisma.category.findMany({
        where: {
          slug: {
            in: TEST_CATEGORIES.map((entry) => entry.slug)
          }
        },
        select: {
          id: true,
          slug: true
        }
      })
    ).map((entry) => [entry.slug, entry.id])
  );

  for (const product of TEST_PRODUCTS) {
    const categoryId = categoryBySlug[product.categorySlug];

    if (!categoryId) {
      throw new Error(`Missing QA category for product ${product.slug}.`);
    }

    const existing = await prisma.product.findUnique({
      where: {
        slug: product.slug
      },
      select: {
        id: true
      }
    });

    const saved = await prisma.product.upsert({
      where: {
        slug: product.slug
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        categoryId,
        measurementUnit: product.measurementUnit,
        volume: product.volume,
        images: [],
        coverImageIndex: 0,
        isVisible: product.isVisible,
        isFeatured: product.isFeatured
      },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        categoryId,
        measurementUnit: product.measurementUnit,
        volume: product.volume,
        isVisible: product.isVisible,
        isFeatured: product.isFeatured,
        deletedAt: null
      }
    });

    summary.products.push({
      id: saved.id,
      slug: saved.slug,
      name: saved.name,
      action: existing ? "updated" : "created"
    });
  }

  return summary;
}

async function listTestProducts() {
  const categories = await prisma.category.findMany({
    where: {
      slug: {
        startsWith: QA_SLUG_PREFIX
      }
    },
    orderBy: {
      slug: "asc"
    },
    select: {
      id: true,
      slug: true,
      name: true,
      isActive: true,
      deletedAt: true,
      _count: {
        select: {
          products: true
        }
      }
    }
  });

  const products = await prisma.product.findMany({
    where: {
      slug: {
        startsWith: QA_SLUG_PREFIX
      }
    },
    orderBy: {
      slug: "asc"
    },
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      measurementUnit: true,
      isVisible: true,
      isFeatured: true,
      deletedAt: true,
      category: {
        select: {
          slug: true,
          name: true
        }
      }
    }
  });

  return {
    marker: QA_SLUG_PREFIX,
    categories,
    products
  };
}

async function cleanTestProducts({ hard = false } = {}) {
  const qaProducts = await prisma.product.findMany({
    where: {
      slug: {
        startsWith: QA_SLUG_PREFIX
      }
    },
    select: {
      id: true,
      slug: true
    }
  });

  const qaCategories = await prisma.category.findMany({
    where: {
      slug: {
        startsWith: QA_SLUG_PREFIX
      }
    },
    select: {
      id: true,
      slug: true
    }
  });

  if (hard) {
    const productIds = qaProducts.map((entry) => entry.id);

    if (productIds.length > 0) {
      await prisma.cartItem.deleteMany({
        where: {
          productId: {
            in: productIds
          }
        }
      });
    }

    const deletedProducts = await prisma.product.deleteMany({
      where: {
        slug: {
          startsWith: QA_SLUG_PREFIX
        }
      }
    });

    const deletedCategories = await prisma.category.deleteMany({
      where: {
        slug: {
          startsWith: QA_SLUG_PREFIX
        }
      }
    });

    return {
      mode: "hard",
      marker: QA_SLUG_PREFIX,
      productsRemoved: deletedProducts.count,
      categoriesRemoved: deletedCategories.count
    };
  }

  const now = new Date();

  const softProducts = await prisma.product.updateMany({
    where: {
      slug: {
        startsWith: QA_SLUG_PREFIX
      },
      deletedAt: null
    },
    data: {
      deletedAt: now,
      isVisible: false,
      isFeatured: false
    }
  });

  const softCategories = await prisma.category.updateMany({
    where: {
      slug: {
        startsWith: QA_SLUG_PREFIX
      },
      deletedAt: null
    },
    data: {
      deletedAt: now,
      isActive: false
    }
  });

  return {
    mode: "soft",
    marker: QA_SLUG_PREFIX,
    productsSoftDeleted: softProducts.count,
    categoriesSoftDeleted: softCategories.count,
    restoreHint: "Run npm run seed:test-products to restore/update QA catalog rows."
  };
}

async function restoreTestProducts() {
  const restoredProducts = await prisma.product.updateMany({
    where: {
      slug: {
        startsWith: QA_SLUG_PREFIX
      },
      deletedAt: {
        not: null
      }
    },
    data: {
      deletedAt: null
    }
  });

  const restoredCategories = await prisma.category.updateMany({
    where: {
      slug: {
        startsWith: QA_SLUG_PREFIX
      },
      deletedAt: {
        not: null
      }
    },
    data: {
      deletedAt: null,
      isActive: true
    }
  });

  const seeded = await seedTestProducts();

  return {
    marker: QA_SLUG_PREFIX,
    productsRestored: restoredProducts.count,
    categoriesRestored: restoredCategories.count,
    seeded
  };
}

module.exports = {
  QA_SLUG_PREFIX,
  TEST_CATEGORIES,
  TEST_PRODUCTS,
  isQaSlug,
  seedTestProducts,
  listTestProducts,
  cleanTestProducts,
  restoreTestProducts
};
