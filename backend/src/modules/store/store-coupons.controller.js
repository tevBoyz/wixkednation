const {
  claimCouponBySlug,
  getClaimCampaignBySlug,
  listClaimableCampaigns,
  mapCoupon,
  validateCouponForCheckout,
} = require("../../services/coupons/coupons.service");
const { sendCouponIssueEmail } = require("../../services/email/email.service");

// Simple in-memory rate limit: email|ip → timestamps
const claimAttempts = new Map();

function pruneAttempts(key, windowMs) {
  const now = Date.now();
  const list = (claimAttempts.get(key) || []).filter((t) => now - t < windowMs);
  claimAttempts.set(key, list);
  return list;
}

function assertClaimRateLimit(email, ip) {
  const windowMs = 60 * 60 * 1000;
  const maxPerKey = 5;
  for (const key of [`email:${email}`, `ip:${ip || "unknown"}`]) {
    const list = pruneAttempts(key, windowMs);
    if (list.length >= maxPerKey) {
      const error = new Error("Too many claim attempts. Try again later.");
      error.statusCode = 429;
      throw error;
    }
    list.push(Date.now());
    claimAttempts.set(key, list);
  }
}

async function validateCoupon(req, res, next) {
  try {
    const result = await validateCouponForCheckout({
      code: req.body?.code,
      subtotal: req.body?.subtotal,
      userId: req.user?.id || null,
      email: req.body?.email || req.user?.email || null,
      phone: req.body?.phone || req.user?.phone || null,
    });

    return res.status(200).json({
      success: true,
      message: "Coupon is valid.",
      data: {
        valid: true,
        coupon: result.mapped,
        productDiscount: result.totals.discountAmount,
        deliveryFee: result.totals.deliveryFeeAmount,
        subtotal: result.totals.subtotalAmount,
        total: result.totals.totalAmount,
        type: result.coupon.type,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        data: { valid: false },
      });
    }
    next(error);
  }
}

async function listClaimCampaigns(req, res, next) {
  try {
    const campaigns = await listClaimableCampaigns();
    return res.status(200).json({
      success: true,
      message: "Claim campaigns fetched.",
      data: { campaigns },
    });
  } catch (error) {
    next(error);
  }
}

async function getClaimCampaign(req, res, next) {
  try {
    const campaign = await getClaimCampaignBySlug(req.params.slug);
    return res.status(200).json({
      success: true,
      message: "Claim campaign fetched.",
      data: {
        campaign: {
          name: campaign.name,
          type: campaign.type,
          claimSlug: campaign.claimSlug,
          endsAt: campaign.endsAt,
          description:
            campaign.type === "free_delivery"
              ? "Enter your email to receive a free delivery coupon code."
              : "Enter your email to receive your coupon code.",
        },
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

async function claimLead(req, res, next) {
  try {
    const email = req.body?.email;
    const slug = req.params.slug || req.body?.slug;
    const source = req.body?.source || null;
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.ip;

    assertClaimRateLimit(String(email || "").toLowerCase(), ip);

    const result = await claimCouponBySlug({ email, slug, source });

    await sendCouponIssueEmail({
      to: result.email,
      couponCode: result.coupon.code,
      campaignName: result.campaign.name,
      expiresAt: result.coupon.endsAt,
      metadata: {
        campaignKey: result.campaign.claimSlug,
        resent: result.resent,
      },
    });

    return res.status(200).json({
      success: true,
      message: result.resent
        ? "Your coupon code was resent to your email."
        : "Coupon sent to your email.",
      data: {
        resent: result.resent,
        email: result.email,
        // Do not return the code in API for security — email is source of truth
        campaignName: result.campaign.name,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

module.exports = {
  validateCoupon,
  listClaimCampaigns,
  getClaimCampaign,
  claimLead,
  mapCoupon,
};
