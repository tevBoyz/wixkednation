const prisma = require("../../config/prisma");
const {
  effectivePriceFromMap,
  getActiveSalePricesBySkuIds
} = require("../../services/promo/promo-pricing.service");

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

function parsePositiveInteger(value, fieldName) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw createServiceError(`${fieldName} must be an integer >= 1.`, 400);
  }

  return parsed;
}

function mapCartProduct(product) {
  if (!product) {
    return null;
  }

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: serializeDecimal(product.price),
    measurementUnit: product.measurementUnit,
    volume: serializeDecimal(product.volume),
    images: product.images,
    coverImageIndex: product.coverImageIndex,
    isFeatured: product.isFeatured
  };
}

function mapCartSku(sku) {
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
    isVisible: sku.isVisible
  };
}

function resolveLineUnitPrice(item, saleMap) {
  const skuId = item.skuId || item.sku?.id;
  const listPrice =
    item.sku && item.sku.price != null
      ? item.sku.price
      : item.product && item.product.price != null
        ? item.product.price
        : null;

  return effectivePriceFromMap(skuId, listPrice, saleMap || new Map());
}

function mapCartItem(item, saleMap) {
  const baseVolume =
    item.volume != null
      ? Number(item.volume)
      : item.sku?.volume != null
        ? Number(item.sku.volume)
        : item.product?.volume != null
          ? Number(item.product.volume)
          : null;
  const effectiveVolume =
    baseVolume != null && Number.isFinite(baseVolume)
      ? (baseVolume * item.quantity).toFixed(2)
      : null;
  const unitPrice = resolveLineUnitPrice(item, saleMap);
  const mappedSku = mapCartSku(item.sku);
  if (mappedSku && unitPrice != null) {
    mappedSku.price = unitPrice.toFixed(2);
    mappedSku.listPrice =
      item.sku?.price != null ? serializeDecimal(item.sku.price) : null;
  }

  return {
    id: item.id,
    productId: item.productId,
    skuId: item.skuId,
    quantity: item.quantity,
    volume: serializeDecimal(item.volume ?? item.sku?.volume),
    effectiveVolume,
    measurementUnit: item.measurementUnit || item.sku?.measurementUnit || null,
    sku: mappedSku,
    product: mapCartProduct(item.product),
    lineTotal:
      unitPrice != null ? (unitPrice * item.quantity).toFixed(2) : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

async function mapCart(cart) {
  const skuIds = (cart.items || []).map((item) => item.skuId);
  const saleMap = await getActiveSalePricesBySkuIds(skuIds);
  const items = (cart.items || []).map((item) => mapCartItem(item, saleMap));
  const totalAmount = items
    .reduce((sum, item) => sum + Number(item.lineTotal || 0), 0)
    .toFixed(2);

  return {
    id: cart.id,
    userId: cart.userId,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt
  };
}

const cartItemInclude = {
  product: {
    include: {
      category: true
    }
  },
  sku: true
};

async function getOrCreateCart(userId) {
  const existing = await prisma.cart.findUnique({
    where: {
      userId
    },
    include: {
      items: {
        include: cartItemInclude,
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.cart.create({
    data: {
      userId
    },
    include: {
      items: {
        include: cartItemInclude,
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });
}

function isPurchasableProduct(product) {
  return Boolean(
    product &&
      product.deletedAt == null &&
      product.isVisible === true &&
      product.category &&
      product.category.deletedAt == null &&
      product.category.isActive === true
  );
}

function isPurchasableSku(sku, productId) {
  return Boolean(
    sku &&
      sku.isVisible === true &&
      sku.price != null &&
      Number(sku.volume) > 0 &&
      (!productId || sku.productId === productId)
  );
}

async function getPurchasableProduct(productId) {
  const product = await prisma.product.findUnique({
    where: {
      id: productId
    },
    include: {
      category: true
    }
  });

  if (!isPurchasableProduct(product)) {
    throw createServiceError("Product is unavailable.", 400);
  }

  return product;
}

async function getPurchasableSku(productId, skuId) {
  if (!skuId || typeof skuId !== "string") {
    throw createServiceError("skuId is required.", 400);
  }

  const sku = await prisma.productSku.findUnique({
    where: { id: skuId }
  });

  if (!isPurchasableSku(sku, productId)) {
    throw createServiceError(
      "Selected pack is unavailable. Choose another size or contact support.",
      400
    );
  }

  return sku;
}

async function removeInvalidCartItems(cart) {
  const invalidIds = (cart.items || [])
    .filter(
      (item) =>
        !isPurchasableProduct(item.product) ||
        !isPurchasableSku(item.sku, item.productId)
    )
    .map((item) => item.id);

  if (invalidIds.length === 0) {
    return cart;
  }

  await prisma.cartItem.deleteMany({
    where: {
      id: {
        in: invalidIds
      }
    }
  });

  return getOrCreateCart(cart.userId);
}

async function getCartForUser(userId) {
  let cart = await getOrCreateCart(userId);
  cart = await removeInvalidCartItems(cart);
  return mapCart(cart);
}

async function findMatchingCartItem(cartId, productId, skuId) {
  return prisma.cartItem.findFirst({
    where: {
      cartId,
      productId,
      skuId
    },
    include: cartItemInclude
  });
}

async function addCartItem(userId, payload = {}) {
  const { productId, skuId, quantity } = payload;

  if (!productId || typeof productId !== "string") {
    throw createServiceError("productId is required.", 400);
  }

  const parsedQuantity = parsePositiveInteger(quantity, "quantity");
  await getPurchasableProduct(productId);
  const sku = await getPurchasableSku(productId, skuId);

  const cart = await getOrCreateCart(userId);
  const existingItem = await findMatchingCartItem(cart.id, productId, sku.id);

  if (existingItem) {
    await prisma.cartItem.update({
      where: {
        id: existingItem.id
      },
      data: {
        quantity: existingItem.quantity + parsedQuantity
      }
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        skuId: sku.id,
        quantity: parsedQuantity,
        volume: Number(sku.volume).toFixed(2),
        measurementUnit: sku.measurementUnit
      }
    });
  }

  return getCartForUser(userId);
}

async function getOwnedCartItem(userId, itemId) {
  const item = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cart: {
        userId
      }
    },
    include: {
      ...cartItemInclude,
      cart: true
    }
  });

  if (!item) {
    throw createServiceError("Cart item not found.", 404);
  }

  return item;
}

async function updateCartItem(userId, itemId, payload = {}) {
  const item = await getOwnedCartItem(userId, itemId);

  if (
    !isPurchasableProduct(item.product) ||
    !isPurchasableSku(item.sku, item.productId)
  ) {
    await prisma.cartItem.delete({
      where: {
        id: item.id
      }
    });
    throw createServiceError(
      "Pack is unavailable and was removed from cart.",
      400
    );
  }

  const data = {};

  if (payload.quantity !== undefined) {
    data.quantity = parsePositiveInteger(payload.quantity, "quantity");
  }

  if (payload.skuId !== undefined) {
    const nextSku = await getPurchasableSku(item.productId, payload.skuId);
    data.skuId = nextSku.id;
    data.volume = Number(nextSku.volume).toFixed(2);
    data.measurementUnit = nextSku.measurementUnit;
  }

  if (Object.keys(data).length === 0) {
    throw createServiceError("No cart item fields provided to update.", 400);
  }

  const nextSkuId = data.skuId !== undefined ? data.skuId : item.skuId;

  const conflict = await findMatchingCartItem(
    item.cartId,
    item.productId,
    nextSkuId
  );

  if (conflict && conflict.id !== item.id) {
    throw createServiceError(
      "Another cart item already exists for this product pack.",
      409
    );
  }

  await prisma.cartItem.update({
    where: {
      id: item.id
    },
    data
  });

  return getCartForUser(userId);
}

async function removeCartItem(userId, itemId) {
  const item = await getOwnedCartItem(userId, itemId);

  await prisma.cartItem.delete({
    where: {
      id: item.id
    }
  });

  return getCartForUser(userId);
}

async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id
    }
  });

  return getCartForUser(userId);
}

async function findProductAndSkuForMerge(productId, skuId) {
  if (!productId || typeof productId !== "string") {
    return null;
  }

  if (!skuId || typeof skuId !== "string") {
    return null;
  }

  const product = await prisma.product.findUnique({
    where: {
      id: productId
    },
    include: {
      category: true
    }
  });

  if (!isPurchasableProduct(product)) {
    return null;
  }

  const sku = await prisma.productSku.findUnique({
    where: { id: skuId }
  });

  if (!isPurchasableSku(sku, productId)) {
    return null;
  }

  return { product, sku };
}

async function mergeGuestCart(userId, payload = {}) {
  const guestItems = payload.items;

  if (!Array.isArray(guestItems)) {
    throw createServiceError("items must be an array.", 400);
  }

  const cart = await getOrCreateCart(userId);
  const summary = {
    merged: 0,
    skipped: 0,
    skippedProductIds: []
  };

  for (const guestItem of guestItems) {
    if (!guestItem || typeof guestItem !== "object") {
      summary.skipped += 1;
      continue;
    }

    let quantity;

    try {
      quantity = parsePositiveInteger(guestItem.quantity, "quantity");
    } catch {
      summary.skipped += 1;
      if (guestItem.productId) {
        summary.skippedProductIds.push(guestItem.productId);
      }
      continue;
    }

    const resolved = await findProductAndSkuForMerge(
      guestItem.productId,
      guestItem.skuId
    );

    if (!resolved) {
      summary.skipped += 1;
      if (guestItem.productId) {
        summary.skippedProductIds.push(guestItem.productId);
      }
      continue;
    }

    const { product, sku } = resolved;
    const existingItem = await findMatchingCartItem(
      cart.id,
      product.id,
      sku.id
    );

    if (existingItem) {
      await prisma.cartItem.update({
        where: {
          id: existingItem.id
        },
        data: {
          quantity: existingItem.quantity + quantity
        }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          skuId: sku.id,
          quantity,
          volume: Number(sku.volume).toFixed(2),
          measurementUnit: sku.measurementUnit
        }
      });
    }

    summary.merged += 1;
  }

  const mergedCart = await getCartForUser(userId);

  return {
    cart: mergedCart,
    summary
  };
}

module.exports = {
  addCartItem,
  clearCart,
  getCartForUser,
  getOrCreateCart,
  mergeGuestCart,
  removeCartItem,
  removeInvalidCartItems,
  updateCartItem
};
