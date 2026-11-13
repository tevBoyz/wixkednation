const env = require("./env");

const DEPLOYED_FRONTEND_ORIGINS = new Set([
  "https://www.wixkednation.com",
  "https://wixkednation.com"
]);

function normalizeOrigin(origin) {
  return String(origin || "").trim().replace(/\/+$/, "");
}

const configuredOrigins = new Set(
  [env.frontendUrl, ...(env.corsOrigins || [])]
    .map(normalizeOrigin)
    .filter(Boolean)
);

function isLocalDevelopmentOrigin(origin) {
  try {
    const url = new URL(origin);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  const normalized = normalizeOrigin(origin);

  return (
    configuredOrigins.has(normalized) ||
    DEPLOYED_FRONTEND_ORIGINS.has(normalized) ||
    isLocalDevelopmentOrigin(normalized)
  );
}

function corsOrigin(origin, callback) {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error("Origin is not allowed by CORS."));
}

module.exports = {
  corsOrigin,
  isAllowedOrigin
};
