const crypto = require("crypto");

const geoip = require("geoip-lite");

const env = require("../../config/env");
const prisma = require("../../config/prisma");
const { isIgnoredAnalyticsCountry } = require("./analytics-filters");

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BOT_RE =
  /bot|spider|crawl|slurp|facebookexternalhit|preview|wget|curl|python-requests|headless/i;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;
const rateBuckets = new Map();

function createAnalyticsError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

function truncate(value, max) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, max);
}

function normalizePath(path) {
  if (typeof path !== "string" || !path.trim()) {
    throw createAnalyticsError("path is required.", 400);
  }

  let normalized = path.trim();
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  if (normalized.length > 500) {
    throw createAnalyticsError("path is too long.", 400);
  }
  if (normalized === "/admin" || normalized.startsWith("/admin/")) {
    throw createAnalyticsError("Admin paths are not tracked.", 400);
  }

  return normalized;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "";
}

function hashIp(ip) {
  if (!ip) {
    return null;
  }
  return crypto
    .createHash("sha256")
    .update(`${env.analytics.ipSalt}:${ip}`)
    .digest("hex");
}

function lookupGeo(ip) {
  if (!ip) {
    return { country: null, region: null, city: null };
  }

  try {
    const geo = geoip.lookup(ip);
    if (!geo) {
      return { country: null, region: null, city: null };
    }
    return {
      country: geo.country || null,
      region: Array.isArray(geo.region) ? geo.region[0] || null : geo.region || null,
      city: geo.city || null
    };
  } catch {
    return { country: null, region: null, city: null };
  }
}

function referrerHost(referrer) {
  if (!referrer) {
    return null;
  }
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    return host || null;
  } catch {
    return truncate(referrer, 200);
  }
}

function resolveSource({ utmSource, referrer }) {
  const utm = truncate(utmSource, 100);
  if (utm) {
    return utm.toLowerCase();
  }
  const host = referrerHost(referrer);
  if (host) {
    return host;
  }
  return "direct";
}

function assertNotBot(userAgent) {
  if (userAgent && BOT_RE.test(userAgent)) {
    throw createAnalyticsError("Bot traffic ignored.", 204);
  }
}

function assertRateLimit(ip) {
  const key = ip || "unknown";
  const now = Date.now();
  let bucket = rateBuckets.get(key);

  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    bucket = { windowStart: now, count: 0 };
    rateBuckets.set(key, bucket);
  }

  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_MAX) {
    throw createAnalyticsError("Too many analytics events.", 429);
  }

  if (rateBuckets.size > 5000) {
    for (const [entryKey, entry] of rateBuckets) {
      if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
        rateBuckets.delete(entryKey);
      }
    }
  }
}

async function collectPageView(body, req) {
  const visitorId = body?.visitorId;
  const sessionId = body?.sessionId;

  if (!isUuid(visitorId) || !isUuid(sessionId)) {
    throw createAnalyticsError("visitorId and sessionId must be UUIDs.", 400);
  }

  const path = normalizePath(body.path);
  const userAgent = truncate(req.headers["user-agent"] || "", 400);
  assertNotBot(userAgent);

  const ip = getClientIp(req);
  assertRateLimit(ip);

  const referrer = truncate(body.referrer, 500);
  const landingPath = normalizePath(body.landingPath || path);
  const utmSource = truncate(body.utmSource, 100);
  const utmMedium = truncate(body.utmMedium, 100);
  const utmCampaign = truncate(body.utmCampaign, 100);
  const ipHash = hashIp(ip);
  const now = new Date();

  const existing = await prisma.analyticsSession.findUnique({
    where: { id: sessionId }
  });

  if (existing) {
    if (isIgnoredAnalyticsCountry(existing.country)) {
      throw createAnalyticsError("Owner traffic ignored.", 204);
    }

    await prisma.$transaction([
      prisma.analyticsSession.update({
        where: { id: sessionId },
        data: {
          lastSeenAt: now,
          pageViewCount: { increment: 1 }
        }
      }),
      prisma.analyticsPageView.create({
        data: {
          sessionId,
          path
        }
      })
    ]);

    return { recorded: true, sessionId };
  }

  const geo = lookupGeo(ip);
  if (isIgnoredAnalyticsCountry(geo.country)) {
    throw createAnalyticsError("Owner traffic ignored.", 204);
  }

  const source = resolveSource({ utmSource, referrer });

  await prisma.$transaction([
    prisma.analyticsSession.create({
      data: {
        id: sessionId,
        visitorId,
        landingPath,
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
        source,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        ipHash,
        userAgent,
        startedAt: now,
        lastSeenAt: now,
        pageViewCount: 1
      }
    }),
    prisma.analyticsPageView.create({
      data: {
        sessionId,
        path
      }
    })
  ]);

  return { recorded: true, sessionId };
}

module.exports = {
  collectPageView
};
