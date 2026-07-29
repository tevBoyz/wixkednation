const prisma = require("../../config/prisma");

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

function parseOptionalVolume(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw createServiceError("volume must be a non-negative number.", 400);
  }

  return parsed.toFixed(2);
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

function mapCartItem(item) {
  const baseVolume =
    item.volume != null
      ? Number(item.volume)
      : item.product?.volume != null
        ? Number(item.product.volume)
        : null;
  const effectiveVolume =
    baseVolume != null && Number.isFinite(baseVolume)
      ? (baseVolume * item.quantity).toFixed(2)
      : null;

  return {
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    volume: serializeDecimal(item.volume),
    effectiveVolume,
    measurementUnit: item.measurementUnit,
    product: mapCartProduct(item.product),
    lineTotal:
      item.product && item.product.price != null
        ? (Number(item.product.price) * item.quantity).toFixed(2)
        : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function mapCart(cart) {
  const items = (cart.items || []).map(mapCartItem);
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
  }
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

  if (product.price == null) {
    throw createServiceError(
      "Price not set - contact for price. This product cannot be added to cart.",
      400
    );
  }

  if (product.volume == null || Number(product.volume) <= 0) {
    throw createServiceError(
      "Product pack volume is not set. Admin must define volume with price (e.g. 1 g).",
      400
    );
  }

  return product;
}

async function removeInvalidCartItems(cart) {
  const invalidIds = (cart.items || [])
    .filter((item) => !isPurchasableProduct(item.product))
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

async function findMatchingCartItem(cartId, productId, volume, measurementUnit) {
  const items = await prisma.cartItem.findMany({
    where: {
      cartId,
      productId,
      measurementUnit
    },
    include: cartItemInclude
  });

  const normalizedVolume = volume === null ? null : Number(volume).toFixed(2);

  return (
    items.find((item) => {
      const itemVolume =
        item.volume === null || item.volume === undefined
          ? null
          : Number(item.volume).toFixed(2);

      return itemVolume === normalizedVolume;
    }) || null
  );
}

async function addCartItem(userId, payload = {}) {
  const { productId, quantity, volume, measurementUnit } = payload;

  if (!productId || typeof productId !== "string") {
    throw createServiceError("productId is required.", 400);
  }

  const parsedQuantity = parsePositiveInteger(quantity, "quantity");
  const product = await getPurchasableProduct(productId);

  const resolvedMeasurementUnit =
    typeof measurementUnit === "string" && measurementUnit.trim()
      ? measurementUnit.trim()
      : product.measurementUnit;

  const resolvedVolume =
    volume !== undefined
      ? parseOptionalVolume(volume)
      : product.volume != null
        ? Number(product.volume).toFixed(2)
        : null;

  const cart = await getOrCreateCart(userId);
  const existingItem = await findMatchingCartItem(
    cart.id,
    productId,
    resolvedVolume,
    resolvedMeasurementUnit
  );

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
        quantity: parsedQuantity,
        volume: resolvedVolume,
        measurementUnit: resolvedMeasurementUnit
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

  if (!isPurchasableProduct(item.product)) {
    await prisma.cartItem.delete({
      where: {
        id: item.id
      }
    });
    throw createServiceError("Product is unavailable and was removed from cart.", 400);
  }

  const data = {};

  if (payload.quantity !== undefined) {
    data.quantity = parsePositiveInteger(payload.quantity, "quantity");
  }

  if (payload.volume !== undefined) {
    data.volume = parseOptionalVolume(payload.volume);
  }

  if (payload.measurementUnit !== undefined) {
    if (
      !payload.measurementUnit ||
      typeof payload.measurementUnit !== "string" ||
      !payload.measurementUnit.trim()
    ) {
      throw createServiceError("measurementUnit cannot be empty.", 400);
    }

    data.measurementUnit = payload.measurementUnit.trim();
  }

  if (Object.keys(data).length === 0) {
    throw createServiceError("No cart item fields provided to update.", 400);
  }

  const nextVolume = data.volume !== undefined ? data.volume : item.volume;
  const nextUnit =
    data.measurementUnit !== undefined
      ? data.measurementUnit
      : item.measurementUnit;

  const conflict = await findMatchingCartItem(
    item.cartId,
    item.productId,
    nextVolume != null ? Number(nextVolume).toFixed(2) : null,
    nextUnit
  );

  if (conflict && conflict.id !== item.id) {
    throw createServiceError(
      "Another cart item already exists for this product/volume combination.",
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

async function findProductForMerge(productId) {
  if (!productId || typeof productId !== "string") {
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

  if (product.price == null) {
    return null;
  }

  if (product.volume == null || Number(product.volume) <= 0) {
    return null;
  }

  return product;
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
    } catch (error) {
      summary.skipped += 1;
      if (guestItem.productId) {
        summary.skippedProductIds.push(guestItem.productId);
      }
      continue;
    }

    const product = await findProductForMerge(guestItem.productId);

    if (!product) {
      summary.skipped += 1;
      if (guestItem.productId) {
        summary.skippedProductIds.push(guestItem.productId);
      }
      continue;
    }

    const resolvedMeasurementUnit =
      typeof guestItem.measurementUnit === "string" &&
      guestItem.measurementUnit.trim()
        ? guestItem.measurementUnit.trim()
        : product.measurementUnit;

    let resolvedVolume;

    try {
      resolvedVolume =
        guestItem.volume !== undefined
          ? parseOptionalVolume(guestItem.volume)
          : product.volume != null
            ? Number(product.volume).toFixed(2)
            : null;
    } catch (error) {
      summary.skipped += 1;
      summary.skippedProductIds.push(product.id);
      continue;
    }

    const existingItem = await findMatchingCartItem(
      cart.id,
      product.id,
      resolvedVolume,
      resolvedMeasurementUnit
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
          quantity,
          volume: resolvedVolume,
          measurementUnit: resolvedMeasurementUnit
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
