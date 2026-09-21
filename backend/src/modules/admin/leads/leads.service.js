const prisma = require("../../../config/prisma");

function createServiceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function mapLead(row) {
  const coupon = row.coupon;
  return {
    id: row.id,
    email: row.email,
    campaignKey: row.campaignKey,
    source: row.source || null,
    createdAt: row.createdAt,
    couponId: row.couponId,
    couponCode: coupon?.code || null,
    couponName: coupon?.name || null,
    couponType: coupon?.type || null,
    couponStatus: coupon?.status || null,
    redemptionCount: coupon?.redemptionCount ?? 0,
    redeemed: Boolean(coupon && coupon.redemptionCount > 0),
  };
}

async function listAdminLeads(query = {}) {
  const page = Math.max(1, Number.parseInt(String(query.page), 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(String(query.limit), 10) || 25),
  );
  const skip = (page - 1) * limit;

  const where = {};

  if (query.search && String(query.search).trim()) {
    const search = String(query.search).trim();
    where.email = { contains: search, mode: "insensitive" };
  }

  if (query.campaignKey && String(query.campaignKey).trim()) {
    where.campaignKey = String(query.campaignKey).trim();
  }

  if (query.source && String(query.source).trim()) {
    where.source = {
      contains: String(query.source).trim(),
      mode: "insensitive",
    };
  }

  const [rows, total] = await Promise.all([
    prisma.leadSignup.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        coupon: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            status: true,
            redemptionCount: true,
          },
        },
      },
    }),
    prisma.leadSignup.count({ where }),
  ]);

  return {
    leads: rows.map(mapLead),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

async function listAdminLeadCampaigns() {
  const groups = await prisma.leadSignup.groupBy({
    by: ["campaignKey"],
    _count: { _all: true },
    orderBy: { campaignKey: "asc" },
  });

  return groups.map((row) => ({
    campaignKey: row.campaignKey,
    leadCount: row._count._all,
  }));
}

async function exportAdminLeads(query = {}) {
  const where = {};

  if (query.search && String(query.search).trim()) {
    where.email = {
      contains: String(query.search).trim(),
      mode: "insensitive",
    };
  }
  if (query.campaignKey && String(query.campaignKey).trim()) {
    where.campaignKey = String(query.campaignKey).trim();
  }
  if (query.source && String(query.source).trim()) {
    where.source = {
      contains: String(query.source).trim(),
      mode: "insensitive",
    };
  }

  const rows = await prisma.leadSignup.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: {
      coupon: {
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          status: true,
          redemptionCount: true,
        },
      },
    },
  });

  return {
    leads: rows.map(mapLead),
    truncated: rows.length >= 5000,
  };
}

module.exports = {
  listAdminLeads,
  listAdminLeadCampaigns,
  exportAdminLeads,
  createServiceError,
};
