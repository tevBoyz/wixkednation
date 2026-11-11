const {
  getAdminOrderById,
  listAdminOrders,
  updateAdminOrderStatus
} = require("../../orders/orders.service");

async function listOrders(req, res, next) {
  try {
    const result = await listAdminOrders(req.query);

    return res.status(200).json({
      success: true,
      message: "Admin orders fetched successfully.",
      data: result
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
}

async function getOrder(req, res, next) {
  try {
    const order = await getAdminOrderById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Admin order fetched successfully.",
      data: {
        order
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const result = await updateAdminOrderStatus(
      req.params.id,
      req.user.id,
      req.body || {}
    );

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      data: result
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
}

module.exports = {
  getOrder,
  listOrders,
  updateOrderStatus
};
