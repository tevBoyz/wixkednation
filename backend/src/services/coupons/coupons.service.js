const crypto = require("crypto");

const prisma = require("../../config/prisma");
const {
  computeOrderTotals,
  toMoneyNumber,
  moneyString,
} = require("../pricing/order-totals.service");

function createServiceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeCode(code) {
  if (!code || typeof code !== "string") {
    return "";
  }
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeEmail(email) {
  if (!email || typeof email !== "string") {
    return "";
  }
  return email.trim().toLowerCase();
}

function normalizeClaimSlug(slug) {
  if (!slug || typeof slug !== "string") {
    return "";
  }
  return slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function serializeDecimal(value) {
  if (value == null) {
    return null;
  }
  return moneyString(value);
}

function mapCoupon(coupon) {
  if (!coupon) {
    return null;
  }
  return {
    id: coupon.id,
    code: coupon.code,
    name: coupon.name,
    type: coupon.type,
    amount: serializeDecimal(coupon.amount),
    status: coupon.status,
    startsAt: coupon.startsAt,
    endsAt: coupon.endsAt,
    maxRedemptions: coupon.maxRedemptions,
    redemptionCount: coupon.redemptionCount,
    maxPerCustomer: coupon.maxPerCustomer,
    minSubtotal: serializeDecimal(coupon.minSubtotal),
    newCustomersOnly: Boolean(coupon.newCustomersOnly),
    isUniqueIssue: Boolean(coupon.isUniqueIssue),
    claimSlug: coupon.claimSlug,
    parentCouponId: coupon.parentCouponId,
    claimUrl: coupon.claimSlug
      ? `/claim/${coupon.claimSlug}`
      : null,
    createdAt: coupon.createdAt,
    updatedAt: coupon.updatedAt,
    deletedAt: coupon.deletedAt,
  };
}

function generateUniqueCode(prefix = "GN") {
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${suffix}`;
}

async function countCustomerRedemptions(couponId, { userId, email, phone }) {
  const or = [];
  if (userId) {
    or.push({ userId });
  }
  if (email) {
    or.push({ email });
  }
  if (phone) {
    or.push({ phone });
  }
  if (or.length === 0) {
    return 0;
  }
  return prisma.couponRedemption.count({
    where: {
      couponId,
      OR: or,
    },
  });
}

async function hasPriorDeliveredOrder({ userId, email, phone }) {
  if (userId) {
    const count = await prisma.order.count({
      where: {
        userId,
        status: "Delivered",
        deletedAt: null,
      },
    });
    if (count > 0) {
      return true;
    }
  }

  // Phone/email match via user records when available
  if (phone || email) {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          phone ? { phone } : undefined,
          email ? { email } : undefined,
        ].filter(Boolean),
      },
      select: { id: true },
      take: 20,
    });
    if (users.length > 0) {
      const count = await prisma.order.count({
        where: {
          userId: { in: users.map((u) => u.id) },
          status: "Delivered",
          deletedAt: null,
        },
      });
      return count > 0;
    }
  }

  return false;
}

/**
 * Load and validate a coupon for a given subtotal / customer context.
 * Does not redeem — call redeemCouponInTx after order create.
 */
async function validateCouponForCheckout({
  code,
  subtotal,
  userId = null,
  email = null,
  phone = null,
}) {
  const normalized = normalizeCode(code);
  if (!normalized) {
    throw createServiceError("Coupon code is required.", 400);
  }

  const coupon = await prisma.coupon.findFirst({
    where: {
      code: normalized,
      deletedAt: null,
    },
  });

  if (!coupon) {
    throw createServiceError("Invalid coupon code.", 400);
  }

  if (coupon.status !== "active") {
    throw createServiceError("This coupon is no longer active.", 400);
  }

  // Campaign templates issue unique child codes via /claim/[slug] — not redeemable directly
  if (coupon.isUniqueIssue) {
    throw createServiceError(
      "This offer uses a personal code emailed from the claim page.",
      400,
    );
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    throw createServiceError("This coupon is not active yet.", 400);
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    throw createServiceError("This coupon has expired.", 400);
  }

  if (
    coupon.maxRedemptions != null &&
    coupon.redemptionCount >= coupon.maxRedemptions
  ) {
    throw createServiceError("This coupon has reached its redemption limit.", 400);
  }

  const subtotalNum = toMoneyNumber(subtotal);
  if (
    coupon.minSubtotal != null &&
    subtotalNum < toMoneyNumber(coupon.minSubtotal)
  ) {
    throw createServiceError(
      `This coupon requires a minimum subtotal of $${moneyString(coupon.minSubtotal)}.`,
      400,
    );
  }

  const used = await countCustomerRedemptions(coupon.id, {
    userId,
    email: normalizeEmail(email) || null,
    phone: phone || null,
  });
  if (used >= (coupon.maxPerCustomer || 1)) {
    throw createServiceError("You have already used this coupon.", 400);
  }

  // Also count redemptions against parent campaign for unique issued codes
  if (coupon.parentCouponId) {
    const parentUsed = await countCustomerRedemptions(coupon.parentCouponId, {
      userId,
      email: normalizeEmail(email) || null,
      phone: phone || null,
    });
    // Unique child codes: maxPerCustomer applies to the child itself (usually 1)
  }

  if (coupon.newCustomersOnly) {
    const prior = await hasPriorDeliveredOrder({
      userId,
      email: normalizeEmail(email) || null,
      phone: phone || null,
    });
    if (prior) {
      throw createServiceError("This coupon is for new customers only.", 400);
    }
  }

  const totals = computeOrderTotals({
    subtotal: subtotalNum,
    couponType: coupon.type,
    couponAmount: coupon.amount,
  });

  return {
    coupon,
    totals,
    mapped: mapCoupon(coupon),
  };
}

async function redeemCouponInTx(
  tx,
  {
    coupon,
    orderId,
    userId = null,
    email = null,
    phone = null,
    totals,
  },
) {
  await tx.couponRedemption.create({
    data: {
      couponId: coupon.id,
      orderId,
      userId,
      email: normalizeEmail(email) || null,
      phone: phone || null,
      discountAmount: totals.discountAmount,
      deliveryFeeBefore: moneyString(totals.deliveryFeeBefore),
      deliveryFeeAfter: totals.deliveryFeeAmount,
    },
  });

  await tx.coupon.update({
    where: { id: coupon.id },
    data: {
      redemptionCount: { increment: 1 },
    },
  });

  if (coupon.parentCouponId) {
    await tx.coupon.update({
      where: { id: coupon.parentCouponId },
      data: {
        redemptionCount: { increment: 1 },
      },
    });
  }
}

async function listAdminCoupons() {
  const coupons = await prisma.coupon.findMany({
    where: {
      deletedAt: null,
      parentCouponId: null,
    },
    orderBy: { createdAt: "desc" },
  });
  return coupons.map(mapCoupon);
}

async function getAdminCouponById(id) {
  const coupon = await prisma.coupon.findFirst({
    where: { id, deletedAt: null },
  });
  if (!coupon) {
    throw createServiceError("Coupon not found.", 404);
  }
  return mapCoupon(coupon);
}

function parseOptionalDate(value) {
  if (value == null || value === "") {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createServiceError("Invalid date.", 400);
  }
  return date;
}

function parseOptionalAmount(value) {
  if (value == null || value === "") {
    return null;
  }
  const num = toMoneyNumber(value);
  if (num < 0) {
    throw createServiceError("Amount must be non-negative.", 400);
  }
  return num;
}

async function createAdminCoupon(payload = {}) {
  const type = payload.type;
  if (!["free_delivery", "fixed_amount", "percent_off"].includes(type)) {
    throw createServiceError("Invalid coupon type.", 400);
  }

  let code = normalizeCode(payload.code);
  if (!code) {
    code = generateUniqueCode(type === "free_delivery" ? "FREE" : "GN");
  }

  const name =
    typeof payload.name === "string" && payload.name.trim()
      ? payload.name.trim()
      : code;

  let amount = parseOptionalAmount(payload.amount);
  if (type === "percent_off") {
    if (amount == null) {
      throw createServiceError("Percent amount is required.", 400);
    }
    if (amount > 100) {
      throw createServiceError("Percent cannot exceed 100.", 400);
    }
  }
  if (type === "fixed_amount") {
    if (amount == null || amount <= 0) {
      throw createServiceError("Fixed amount must be greater than 0.", 400);
    }
  }
  if (type === "free_delivery") {
    amount = null;
  }

  const isUniqueIssue = Boolean(payload.isUniqueIssue);
  let claimSlug = payload.claimSlug
    ? normalizeClaimSlug(payload.claimSlug)
    : null;
  if (claimSlug && !isUniqueIssue) {
    throw createServiceError(
      "claimSlug requires isUniqueIssue to be true (email-issued codes).",
      400,
    );
  }
  if (claimSlug) {
    const existingSlug = await prisma.coupon.findFirst({
      where: { claimSlug, deletedAt: null },
    });
    if (existingSlug) {
      throw createServiceError("claimSlug is already in use.", 409);
    }
  }

  const existingCode = await prisma.coupon.findUnique({ where: { code } });
  if (existingCode) {
    throw createServiceError("Coupon code already exists.", 409);
  }

  const coupon = await prisma.coupon.create({
    data: {
      code,
      name,
      type,
      amount: amount != null ? moneyString(amount) : null,
      status: "active",
      startsAt: parseOptionalDate(payload.startsAt),
      endsAt: parseOptionalDate(payload.endsAt),
      maxRedemptions:
        payload.maxRedemptions == null || payload.maxRedemptions === ""
          ? null
          : Number.parseInt(String(payload.maxRedemptions), 10),
      maxPerCustomer:
        payload.maxPerCustomer == null || payload.maxPerCustomer === ""
          ? 1
          : Math.max(1, Number.parseInt(String(payload.maxPerCustomer), 10) || 1),
      minSubtotal:
        payload.minSubtotal == null || payload.minSubtotal === ""
          ? null
          : moneyString(parseOptionalAmount(payload.minSubtotal)),
      newCustomersOnly: Boolean(payload.newCustomersOnly),
      isUniqueIssue,
      claimSlug,
    },
  });

  return mapCoupon(coupon);
}

async function updateAdminCoupon(id, payload = {}) {
  const existing = await prisma.coupon.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    throw createServiceError("Coupon not found.", 404);
  }

  const data = {};

  if (payload.name != null) {
    data.name = String(payload.name).trim() || existing.name;
  }
  if (payload.status != null) {
    if (!["active", "archived"].includes(payload.status)) {
      throw createServiceError("Invalid status.", 400);
    }
    data.status = payload.status;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "startsAt")) {
    data.startsAt = parseOptionalDate(payload.startsAt);
  }
  if (Object.prototype.hasOwnProperty.call(payload, "endsAt")) {
    data.endsAt = parseOptionalDate(payload.endsAt);
  }
  if (Object.prototype.hasOwnProperty.call(payload, "maxRedemptions")) {
    data.maxRedemptions =
      payload.maxRedemptions == null || payload.maxRedemptions === ""
        ? null
        : Number.parseInt(String(payload.maxRedemptions), 10);
  }
  if (Object.prototype.hasOwnProperty.call(payload, "maxPerCustomer")) {
    data.maxPerCustomer = Math.max(
      1,
      Number.parseInt(String(payload.maxPerCustomer), 10) || 1,
    );
  }
  if (Object.prototype.hasOwnProperty.call(payload, "minSubtotal")) {
    data.minSubtotal =
      payload.minSubtotal == null || payload.minSubtotal === ""
        ? null
        : moneyString(parseOptionalAmount(payload.minSubtotal));
  }
  if (Object.prototype.hasOwnProperty.call(payload, "newCustomersOnly")) {
    data.newCustomersOnly = Boolean(payload.newCustomersOnly);
  }
  if (Object.prototype.hasOwnProperty.call(payload, "claimSlug")) {
    if (!existing.isUniqueIssue && payload.claimSlug) {
      throw createServiceError(
        "claimSlug requires isUniqueIssue to be true.",
        400,
      );
    }
    const slug = payload.claimSlug
      ? normalizeClaimSlug(payload.claimSlug)
      : null;
    if (slug) {
      const clash = await prisma.coupon.findFirst({
        where: {
          claimSlug: slug,
          deletedAt: null,
          NOT: { id },
        },
      });
      if (clash) {
        throw createServiceError("claimSlug is already in use.", 409);
      }
    }
    data.claimSlug = slug;
  }
  if (
    Object.prototype.hasOwnProperty.call(payload, "amount") &&
    existing.type !== "free_delivery"
  ) {
    const amount = parseOptionalAmount(payload.amount);
    if (existing.type === "percent_off" && (amount == null || amount > 100)) {
      throw createServiceError("Percent must be between 0 and 100.", 400);
    }
    data.amount = amount != null ? moneyString(amount) : null;
  }

  const coupon = await prisma.coupon.update({
    where: { id },
    data,
  });
  return mapCoupon(coupon);
}

async function archiveAdminCoupon(id) {
  const existing = await prisma.coupon.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    throw createServiceError("Coupon not found.", 404);
  }
  const coupon = await prisma.coupon.update({
    where: { id },
    data: { status: "archived" },
  });
  return mapCoupon(coupon);
}

async function getClaimCampaignBySlug(slug) {
  const claimSlug = normalizeClaimSlug(slug);
  if (!claimSlug) {
    throw createServiceError("Campaign not found.", 404);
  }
  const coupon = await prisma.coupon.findFirst({
    where: {
      claimSlug,
      deletedAt: null,
      parentCouponId: null,
      isUniqueIssue: true,
      status: "active",
    },
  });
  if (!coupon) {
    throw createServiceError("Campaign not found.", 404);
  }
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    throw createServiceError("This campaign is not active yet.", 400);
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    throw createServiceError("This campaign has ended.", 400);
  }
  return coupon;
}

/** Active claimable campaign slugs for sitemap / discovery (no codes). */
async function listClaimableCampaigns() {
  const now = new Date();
  const campaigns = await prisma.coupon.findMany({
    where: {
      deletedAt: null,
      parentCouponId: null,
      isUniqueIssue: true,
      status: "active",
      claimSlug: { not: null },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    select: {
      claimSlug: true,
      name: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  return campaigns
    .filter((row) => Boolean(row.claimSlug))
    .map((row) => ({
      claimSlug: row.claimSlug,
      name: row.name,
      updatedAt: row.updatedAt,
    }));
}

async function claimCouponBySlug({ email, slug, source = null }) {
  const normalizedEmail = normalizeEmail(email);
  if (!isEmailValid(normalizedEmail)) {
    throw createServiceError("A valid email address is required.", 400);
  }

  const parent = await getClaimCampaignBySlug(slug);
  const campaignKey = parent.claimSlug || parent.id;

  const existingLead = await prisma.leadSignup.findUnique({
    where: {
      email_campaignKey: {
        email: normalizedEmail,
        campaignKey,
      },
    },
    include: { coupon: true },
  });

  if (existingLead?.coupon && existingLead.coupon.status === "active") {
    const child = existingLead.coupon;
    const stillValid = !child.endsAt || child.endsAt > new Date();
    const unused = child.redemptionCount < (child.maxPerCustomer || 1);
    if (stillValid && unused) {
      return {
        resent: true,
        coupon: mapCoupon(child),
        email: normalizedEmail,
        campaign: mapCoupon(parent),
      };
    }
  }

  let code;
  for (let i = 0; i < 8; i += 1) {
    code = generateUniqueCode(parent.type === "free_delivery" ? "FREE" : "GN");
    const clash = await prisma.coupon.findUnique({ where: { code } });
    if (!clash) {
      break;
    }
    code = null;
  }
  if (!code) {
    throw createServiceError("Could not generate a unique code. Try again.", 500);
  }

  const endsAt =
    parent.endsAt ||
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    const child = await tx.coupon.create({
      data: {
        code,
        name: `${parent.name} (${normalizedEmail})`,
        type: parent.type,
        amount: parent.amount,
        status: "active",
        startsAt: new Date(),
        endsAt,
        maxRedemptions: 1,
        maxPerCustomer: 1,
        minSubtotal: parent.minSubtotal,
        newCustomersOnly: parent.newCustomersOnly,
        isUniqueIssue: false,
        claimSlug: null,
        parentCouponId: parent.id,
      },
    });

    await tx.leadSignup.upsert({
      where: {
        email_campaignKey: {
          email: normalizedEmail,
          campaignKey,
        },
      },
      create: {
        email: normalizedEmail,
        couponId: child.id,
        campaignKey,
        source: source ? String(source).slice(0, 120) : null,
      },
      update: {
        couponId: child.id,
        source: source ? String(source).slice(0, 120) : null,
      },
    });

    return child;
  });

  return {
    resent: false,
    coupon: mapCoupon(result),
    email: normalizedEmail,
    campaign: mapCoupon(parent),
  };
}

module.exports = {
  normalizeCode,
  normalizeEmail,
  normalizeClaimSlug,
  mapCoupon,
  validateCouponForCheckout,
  redeemCouponInTx,
  listAdminCoupons,
  getAdminCouponById,
  createAdminCoupon,
  updateAdminCoupon,
  archiveAdminCoupon,
  getClaimCampaignBySlug,
  listClaimableCampaigns,
  claimCouponBySlug,
  computeOrderTotals,
  createServiceError,
};
