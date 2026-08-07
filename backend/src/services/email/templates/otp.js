const { escapeHtml, renderBrandedLayout, BRAND_NAME } = require("./layout");

function buildOtpEmail({ logoUrl, otpCode, expiresMinutes, purpose }) {
  const isForgot = purpose === "forgot_pin";
  const title = isForgot ? "Reset your PIN" : "Verify your email";
  const intro = isForgot
    ? `Use this code to reset your ${BRAND_NAME} PIN.`
    : `Use this code to finish creating your ${BRAND_NAME} account.`;

  const bodyHtml = `
    <p style="margin:0 0 16px;">${escapeHtml(intro)}</p>
    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Your code</p>
    <p style="margin:0 0 20px;font-size:32px;font-weight:700;letter-spacing:0.28em;font-family:Consolas,Monaco,monospace;color:#122018;">${escapeHtml(otpCode)}</p>
    <p style="margin:0 0 8px;">This code expires in <strong>${escapeHtml(String(expiresMinutes))}</strong> minutes.</p>
    <p style="margin:0;color:#6b7280;font-size:13px;">If you did not request this, you can ignore this email.</p>
  `;

  const html = renderBrandedLayout({
    logoUrl,
    title,
    preheader: `${BRAND_NAME} code: ${otpCode}`,
    bodyHtml
  });

  const text = [
    title,
    "",
    intro,
    "",
    `Your code: ${otpCode}`,
    `Expires in ${expiresMinutes} minutes.`,
    "",
    "If you did not request this, you can ignore this email.",
    "",
    "21+ only · gasnationweed.com"
  ].join("\n");

  return {
    subject: `${BRAND_NAME}: ${otpCode} is your verification code`,
    html,
    text
  };
}

module.exports = {
  buildOtpEmail
};
