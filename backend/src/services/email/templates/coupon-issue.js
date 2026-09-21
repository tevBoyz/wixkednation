const { escapeHtml, renderBrandedLayout, BRAND_NAME } = require("./layout");

function buildCouponIssueEmail({
  logoUrl,
  couponCode,
  campaignName,
  expiresAt,
  checkoutUrl,
}) {
  const title = "Your coupon code";
  const expiresLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const bodyHtml = `
    <p style="margin:0 0 16px;">Thanks for claiming <strong>${escapeHtml(campaignName || "your offer")}</strong> from ${escapeHtml(BRAND_NAME)}.</p>
    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Your code</p>
    <p style="margin:0 0 20px;font-size:28px;font-weight:700;letter-spacing:0.12em;font-family:Consolas,Monaco,monospace;color:#122018;">${escapeHtml(couponCode)}</p>
    <p style="margin:0 0 12px;">Enter this code at checkout. One use per customer.</p>
    ${
      expiresLabel
        ? `<p style="margin:0 0 12px;">Valid until <strong>${escapeHtml(expiresLabel)}</strong>.</p>`
        : ""
    }
    ${
      checkoutUrl
        ? `<p style="margin:16px 0 0;"><a href="${escapeHtml(checkoutUrl)}" style="display:inline-block;background:#1a5c3a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Shop &amp; checkout</a></p>`
        : ""
    }
    <p style="margin:20px 0 0;color:#6b7280;font-size:13px;">21+ with valid ID. Cash on delivery.</p>
  `;

  const html = renderBrandedLayout({
    logoUrl,
    title,
    preheader: `${BRAND_NAME} coupon: ${couponCode}`,
    bodyHtml,
  });

  const text = [
    title,
    "",
    `Campaign: ${campaignName || "Gas Nation offer"}`,
    `Your code: ${couponCode}`,
    expiresLabel ? `Valid until: ${expiresLabel}` : null,
    checkoutUrl ? `Checkout: ${checkoutUrl}` : null,
    "",
    "Enter this code at checkout. One use per customer.",
    "21+ only · gasnationweed.com",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `${BRAND_NAME}: your coupon code ${couponCode}`,
    html,
    text,
  };
}

module.exports = {
  buildCouponIssueEmail,
};
