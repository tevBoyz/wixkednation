const {
  cancelCustomerOrder,
  createGuestOrder,
  createOrderFromCart,
  getMyOrderById,
  listMyOrders
} = require("./orders.service");

function sendServiceError(res, error) {
  if (!error.statusCode) {
    return false;
  }

  const body = {
    success: false,
    message: error.message
  };

  if (error.code && typeof error.code === "string" && !error.code.startsWith("P")) {
    body.code = error.code;
  }

  if (error.blockedUntil) {
    body.blockedUntil = error.blockedUntil;
  }

  res.status(error.statusCode).json(body);
  return true;
}

async function createOrder(req, res, next) {
  try {
    const result = await createOrderFromCart(req.user.id, req.body || {});

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      data: result
    });
  } catch (error) {
    if (sendServiceError(res, error)) {
      return undefined;
    }

    next(error);
  }
}

async function createGuestOrderHandler(req, res, next) {
  try {
    const result = await createGuestOrder(req.body || {});

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      data: result
    });
  } catch (error) {
    if (sendServiceError(res, error)) {
      return undefined;
    }

    next(error);
  }
}

async function listMyOrdersHandler(req, res, next) {
  try {
    const result = await listMyOrders(req.user.id, req.query);

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getMyOrderHandler(req, res, next) {
  try {
    const order = await getMyOrderById(req.user.id, req.params.orderId);

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully.",
      data: {
        order
      }
    });
  } catch (error) {
    if (sendServiceError(res, error)) {
      return undefined;
    }

    next(error);
  }
}

async function cancelMyOrder(req, res, next) {
  try {
    const result = await cancelCustomerOrder(
      req.user.id,
      req.params.orderId,
      req.body || {}
    );

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      data: result
    });
  } catch (error) {
    if (sendServiceError(res, error)) {
      return undefined;
    }

    next(error);
  }
}

module.exports = {
  cancelMyOrder,
  createGuestOrderHandler,
  createOrder,
  getMyOrderHandler,
  listMyOrdersHandler
};
