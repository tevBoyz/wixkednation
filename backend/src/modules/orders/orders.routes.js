const express = require("express");

const authMiddleware = require("../../middleware/auth.middleware");
const customerMiddleware = require("../../middleware/customer.middleware");

const {
  cancelMyOrder,
  createGuestOrderHandler,
  createOrder,
  getMyOrderHandler,
  listMyOrdersHandler
} = require("./orders.controller");

const router = express.Router();

// Public guest checkout - must stay above auth middleware.
router.post("/guest", createGuestOrderHandler);

router.use(authMiddleware, customerMiddleware);

router.post("/", createOrder);

router.get("/me", listMyOrdersHandler);

router.get("/me/:orderId", getMyOrderHandler);

router.post("/:orderId/cancel", cancelMyOrder);

module.exports = router;
