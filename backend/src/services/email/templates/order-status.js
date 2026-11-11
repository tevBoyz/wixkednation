const { escapeHtml, renderBrandedLayout, BRAND_NAME } = require("./layout");

function buildOrderStatusEmail({
  logoUrl,
  title,
  message,
  orderNumber,
  status,
  orderUrl,
  reviewUrl
}) {
  const safeMessage = escapeHtml(message);
  const safeOrder = escapeHtml(orderNumber || "");

  let extraHtml = "";
  if (orderUrl) {
    extraHtml += `<p style="margin:16px 0 0;"><a href="${escapeHtml(orderUrl)}" style="color:#148547;text-decoration:none;font-weight:600;">View your order</a></p>`;
  }

  const isDelivered = status === "Delivered";
  const cta =
    isDelivered && reviewUrl
      ? { href: reviewUrl, label: "Leave a Google review" }
      : orderUrl
        ? { href: orderUrl, label: "View order" }
        : null;

  if (isDelivered && reviewUrl) {
    extraHtml += `<p style="margin:16px 0 0;">How was your delivery? We would love a quick Google review.</p>`;
  }

  const bodyHtml = `
    <p style="margin:0 0 12px;">${safeMessage}</p>
    ${safeOrder ? `<p style="margin:0;color:#6b7280;font-size:13px;">Order <strong style="color:#122018;">${safeOrder}</strong></p>` : ""}
    ${extraHtml}
  `;

  const html = renderBrandedLayout({
    logoUrl,
    title,
    preheader: message,
    bodyHtml,
    cta
  });

  const textLines = [
    title,
    "",
    message,
    orderNumber ? `Order: ${orderNumber}` : null,
    orderUrl ? `View order: ${orderUrl}` : null,
    isDelivered && reviewUrl
      ? `Leave a Google review: ${reviewUrl}`
      : null,
    "",
    "21+ only · gasnationweed.com"
  ].filter((line) => line !== null);

  return {
    subject: title || `${BRAND_NAME} order update`,
    html,
    text: textLines.join("\n")
  };
}

module.exports = {
  buildOrderStatusEmail
};
