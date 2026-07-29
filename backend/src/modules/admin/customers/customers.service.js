const prisma = require("../../../config/prisma");
const { mapReputation } = require("../../reputation/reputation.service");
const { mapOrder } = require("../../orders/orders.service");

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(value, fieldName = "id") {
  if (!value || typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw createServiceError(`Invalid ${fieldName}.`, 400);
  }

  return value;
}

const ORDER_STATUSES = new Set([
  "Pending",
  "Confirmed",
  "OutForDelivery",
  "Delivered",
  "Cancelled"
]);

async function assertCustomerExists(customerId) {
  const user = await prisma.user.findFirst({
    where: {
      id: customerId,
      role: "customer",
      deletedAt: null
    },
    select: {
      id: true
    }
  });

  if (!user) {
    throw createServiceError("Customer not found.", 404);
  }

  return user;
}

async function listAdminCustomers(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const where = {
    role: "customer",
    deletedAt: null
  };

  if (query.search && String(query.search).trim()) {
    const search = String(query.search).trim();

    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        phone: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        email: {
          contains: search,
          mode: "insensitive"
        }
      }
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        authProvider: true,
        reputationScore: true,
        deliveredOrderCount: true,
        cancelledOrderCount: true,
        createdAt: true,
        _count: {
          select: {
            orders: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      }
    }),
    prisma.user.count({
      where
    })
  ]);

  return {
    customers: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      authProvider: customer.authProvider,
      reputation: mapReputation(customer),
      orderCount: customer._count.orders,
      createdAt: customer.createdAt
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0
    }
  };
}

async function getAdminCustomerOrders(customerId, query = {}) {
  assertUuid(customerId, "customerId");
  await assertCustomerExists(customerId);

  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const where = {
    userId: customerId,
    deletedAt: null
  };

  if (query.status) {
    if (!ORDER_STATUSES.has(query.status)) {
      throw createServiceError("Invalid order status filter.", 400);
    }

    where.status = query.status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit
    }),
    prisma.order.count({
      where
    })
  ]);

  return {
    orders: orders.map(mapOrder),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0
    }
  };
}

async function getAdminCustomerById(customerId) {
  assertUuid(customerId, "customerId");

  const user = await prisma.user.findFirst({
    where: {
      id: customerId,
      role: "customer",
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      authProvider: true,
      role: true,
      reputationScore: true,
      deliveredOrderCount: true,
      cancelledOrderCount: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw createServiceError("Customer not found.", 404);
  }

  const [orderCount, recentOrders] = await Promise.all([
    prisma.order.count({
      where: {
        userId: user.id,
        deletedAt: null
      }
    }),
    prisma.order.findMany({
      where: {
        userId: user.id,
        deletedAt: null
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true
      }
    })
  ]);

  return {
    customer: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      authProvider: user.authProvider,
      role: user.role,
      reputation: mapReputation(user),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    },
    orderCount,
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount:
        order.totalAmount === null || order.totalAmount === undefined
          ? null
          : Number(order.totalAmount).toFixed(2),
      createdAt: order.createdAt
    }))
  };
}

module.exports = {
  getAdminCustomerById,
  getAdminCustomerOrders,
  listAdminCustomers
};
