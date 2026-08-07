const BRAND_PRIMARY = "#148547";
const BRAND_NAME = "GasNation";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Shared GasNation-branded HTML email shell.
 * @param {{ logoUrl?: string, title: string, preheader?: string, bodyHtml: string, cta?: { href: string, label: string } | null, footerNote?: string }} opts
 */
function renderBrandedLayout({
  logoUrl,
  title,
  preheader = "",
  bodyHtml,
  cta = null,
  footerNote = "21+ only. Premium cannabis delivery across Northern Virginia and Washington, DC."
}) {
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader);
  const safeFooter = escapeHtml(footerNote);
  const logo = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${BRAND_NAME}" width="160" style="display:block;max-width:160px;height:auto;border:0;outline:none;text-decoration:none;" />`
    : `<span style="font-size:22px;font-weight:700;color:${BRAND_PRIMARY};letter-spacing:0.02em;">${BRAND_NAME}</span>`;

  let ctaBlock = "";
  if (cta && cta.href && cta.label) {
    ctaBlock = `
          <tr>
            <td style="padding:8px 28px 24px;">
              <a href="${escapeHtml(cta.href)}" style="display:inline-block;background:${BRAND_PRIMARY};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;">
                ${escapeHtml(cta.label)}
              </a>
            </td>
          </tr>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f4;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f4;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:#ffffff;padding:20px 28px 16px;border-bottom:3px solid ${BRAND_PRIMARY};">
              ${logo}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#122018;">${safeTitle}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 8px;font-size:15px;line-height:1.55;color:#333333;">
              ${bodyHtml}
            </td>
          </tr>
          ${ctaBlock}
          <tr>
            <td style="padding:24px 28px 28px;font-size:12px;line-height:1.5;color:#6b7280;border-top:1px solid #e8eee9;">
              ${safeFooter}<br />
              <a href="https://gasnationweed.com" style="color:${BRAND_PRIMARY};text-decoration:none;">gasnationweed.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = {
  BRAND_PRIMARY,
  BRAND_NAME,
  escapeHtml,
  renderBrandedLayout
};
