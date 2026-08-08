const prisma = require("../../../config/prisma");

function createAnalyticsError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseRange(query = {}) {
  const now = new Date();
  let to = query.to ? new Date(query.to) : now;
  let from = query.from ? new Date(query.from) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw createAnalyticsError("Invalid from/to date.", 400);
  }

  if (from > to) {
    throw createAnalyticsError("from must be before to.", 400);
  }

  // Inclusive end-of-day for date-only strings
  if (typeof query.to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.to)) {
    to = new Date(`${query.to}T23:59:59.999Z`);
  }
  if (typeof query.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.from)) {
    from = new Date(`${query.from}T00:00:00.000Z`);
  }

  const maxSpanMs = 90 * 24 * 60 * 60 * 1000;
  if (to.getTime() - from.getTime() > maxSpanMs) {
    throw createAnalyticsError("Date range cannot exceed 90 days.", 400);
  }

  return { from, to };
}

function mapTopRows(rows, keyField) {
  return rows.map((row) => ({
    key: row[keyField] || "unknown",
    count: Number(row.count) || 0
  }));
}

async function getAnalyticsSummary(query = {}) {
  const { from, to } = parseRange(query);

  const [
    pageViews,
    sessions,
    uniqueRows,
    seriesRows,
    topPaths,
    topCountries,
    topSources
  ] = await Promise.all([
    prisma.analyticsPageView.count({
      where: {
        createdAt: { gte: from, lte: to }
      }
    }),
    prisma.analyticsSession.count({
      where: {
        startedAt: { gte: from, lte: to }
      }
    }),
    prisma.$queryRaw`
      SELECT COUNT(DISTINCT "visitorId")::int AS count
      FROM "analytics_sessions"
      WHERE "startedAt" >= ${from} AND "startedAt" <= ${to}
    `,
    prisma.$queryRaw`
      WITH days AS (
        SELECT generate_series(
          date_trunc('day', ${from}::timestamptz),
          date_trunc('day', ${to}::timestamptz),
          interval '1 day'
        )::date AS day
      ),
      session_stats AS (
        SELECT
          date_trunc('day', "startedAt")::date AS day,
          COUNT(*)::int AS sessions,
          COUNT(DISTINCT "visitorId")::int AS unique_visitors
        FROM "analytics_sessions"
        WHERE "startedAt" >= ${from} AND "startedAt" <= ${to}
        GROUP BY 1
      ),
      view_stats AS (
        SELECT
          date_trunc('day', "createdAt")::date AS day,
          COUNT(*)::int AS page_views
        FROM "analytics_page_views"
        WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
        GROUP BY 1
      )
      SELECT
        to_char(d.day, 'YYYY-MM-DD') AS date,
        COALESCE(v.page_views, 0)::int AS "pageViews",
        COALESCE(s.sessions, 0)::int AS sessions,
        COALESCE(s.unique_visitors, 0)::int AS "uniqueVisitors"
      FROM days d
      LEFT JOIN session_stats s ON s.day = d.day
      LEFT JOIN view_stats v ON v.day = d.day
      ORDER BY d.day ASC
    `,
    prisma.$queryRaw`
      SELECT "path" AS key, COUNT(*)::int AS count
      FROM "analytics_page_views"
      WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
      GROUP BY "path"
      ORDER BY count DESC
      LIMIT 10
    `,
    prisma.$queryRaw`
      SELECT COALESCE("country", 'unknown') AS key, COUNT(*)::int AS count
      FROM "analytics_sessions"
      WHERE "startedAt" >= ${from} AND "startedAt" <= ${to}
      GROUP BY 1
      ORDER BY count DESC
      LIMIT 10
    `,
    prisma.$queryRaw`
      SELECT COALESCE("source", 'direct') AS key, COUNT(*)::int AS count
      FROM "analytics_sessions"
      WHERE "startedAt" >= ${from} AND "startedAt" <= ${to}
      GROUP BY 1
      ORDER BY count DESC
      LIMIT 10
    `
  ]);

  const uniqueVisitors = Number(uniqueRows?.[0]?.count) || 0;

  return {
    range: {
      from: from.toISOString(),
      to: to.toISOString()
    },
    totals: {
      pageViews,
      sessions,
      uniqueVisitors
    },
    series: (seriesRows || []).map((row) => ({
      date: row.date,
      pageViews: Number(row.pageViews) || 0,
      sessions: Number(row.sessions) || 0,
      uniqueVisitors: Number(row.uniqueVisitors) || 0
    })),
    topPaths: mapTopRows(topPaths || [], "key"),
    topCountries: mapTopRows(topCountries || [], "key"),
    topSources: mapTopRows(topSources || [], "key")
  };
}

module.exports = {
  getAnalyticsSummary
};
