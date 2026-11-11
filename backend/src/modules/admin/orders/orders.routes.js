const express = require("express");

const authMiddleware = require("../../../middleware/auth.middleware");
const adminMiddleware = require("../../../middleware/admin.middleware");

const {
  getOrder,
  listOrders,
  updateOrderStatus
} = require("./orders.controller");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", listOrders);

router.patch("/:id/status", updateOrderStatus);

router.get("/:id", getOrder);

module.exports = router;
