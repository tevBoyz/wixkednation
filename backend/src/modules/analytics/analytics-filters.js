/** Owner traffic from Ethiopia is excluded from storefront analytics. */
const IGNORED_COUNTRY_CODES = new Set(["ET"]);

const countryDisplayNames = new Intl.DisplayNames(["en"], { type: "region" });

function isIgnoredAnalyticsCountry(code) {
  return typeof code === "string" && IGNORED_COUNTRY_CODES.has(code.toUpperCase());
}

function formatAnalyticsCountry(code) {
  if (!code || code === "unknown") {
    return "Unknown";
  }

  const iso = String(code).trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(iso)) {
    return code;
  }

  try {
    const name = countryDisplayNames.of(iso);
    if (name && name !== iso) {
      return `${name} (${iso})`;
    }
  } catch {
    // Invalid region code
  }

  return iso;
}

module.exports = {
  IGNORED_COUNTRY_CODES,
  isIgnoredAnalyticsCountry,
  formatAnalyticsCountry
};
