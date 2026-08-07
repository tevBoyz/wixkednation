const crypto = require("crypto");

const prisma = require("../../config/prisma");
const { sendSms } = require("../../services/sms/sms.service");
const {
  sendAdminOrderEmail,
  sendOrderStatusEmail
} = require("../../services/email/email.service");
const { assertDeliveryZip } = require("../../utils/delivery-area");
const { assertUsPhone } = require("../../utils/phone");
const {
  getOrCreateCart,
  removeInvalidCartItems
} = require("../cart/cart.service");
const {
  applyCustomerCancelPenalty,
  applyDeliveryCredit,
  mapReputation
} = require("../reputation/reputation.service");

const ORDER_BURST_LIMIT = 10;
const ORDER_BURST_WINDOW_MS = 60 * 60 * 1000;
const ORDER_BLOCK_DURATION_MS = 48 * 60 * 60 * 1000;
const PENDING_PILE_UP_THRESHOLD = 3;

function createServiceError(message, statusCode, extras = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;

  if (extras.code) {
    error.code = extras.code;
  }

  if (extras.blockedUntil) {
    error.blockedUntil = extras.blockedUntil;
  }

  return error;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(value, fieldName = "id") {
  if (!value || typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw createServiceError(`Invalid ${fieldName}.`, 400);
  }

  return value;
}

function serializeDecimal(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value).toFixed(2);
}

function generateOrderNumber() {
  const now = new Date();
  const stamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0")
  ].join("");

  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${stamp}-${suffix}`;
}

function mapAddressSnapshot(address) {
  return {
    id: address.id,
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode ?? null,
    country: address.country,
    latitude: address.latitude,
    longitude: address.longitude
  };
}

function mapOrderItemSnapshot(cartItem) {
  const product = cartItem.product;
  const sku = cartItem.sku;

  if (!sku || sku.price == null) {
    throw createServiceError(
      `Selected pack is unavailable (${product?.name || "product"}).`,
      400
    );
  }

  if (sku.isVisible === false) {
    throw createServiceError(
      `Selected pack is hidden (${product?.name || "product"}). Choose another size.`,
      400
    );
  }

  const unitPrice = Number(sku.price);
  const quantity = cartItem.quantity;
  const lineTotal = (unitPrice * quantity).toFixed(2);
  const baseVolume =
    cartItem.volume != null
      ? Number(cartItem.volume)
      : sku.volume != null
        ? Number(sku.volume)
        : null;
  const effectiveVolume =
    baseVolume != null && Number.isFinite(baseVolume)
      ? (baseVolume * quantity).toFixed(2)
      : null;

  return {
    productId: product.id,
    skuId: sku.id,
    name: product.name,
    slug: product.slug,
    skuLabel: sku.label || null,
    unitPrice: unitPrice.toFixed(2),
    quantity,
    volume:
      cartItem.volume != null
        ? serializeDecimal(cartItem.volume)
        : serializeDecimal(sku.volume),
    effectiveVolume,
    measurementUnit:
      cartItem.measurementUnit || sku.measurementUnit || product.measurementUnit,
    lineTotal
  };
}

function mapOrder(order) {
  return {
    id: order.id,
    userId: order.userId,
    orderNumber: order.orderNumber,
    items: order.items,
    deliveryAddress: order.deliveryAddress,
    status: order.status,
    totalAmount: serializeDecimal(order.totalAmount),
    paymentMethod: order.paymentMethod,
    placedAsGuest: Boolean(order.placedAsGuest),
    matchedExistingAccount: Boolean(order.matchedExistingAccount),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    deletedAt: order.deletedAt
  };
}

function buildRisk(user, pendingOrderCount) {
  const reputationScore = user?.reputationScore ?? 0;
  const cancelledOrderCount = user?.cancelledOrderCount ?? 0;

  return {
    lowReputation: reputationScore < 0,
    pendingPileUp: pendingOrderCount >= PENDING_PILE_UP_THRESHOLD,
    reputationScore,
    cancelledOrderCount,
    pendingOrderCount
  };
}

function riskSmsPrefix(risk) {
  if (!risk) {
    return "";
  }

  const parts = [];

  if (risk.lowReputation) {
    parts.push("LOW REP");
  }

  if (risk.pendingPileUp) {
    parts.push("PENDING PILE-UP");
  }

  if (parts.length === 0) {
    return "";
  }

  return `[${parts.join(" / ")}] `;
}

async function countPendingOrders(userId, tx = prisma) {
  return tx.order.count({
    where: {
      userId,
      status: "Pending",
      deletedAt: null
    }
  });
}

async function enforceOrderPhoneRateLimit(userId, tx = prisma) {
  const user = await tx.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      orderBlockedUntil: true
    }
  });

  if (!user) {
    throw createServiceError("Customer not found.", 404);
  }

  const now = new Date();

  if (user.orderBlockedUntil && user.orderBlockedUntil > now) {
    throw createServiceError(
      "Too many orders from this number. Please try again later.",
      429,
      {
        code: "ORDER_PHONE_BLOCKED",
        blockedUntil: user.orderBlockedUntil.toISOString()
      }
    );
  }

  const recentCount = await tx.order.count({
    where: {
      userId,
      createdAt: {
        gte: new Date(now.getTime() - ORDER_BURST_WINDOW_MS)
      }
    }
  });

  if (recentCount >= ORDER_BURST_LIMIT) {
    const blockedUntil = new Date(now.getTime() + ORDER_BLOCK_DURATION_MS);

    await tx.user.update({
      where: {
        id: userId
      },
      data: {
        orderBlockedUntil: blockedUntil
      }
    });

    throw createServiceError(
      "Too many orders from this number. Please try again later.",
      429,
      {
        code: "ORDER_PHONE_BLOCKED",
        blockedUntil: blockedUntil.toISOString()
      }
    );
  }
}

async function loadPendingCountsByUserIds(userIds) {
  if (!userIds.length) {
    return new Map();
  }

  const rows = await prisma.order.groupBy({
    by: ["userId"],
    where: {
      userId: {
        in: userIds
      },
      status: "Pending",
      deletedAt: null
    },
    _count: {
      _all: true
    }
  });

  return new Map(rows.map((row) => [row.userId, row._count._all]));
}

function requireNonEmptyString(value, fieldName) {
  if (!value || typeof value !== "string" || !value.trim()) {
    throw createServiceError(`${fieldName} is required.`, 400);
  }

  return value.trim();
}

function normalizeCheckoutPhone(phone) {
  return assertUsPhone(phone, createServiceError);
}

function normalizeCheckoutPostalCode(postalCode) {
  return assertDeliveryZip(postalCode, createServiceError);
}

function assertAddressReadyForDelivery(address) {
  if (!address.postalCode || !String(address.postalCode).trim()) {
    throw createServiceError(
      "Update your delivery address with a ZIP code before checkout.",
      400
    );
  }

  normalizeCheckoutPostalCode(address.postalCode);
}

function parsePositiveInteger(value, fieldName) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw createServiceError(`${fieldName} must be a positive integer.`, 400);
  }

  return parsed;
}

function parseOptionalVolume(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw createServiceError("volume must be a positive number.", 400);
  }

  return parsed.toFixed(2);
}

async function getPurchasableProductForOrder(productId) {
  assertUuid(productId, "productId");

  const product = await prisma.product.findUnique({
    where: {
      id: productId
    },
    include: {
      category: true
    }
  });

  const purchasable = Boolean(
    product &&
      product.deletedAt == null &&
      product.isVisible === true &&
      product.category &&
      product.category.deletedAt == null &&
      product.category.isActive === true
  );

  if (!purchasable) {
    throw createServiceError("Product is unavailable.", 400);
  }

  return product;
}

async function getPurchasableSkuForOrder(productId, skuId) {
  assertUuid(skuId, "skuId");

  const sku = await prisma.productSku.findUnique({
    where: { id: skuId }
  });

  if (
    !sku ||
    sku.productId !== productId ||
    sku.isVisible !== true ||
    sku.price == null ||
    Number(sku.volume) <= 0
  ) {
    throw createServiceError(
      "Selected pack is unavailable. Choose another size.",
      400
    );
  }

  return sku;
}

async function resolveGuestCheckoutUser(phone) {
  const existingByPhone = await prisma.user.findFirst({
    where: {
      phone
    }
  });

  if (existingByPhone) {
    if (existingByPhone.deletedAt) {
      throw createServiceError("User account is disabled.", 403);
    }

    return {
      user: existingByPhone,
      matchedExistingAccount: true,
      isNewUser: false
    };
  }

  const existingByAddressPhone = await prisma.address.findFirst({
    where: {
      phone,
      deletedAt: null,
      user: {
        deletedAt: null,
        role: "customer"
      }
    },
    include: {
      user: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  if (existingByAddressPhone?.user) {
    return {
      user: existingByAddressPhone.user,
      matchedExistingAccount: true,
      isNewUser: false
    };
  }

  const created = await prisma.user.create({
    data: {
      supabaseUserId: `local-guest:${phone}`,
      phone,
      authProvider: "guest",
      role: "customer"
    }
  });

  return {
    user: created,
    matchedExistingAccount: false,
    isNewUser: true
  };
}

async function buildGuestItemSnapshots(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw createServiceError("items are required.", 400);
  }

  const snapshots = [];

  for (const item of items) {
    if (!item || typeof item !== "object") {
      throw createServiceError("Each cart item must be an object.", 400);
    }

    const product = await getPurchasableProductForOrder(item.productId);
    const sku = await getPurchasableSkuForOrder(item.productId, item.skuId);
    const quantity = parsePositiveInteger(item.quantity, "quantity");

    snapshots.push(
      mapOrderItemSnapshot({
        product,
        sku,
        quantity,
        volume: Number(sku.volume).toFixed(2),
        measurementUnit: sku.measurementUnit
      })
    );
  }

  return snapshots;
}

async function getAdminPhoneNumbers() {
  const settings = await prisma.adminSettings.findFirst({
    orderBy: {
      createdAt: "asc"
    }
  });

  if (!settings || !Array.isArray(settings.adminPhoneNumbers)) {
    return [];
  }

  const phones = settings.adminPhoneNumbers
    .map((entry) => {
      if (typeof entry === "string") {
        return entry.trim();
      }

      if (entry && typeof entry === "object" && typeof entry.phone === "string") {
        return entry.phone.trim();
      }

      return null;
    })
    .filter(Boolean);

  return [...new Set(phones)];
}

async function sendNewOrderAdminAlerts(order, risk = null) {
  const riskPrefix = riskSmsPrefix(risk);
  let smsAlert = {
    attempted: 0,
    sent: 0,
    failed: 0,
    results: []
  };
  let emailAlert = {
    attempted: 0,
    sent: 0,
    failed: 0,
    results: []
  };

  try {
    const phones = await getAdminPhoneNumbers();

    if (phones.length === 0) {
      console.warn(
        `[orders] No admin phone numbers configured for order ${order.orderNumber}.`
      );
    } else {
      const message = `${riskPrefix}New COD order ${order.orderNumber}. Total: ${serializeDecimal(order.totalAmount)}. Status: Pending.`;
      const results = [];
      let sent = 0;
      let failed = 0;

      for (const phone of phones) {
        try {
          const result = await sendSms({
            phone,
            message,
            purpose: "admin_new_order",
            metadata: {
              orderId: order.id,
              orderNumber: order.orderNumber
            }
          });

          if (result.success) {
            sent += 1;
          } else {
            failed += 1;
            console.error(
              `[orders] Admin SMS failed for ${phone} on order ${order.orderNumber}:`,
              result.error || "unknown error"
            );
          }

          results.push({
            phone,
            success: Boolean(result.success),
            provider: result.provider || null,
            smsLogId: result.smsLogId || null,
            error: result.error || null
          });
        } catch (error) {
          failed += 1;
          console.error(
            `[orders] Admin SMS exception for ${phone} on order ${order.orderNumber}:`,
            error.message
          );

          results.push({
            phone,
            success: false,
            provider: null,
            smsLogId: null,
            error: error.message
          });
        }
      }

      smsAlert = {
        attempted: phones.length,
        sent,
        failed,
        results
      };
    }
  } catch (error) {
    console.error(
      `[orders] Admin SMS alert flow failed for order ${order.orderNumber}:`,
      error.message
    );
    smsAlert = {
      attempted: 0,
      sent: 0,
      failed: 0,
      results: [],
      error: error.message
    };
  }

  try {
    emailAlert = await sendAdminOrderEmail({
      order,
      riskPrefix
    });
  } catch (error) {
    console.error(
      `[orders] Admin email alert flow failed for order ${order.orderNumber}:`,
      error.message
    );
    emailAlert = {
      attempted: 0,
      sent: 0,
      failed: 0,
      results: [],
      error: error.message
    };
  }

  return { smsAlert, emailAlert };
}

async function notifyCustomerOrderStatusByEmail({
  userId,
  orderId,
  orderNumber,
  status,
  title,
  message
}) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, deletedAt: true }
    });

    if (!user || user.deletedAt || !user.email) {
      return { skipped: true, reason: "no_email" };
    }

    const result = await sendOrderStatusEmail({
      to: user.email,
      title,
      message,
      orderNumber,
      status,
      orderId
    });

    if (!result.success) {
      console.error(
        `[orders] Customer status email failed for order ${orderNumber}:`,
        result.error || "unknown error"
      );
    }

    return {
      skipped: false,
      success: Boolean(result.success),
      error: result.error || null
    };
  } catch (error) {
    console.error(
      `[orders] Customer status email exception for order ${orderNumber}:`,
      error.message
    );
    return { skipped: false, success: false, error: error.message };
  }
}

async function createOrderFromCart(userId, payload = {}) {
  assertUuid(payload.addressId, "addressId");

  const paymentMethod = payload.paymentMethod || "COD";

  if (paymentMethod !== "COD") {
    throw createServiceError("Only COD payment method is supported.", 400);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      deletedAt: true,
      reputationScore: true,
      cancelledOrderCount: true,
      deliveredOrderCount: true,
      orderBlockedUntil: true
    }
  });

  if (!user || user.deletedAt) {
    throw createServiceError("User account is disabled.", 403);
  }

  await enforceOrderPhoneRateLimit(userId);

  const address = await prisma.address.findFirst({
    where: {
      id: payload.addressId,
      userId,
      deletedAt: null
    }
  });

  if (!address) {
    throw createServiceError("Delivery address not found.", 404);
  }

  assertAddressReadyForDelivery(address);

  let cart = await getOrCreateCart(userId);
  cart = await removeInvalidCartItems(cart);

  if (!cart.items || cart.items.length === 0) {
    throw createServiceError("Cart is empty.", 400);
  }

  const pendingOrderCount = await countPendingOrders(userId);
  const risk = buildRisk(user, pendingOrderCount);

  const itemSnapshots = cart.items.map(mapOrderItemSnapshot);
  const totalAmount = itemSnapshots
    .reduce((sum, item) => sum + Number(item.lineTotal), 0)
    .toFixed(2);
  const deliveryAddress = mapAddressSnapshot(address);

  let order;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNumber = generateOrderNumber();

    try {
      order = await prisma.$transaction(async (tx) => {
        const createdOrder = await tx.order.create({
          data: {
            userId,
            orderNumber,
            items: itemSnapshots,
            deliveryAddress,
            status: "Pending",
            totalAmount,
            paymentMethod: "COD",
            placedAsGuest: false,
            matchedExistingAccount: false
          }
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: createdOrder.id,
            oldStatus: null,
            newStatus: "Pending",
            changedBy: userId,
            note: "Order created"
          }
        });

        await tx.cartItem.deleteMany({
          where: {
            cartId: cart.id
          }
        });

        return createdOrder;
      });

      break;
    } catch (error) {
      if (error.code === "P2002" && attempt < 4) {
        continue;
      }

      throw error;
    }
  }

  if (!order) {
    throw createServiceError("Failed to create order. Please try again.", 500);
  }

  // Alert failure must not fail order creation.
  let smsAlert;
  let emailAlert;

  try {
    const alerts = await sendNewOrderAdminAlerts(order, risk);
    smsAlert = alerts.smsAlert;
    emailAlert = alerts.emailAlert;
  } catch (error) {
    console.error(
      `[orders] Unexpected admin alert failure after creating ${order.orderNumber}:`,
      error.message
    );
    smsAlert = {
      attempted: 0,
      sent: 0,
      failed: 0,
      results: [],
      error: error.message
    };
    emailAlert = {
      attempted: 0,
      sent: 0,
      failed: 0,
      results: [],
      error: error.message
    };
  }

  return {
    order: {
      ...mapOrder(order),
      risk
    },
    smsAlert,
    emailAlert
  };
}

async function createGuestOrder(payload = {}) {
  const paymentMethod = payload.paymentMethod || "COD";

  if (paymentMethod !== "COD") {
    throw createServiceError("Only COD payment method is supported.", 400);
  }

  const phone = normalizeCheckoutPhone(payload.phone);
  const optionalName =
    typeof payload.name === "string" && payload.name.trim()
      ? payload.name.trim()
      : null;

  if (!payload.address || typeof payload.address !== "object") {
    throw createServiceError("address is required.", 400);
  }

  const addressPayload = payload.address;
  const fullName = requireNonEmptyString(addressPayload.fullName, "fullName");
  const addressLine1 = requireNonEmptyString(
    addressPayload.addressLine1,
    "addressLine1"
  );
  const city = requireNonEmptyString(addressPayload.city, "city");
  const postalCode = normalizeCheckoutPostalCode(addressPayload.postalCode);
  const addressPhone = addressPayload.phone
    ? normalizeCheckoutPhone(addressPayload.phone)
    : phone;
  const label =
    typeof addressPayload.label === "string" && addressPayload.label.trim()
      ? addressPayload.label.trim()
      : null;
  const addressLine2 =
    typeof addressPayload.addressLine2 === "string" &&
    addressPayload.addressLine2.trim()
      ? addressPayload.addressLine2.trim()
      : null;
  const state =
    typeof addressPayload.state === "string" && addressPayload.state.trim()
      ? addressPayload.state.trim()
      : null;
  const country =
    typeof addressPayload.country === "string" && addressPayload.country.trim()
      ? addressPayload.country.trim()
      : "United States";
  const latitude =
    addressPayload.latitude === undefined ||
    addressPayload.latitude === null ||
    addressPayload.latitude === ""
      ? null
      : Number(addressPayload.latitude);
  const longitude =
    addressPayload.longitude === undefined ||
    addressPayload.longitude === null ||
    addressPayload.longitude === ""
      ? null
      : Number(addressPayload.longitude);

  if (latitude != null && !Number.isFinite(latitude)) {
    throw createServiceError("latitude must be a number.", 400);
  }

  if (longitude != null && !Number.isFinite(longitude)) {
    throw createServiceError("longitude must be a number.", 400);
  }

  const itemSnapshots = await buildGuestItemSnapshots(payload.items);
  const totalAmount = itemSnapshots
    .reduce((sum, item) => sum + Number(item.lineTotal), 0)
    .toFixed(2);

  const resolved = await resolveGuestCheckoutUser(phone);
  let user = resolved.user;

  if (optionalName && !user.name) {
    user = await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        name: optionalName
      }
    });
  }

  await enforceOrderPhoneRateLimit(user.id);

  const pendingOrderCount = await countPendingOrders(user.id);
  const risk = buildRisk(user, pendingOrderCount);
  const hasPin = Boolean(user.pinHash);
  const postOrderCta = hasPin ? "login" : "register";

  let order;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNumber = generateOrderNumber();

    try {
      order = await prisma.$transaction(async (tx) => {
        const address = await tx.address.create({
          data: {
            userId: user.id,
            label,
            fullName,
            phone: addressPhone,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country,
            latitude,
            longitude,
            isDefault: false
          }
        });

        const deliveryAddress = mapAddressSnapshot(address);

        const createdOrder = await tx.order.create({
          data: {
            userId: user.id,
            orderNumber,
            items: itemSnapshots,
            deliveryAddress,
            status: "Pending",
            totalAmount,
            paymentMethod: "COD",
            placedAsGuest: true,
            matchedExistingAccount: resolved.matchedExistingAccount
          }
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: createdOrder.id,
            oldStatus: null,
            newStatus: "Pending",
            changedBy: user.id,
            note: "Guest order created"
          }
        });

        return createdOrder;
      });

      break;
    } catch (error) {
      if (error.code === "P2002" && attempt < 4) {
        continue;
      }

      throw error;
    }
  }

  if (!order) {
    throw createServiceError("Failed to create order. Please try again.", 500);
  }

  let smsAlert;
  let emailAlert;

  try {
    const alerts = await sendNewOrderAdminAlerts(order, risk);
    smsAlert = alerts.smsAlert;
    emailAlert = alerts.emailAlert;
  } catch (error) {
    console.error(
      `[orders] Unexpected admin alert failure after guest order ${order.orderNumber}:`,
      error.message
    );
    smsAlert = {
      attempted: 0,
      sent: 0,
      failed: 0,
      results: [],
      error: error.message
    };
    emailAlert = {
      attempted: 0,
      sent: 0,
      failed: 0,
      results: [],
      error: error.message
    };
  }

  return {
    order: {
      ...mapOrder(order),
      risk
    },
    smsAlert,
    emailAlert,
    customer: {
      id: user.id,
      phone: user.phone || phone,
      isNewUser: resolved.isNewUser,
      matchedExistingAccount: resolved.matchedExistingAccount,
      hasPin,
      postOrderCta
    }
  };
}

async function listMyOrders(userId, query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const where = {
    userId,
    deletedAt: null
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit
    }),
    prisma.order.count({
      where
    })
  ]);

  return {
    orders: orders.map(mapOrder),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0
    }
  };
}

async function getMyOrderById(userId, orderId) {
  assertUuid(orderId, "orderId");

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
      deletedAt: null
    },
    include: {
      statusHistory: {
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });

  if (!order) {
    throw createServiceError("Order not found.", 404);
  }

  return {
    ...mapOrder(order),
    statusHistory: (order.statusHistory || []).map((entry) => ({
      id: entry.id,
      oldStatus: entry.oldStatus,
      newStatus: entry.newStatus,
      note: entry.note,
      createdAt: entry.createdAt
    }))
  };
}

function mapAdminOrder(order, pendingOrderCount = 0) {
  const risk = order.user
    ? buildRisk(order.user, pendingOrderCount)
    : {
        lowReputation: false,
        pendingPileUp: false,
        reputationScore: 0,
        cancelledOrderCount: 0,
        pendingOrderCount: 0
      };

  return {
    ...mapOrder(order),
    risk,
    user: order.user
      ? {
          id: order.user.id,
          name: order.user.name,
          phone: order.user.phone,
          email: order.user.email,
          role: order.user.role,
          reputation: mapReputation(order.user)
        }
      : undefined
  };
}

const ORDER_STATUSES = new Set([
  "Pending",
  "Confirmed",
  "OutForDelivery",
  "Delivered",
  "Cancelled"
]);

const CUSTOMER_CANCELLABLE_STATUSES = new Set([
  "Pending",
  "Confirmed",
  "OutForDelivery"
]);

const adminUserSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  role: true,
  reputationScore: true,
  deliveredOrderCount: true,
  cancelledOrderCount: true
};

async function listAdminOrders(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const where = {};

  if (query.includeDeleted !== "true" && query.includeDeleted !== true) {
    where.deletedAt = null;
  }

  if (query.status) {
    if (!ORDER_STATUSES.has(query.status)) {
      throw createServiceError("Invalid order status filter.", 400);
    }

    where.status = query.status;
  }

  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};

    if (query.dateFrom) {
      const from = new Date(query.dateFrom);

      if (Number.isNaN(from.getTime())) {
        throw createServiceError("Invalid dateFrom.", 400);
      }

      where.createdAt.gte = from;
    }

    if (query.dateTo) {
      const to = new Date(query.dateTo);

      if (Number.isNaN(to.getTime())) {
        throw createServiceError("Invalid dateTo.", 400);
      }

      where.createdAt.lte = to;
    }
  }

  if (query.search && String(query.search).trim()) {
    const search = String(query.search).trim();

    where.OR = [
      {
        orderNumber: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        user: {
          OR: [
            {
              phone: {
                contains: search,
                mode: "insensitive"
              }
            },
            {
              name: {
                contains: search,
                mode: "insensitive"
              }
            },
            {
              email: {
                contains: search,
                mode: "insensitive"
              }
            }
          ]
        }
      }
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: adminUserSelect
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit
    }),
    prisma.order.count({
      where
    })
  ]);

  const pendingByUser = await loadPendingCountsByUserIds(
    [...new Set(orders.map((order) => order.userId).filter(Boolean))]
  );

  return {
    orders: orders.map((order) =>
      mapAdminOrder(order, pendingByUser.get(order.userId) || 0)
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0
    }
  };
}

async function getAdminOrderById(orderId) {
  assertUuid(orderId, "orderId");

  const order = await prisma.order.findUnique({
    where: {
      id: orderId
    },
    include: {
      user: {
        select: adminUserSelect
      },
      statusHistory: {
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });

  if (!order) {
    throw createServiceError("Order not found.", 404);
  }

  const pendingOrderCount = order.userId
    ? await countPendingOrders(order.userId)
    : 0;

  return {
    ...mapAdminOrder(order, pendingOrderCount),
    statusHistory: (order.statusHistory || []).map((entry) => ({
      id: entry.id,
      oldStatus: entry.oldStatus,
      newStatus: entry.newStatus,
      note: entry.note,
      changedBy: entry.changedBy,
      createdAt: entry.createdAt
    }))
  };
}

function buildStatusNotificationCopy(orderNumber, status) {
  const labels = {
    Pending: "pending",
    Confirmed: "confirmed",
    OutForDelivery: "out for delivery",
    Delivered: "delivered",
    Cancelled: "cancelled"
  };

  const label = labels[status] || status;

  return {
    title: `Order ${orderNumber} updated`,
    message: `Your order ${orderNumber} is now ${label}.`
  };
}

function buildCustomerCancelNotificationCopy(orderNumber, fromStatus) {
  const labels = {
    Pending: "pending",
    Confirmed: "confirmed",
    OutForDelivery: "out for delivery"
  };

  const stage = labels[fromStatus] || fromStatus;

  return {
    title: `Order ${orderNumber} cancelled`,
    message: `Your order ${orderNumber} was cancelled while it was ${stage}.`
  };
}

async function cancelCustomerOrder(userId, orderId, payload = {}) {
  assertUuid(orderId, "orderId");

  const note =
    payload.note === undefined || payload.note === null
      ? null
      : typeof payload.note === "string"
        ? payload.note.trim() || null
        : null;

  if (payload.note !== undefined && payload.note !== null && typeof payload.note !== "string") {
    throw createServiceError("note must be a string.", 400);
  }

  if (
    !payload.cancelledFromStatus ||
    typeof payload.cancelledFromStatus !== "string" ||
    !ORDER_STATUSES.has(payload.cancelledFromStatus)
  ) {
    throw createServiceError(
      "cancelledFromStatus is required and must be a valid order status.",
      400
    );
  }

  const existing = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
      deletedAt: null
    }
  });

  if (!existing) {
    throw createServiceError("Order not found.", 404);
  }

  if (existing.status === "Cancelled") {
    throw createServiceError("Order is already cancelled.", 400);
  }

  if (existing.status === "Delivered") {
    throw createServiceError("Delivered orders cannot be cancelled.", 400);
  }

  if (!CUSTOMER_CANCELLABLE_STATUSES.has(existing.status)) {
    throw createServiceError(
      "Only Pending, Confirmed, or OutForDelivery orders can be cancelled.",
      400
    );
  }

  if (payload.cancelledFromStatus !== existing.status) {
    throw createServiceError(
      `Order status has changed. Current status is ${existing.status}. Refresh and confirm cancellation from that stage.`,
      409
    );
  }

  const cancelledFromStatus = existing.status;
  const notificationCopy = buildCustomerCancelNotificationCopy(
    existing.orderNumber,
    cancelledFromStatus
  );
  const historyNote =
    note || `Cancelled by customer from ${cancelledFromStatus}`;

  const result = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: {
        id: orderId
      },
      data: {
        status: "Cancelled"
      },
      include: {
        statusHistory: {
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    const history = await tx.orderStatusHistory.create({
      data: {
        orderId,
        oldStatus: cancelledFromStatus,
        newStatus: "Cancelled",
        changedBy: userId,
        note: historyNote
      }
    });

    const notification = await tx.notification.create({
      data: {
        userId,
        orderId,
        type: "order_status",
        title: notificationCopy.title,
        message: notificationCopy.message,
        isRead: false
      }
    });

    await applyCustomerCancelPenalty(userId, tx);

    return {
      order: updatedOrder,
      history,
      notification
    };
  });

  await notifyCustomerOrderStatusByEmail({
    userId,
    orderId,
    orderNumber: existing.orderNumber,
    status: "Cancelled",
    title: notificationCopy.title,
    message: notificationCopy.message
  });

  return {
    cancelledFromStatus,
    order: {
      ...mapOrder(result.order),
      statusHistory: [
        ...(result.order.statusHistory || []).map((entry) => ({
          id: entry.id,
          oldStatus: entry.oldStatus,
          newStatus: entry.newStatus,
          note: entry.note,
          createdAt: entry.createdAt
        })),
        {
          id: result.history.id,
          oldStatus: result.history.oldStatus,
          newStatus: result.history.newStatus,
          note: result.history.note,
          createdAt: result.history.createdAt
        }
      ]
    },
    notification: {
      id: result.notification.id,
      userId: result.notification.userId,
      orderId: result.notification.orderId,
      type: result.notification.type,
      title: result.notification.title,
      message: result.notification.message,
      isRead: result.notification.isRead,
      createdAt: result.notification.createdAt
    }
  };
}

async function updateAdminOrderStatus(orderId, adminUserId, payload = {}) {
  assertUuid(orderId, "orderId");

  const nextStatus = payload.status;

  if (!ORDER_STATUSES.has(nextStatus)) {
    throw createServiceError(
      "status must be one of: Pending, Confirmed, OutForDelivery, Delivered, Cancelled.",
      400
    );
  }

  const note =
    payload.note === undefined || payload.note === null
      ? null
      : typeof payload.note === "string"
        ? payload.note.trim() || null
        : null;

  if (payload.note !== undefined && payload.note !== null && typeof payload.note !== "string") {
    throw createServiceError("note must be a string.", 400);
  }

  const existing = await prisma.order.findUnique({
    where: {
      id: orderId
    }
  });

  if (!existing || existing.deletedAt) {
    throw createServiceError("Order not found.", 404);
  }

  if (existing.status === nextStatus) {
    throw createServiceError("Order already has this status.", 400);
  }

  const notificationCopy = buildStatusNotificationCopy(
    existing.orderNumber,
    nextStatus
  );

  const result = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: {
        id: orderId
      },
      data: {
        status: nextStatus
      },
      include: {
        user: {
          select: adminUserSelect
        },
        statusHistory: {
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    const history = await tx.orderStatusHistory.create({
      data: {
        orderId,
        oldStatus: existing.status,
        newStatus: nextStatus,
        changedBy: adminUserId,
        note
      }
    });

    const notification = await tx.notification.create({
      data: {
        userId: existing.userId,
        orderId,
        type: "order_status",
        title: notificationCopy.title,
        message: notificationCopy.message,
        isRead: false
      }
    });

    if (nextStatus === "Delivered" && existing.status !== "Delivered") {
      await applyDeliveryCredit(existing.userId, tx);
      updatedOrder.user = await tx.user.findUnique({
        where: {
          id: existing.userId
        },
        select: adminUserSelect
      });
    }

    return {
      order: updatedOrder,
      history,
      notification
    };
  });

  await notifyCustomerOrderStatusByEmail({
    userId: existing.userId,
    orderId,
    orderNumber: existing.orderNumber,
    status: nextStatus,
    title: notificationCopy.title,
    message: notificationCopy.message
  });

  return {
    order: {
      ...mapAdminOrder(result.order),
      statusHistory: [
        ...(result.order.statusHistory || []).map((entry) => ({
          id: entry.id,
          oldStatus: entry.oldStatus,
          newStatus: entry.newStatus,
          note: entry.note,
          changedBy: entry.changedBy,
          createdAt: entry.createdAt
        })),
        {
          id: result.history.id,
          oldStatus: result.history.oldStatus,
          newStatus: result.history.newStatus,
          note: result.history.note,
          changedBy: result.history.changedBy,
          createdAt: result.history.createdAt
        }
      ]
    },
    notification: {
      id: result.notification.id,
      userId: result.notification.userId,
      orderId: result.notification.orderId,
      type: result.notification.type,
      title: result.notification.title,
      message: result.notification.message,
      isRead: result.notification.isRead,
      createdAt: result.notification.createdAt
    }
  };
}

module.exports = {
  cancelCustomerOrder,
  createGuestOrder,
  createOrderFromCart,
  getAdminOrderById,
  getMyOrderById,
  listAdminOrders,
  listMyOrders,
  mapOrder,
  updateAdminOrderStatus
};
