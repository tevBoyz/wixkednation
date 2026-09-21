const env = require("../../config/env");
const prisma = require("../../config/prisma");
const mockProvider = require("./providers/mock.provider");
const smtpProvider = require("./providers/smtp.provider");
const { buildOtpEmail } = require("./templates/otp");
const { buildOrderStatusEmail } = require("./templates/order-status");
const { buildCouponIssueEmail } = require("./templates/coupon-issue");

function parseEmailList(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getActiveEmailProviderName() {
  const fromEnv = (env.email.provider || "mock").toLowerCase().trim();

  if (fromEnv === "smtp" && smtpProvider.isConfigured()) {
    return "smtp";
  }

  if (fromEnv === "smtp" && !smtpProvider.isConfigured()) {
    console.warn(
      "[email] EMAIL_PROVIDER=smtp but SMTP credentials are incomplete. Using mock."
    );
  }

  return "mock";
}

function resolveProvider() {
  const name = getActiveEmailProviderName();
  return name === "smtp" ? smtpProvider : mockProvider;
}

function isEmailConfigured() {
  const name = getActiveEmailProviderName();
  return name === "mock" || name === "smtp";
}

const PRODUCTION_SITE_ORIGIN = "https://gasnationweed.com";
const DEFAULT_EMAIL_LOGO_PATH = "/brand/gasnation-logo-full.png";

function isLoopbackOrigin(value) {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^\[|\]$/g, "");
    return ["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(hostname);
  } catch {
    return true;
  }
}

/**
 * Public storefront origin for links inside outbound emails.
 * Never embeds localhost — email clients / staff phones cannot open it.
 */
function getPublicAppOrigin() {
  const explicit = (env.email.appUrl || "").replace(/\/$/, "");
  if (explicit && !isLoopbackOrigin(explicit)) {
    return explicit;
  }

  const frontend = (env.frontendUrl || "").replace(/\/$/, "");
  if (frontend && !isLoopbackOrigin(frontend)) {
    return frontend;
  }

  return PRODUCTION_SITE_ORIGIN;
}

function getLogoUrl() {
  if (env.email.logoUrl) {
    return env.email.logoUrl;
  }

  return `${getPublicAppOrigin()}${DEFAULT_EMAIL_LOGO_PATH}`;
}

function redactSubjectForLog(subject, purpose) {
  if (purpose === "otp" && typeof subject === "string") {
    return subject.replace(/\b\d{4,8}\b/g, "******");
  }

  return subject;
}

async function logEmailResult({
  to,
  subject,
  result,
  purpose = "general",
  metadata = {}
}) {
  try {
    return await prisma.emailLog.create({
      data: {
        to,
        subject: redactSubjectForLog(subject, purpose) || "",
        provider: result.provider || "unknown",
        providerRef: result.providerRef || null,
        status: result.success ? "sent" : "failed",
        errorMessage: result.error || null,
        metadata: {
          purpose,
          ...(result.raw && typeof result.raw === "object"
            ? { providerRaw: result.raw }
            : {}),
          ...(metadata && typeof metadata === "object" ? metadata : {})
        }
      }
    });
  } catch (error) {
    console.error("[email] Failed to write email_logs row:", error.message);
    return null;
  }
}

async function sendEmail({
  to,
  subject,
  text,
  html,
  log = true,
  purpose = "general",
  metadata = {}
} = {}) {
  if (!to) {
    throw new Error("Recipient email is required.");
  }

  if (!subject) {
    throw new Error("Email subject is required.");
  }

  if (!text && !html) {
    throw new Error("Email text or html is required.");
  }

  const provider = resolveProvider();
  let result;

  try {
    result = await provider.sendEmail({
      to,
      subject,
      text,
      html,
      from: env.email.from
    });
  } catch (error) {
    result = {
      success: false,
      provider: provider.name || "unknown",
      providerRef: null,
      error: error.message || "Email provider threw an unexpected error.",
      raw: null
    };
  }

  let emailLog = null;

  if (log) {
    emailLog = await logEmailResult({
      to,
      subject,
      result,
      purpose,
      metadata
    });
  }

  return {
    ...result,
    purpose,
    emailLogId: emailLog ? emailLog.id : null
  };
}

async function sendOtpEmail({ to, otpCode, purpose, expiresMinutes, metadata }) {
  const content = buildOtpEmail({
    logoUrl: getLogoUrl(),
    otpCode,
    expiresMinutes: expiresMinutes || env.otp.expiresMinutes,
    purpose
  });

  return sendEmail({
    to,
    subject: content.subject,
    text: content.text,
    html: content.html,
    purpose: "otp",
    metadata: {
      otpPurpose: purpose === "forgot_pin" ? "forgot_pin" : "register",
      ...(metadata && typeof metadata === "object" ? metadata : {})
    }
  });
}

async function sendOrderStatusEmail({
  to,
  title,
  message,
  orderNumber,
  status,
  orderId,
  metadata
}) {
  const base = getPublicAppOrigin();
  const orderUrl =
    base && orderId ? `${base}/account/orders/${orderId}` : null;
  const reviewUrl =
    status === "Delivered" && env.email.googleReviewUrl
      ? env.email.googleReviewUrl
      : null;

  const content = buildOrderStatusEmail({
    logoUrl: getLogoUrl(),
    title,
    message,
    orderNumber,
    status,
    orderUrl,
    reviewUrl
  });

  return sendEmail({
    to,
    subject: content.subject,
    text: content.text,
    html: content.html,
    purpose: "order_status",
    metadata: {
      orderId: orderId || null,
      orderNumber: orderNumber || null,
      status: status || null,
      ...(metadata && typeof metadata === "object" ? metadata : {})
    }
  });
}

async function sendAdminOrderEmail({ order, riskPrefix = "", metadata }) {
  const recipients = env.email.adminOrderNotificationEmails;
  if (!recipients.length) {
    return { attempted: 0, sent: 0, failed: 0, results: [] };
  }

  const total =
    order.totalAmount !== undefined && order.totalAmount !== null
      ? Number(order.totalAmount).toFixed(2)
      : "?";
  const delivery =
    order.deliveryFee !== undefined && order.deliveryFee !== null
      ? Number(order.deliveryFee).toFixed(2)
      : null;
  const subject = `${riskPrefix}New COD order ${order.orderNumber}`;
  const base = getPublicAppOrigin();
  const adminUrl = base ? `${base}/admin/orders/${order.id}` : null;
  const text = [
    `${riskPrefix}New COD order ${order.orderNumber}.`,
    `Total: ${total}.`,
    delivery != null ? `Delivery fee: ${delivery}${Number(delivery) === 0 ? " (FREE DELIVERY)" : ""}.` : null,
    order.couponCode ? `Coupon: ${order.couponCode}.` : null,
    `Status: ${order.status || "Pending"}.`,
    adminUrl ? `Admin: ${adminUrl}` : null
  ]
    .filter(Boolean)
    .join("\n");

  const results = [];
  let sent = 0;
  let failed = 0;

  for (const to of recipients) {
    try {
      const result = await sendEmail({
        to,
        subject,
        text,
        purpose: "admin_new_order",
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          ...(metadata && typeof metadata === "object" ? metadata : {})
        }
      });

      if (result.success) {
        sent += 1;
      } else {
        failed += 1;
      }

      results.push({ to, success: Boolean(result.success), error: result.error || null });
    } catch (error) {
      failed += 1;
      results.push({ to, success: false, error: error.message });
    }
  }

  return {
    attempted: recipients.length,
    sent,
    failed,
    results
  };
}

async function sendSystemAlert({ subject, text, metadata }) {
  const recipients = env.email.systemAlertEmails;
  if (!recipients.length) {
    return { attempted: 0, sent: 0, failed: 0, results: [] };
  }

  const results = [];
  let sent = 0;
  let failed = 0;

  for (const to of recipients) {
    try {
      const result = await sendEmail({
        to,
        subject: subject || "GasNation system alert",
        text: text || "",
        purpose: "system_alert",
        metadata: metadata && typeof metadata === "object" ? metadata : {}
      });

      if (result.success) {
        sent += 1;
      } else {
        failed += 1;
      }

      results.push({ to, success: Boolean(result.success), error: result.error || null });
    } catch (error) {
      failed += 1;
      results.push({ to, success: false, error: error.message });
    }
  }

  return {
    attempted: recipients.length,
    sent,
    failed,
    results
  };
}

async function sendCouponIssueEmail({
  to,
  couponCode,
  campaignName,
  expiresAt,
  metadata,
}) {
  const base = getPublicAppOrigin();
  const content = buildCouponIssueEmail({
    logoUrl: getLogoUrl(),
    couponCode,
    campaignName,
    expiresAt,
    checkoutUrl: base ? `${base}/checkout` : null,
  });

  return sendEmail({
    to,
    subject: content.subject,
    text: content.text,
    html: content.html,
    purpose: "coupon_issue",
    metadata: {
      couponCode: couponCode || null,
      ...(metadata && typeof metadata === "object" ? metadata : {}),
    },
  });
}

module.exports = {
  getActiveEmailProviderName,
  getLogoUrl,
  getPublicAppOrigin,
  isEmailConfigured,
  parseEmailList,
  sendAdminOrderEmail,
  sendCouponIssueEmail,
  sendEmail,
  sendOrderStatusEmail,
  sendOtpEmail,
  sendSystemAlert
};
