const prisma = require("../../../config/prisma");
const { listAdminOrders } = require("../../orders/orders.service");
const { getSmsStatus } = require("../../../services/sms/sms.service");

async function getDashboardStats() {
  const orderBase = { deletedAt: null };
  const productBase = { deletedAt: null };

  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    outForDeliveryOrders,
    deliveredOrders,
    cancelledOrders,
    totalProducts,
    visibleProducts,
    hiddenProducts,
    totalCustomers,
    sms
  ] = await Promise.all([
    prisma.order.count({ where: orderBase }),
    prisma.order.count({ where: { ...orderBase, status: "Pending" } }),
    prisma.order.count({ where: { ...orderBase, status: "Confirmed" } }),
    prisma.order.count({ where: { ...orderBase, status: "OutForDelivery" } }),
    prisma.order.count({ where: { ...orderBase, status: "Delivered" } }),
    prisma.order.count({ where: { ...orderBase, status: "Cancelled" } }),
    prisma.product.count({ where: productBase }),
    prisma.product.count({ where: { ...productBase, isVisible: true } }),
    prisma.product.count({ where: { ...productBase, isVisible: false } }),
    prisma.user.count({
      where: {
        role: "customer",
        deletedAt: null
      }
    }),
    getSmsStatus()
  ]);

  return {
    totalOrders,
    pendingOrders,
    confirmedOrders,
    outForDeliveryOrders,
    deliveredOrders,
    cancelledOrders,
    totalProducts,
    visibleProducts,
    hiddenProducts,
    totalCustomers,
    sms
  };
}

async function getDashboardRecentOrders(query = {}) {
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 10));

  return listAdminOrders({
    page: 1,
    limit
  });
}

module.exports = {
  getDashboardStats,
  getDashboardRecentOrders
};
