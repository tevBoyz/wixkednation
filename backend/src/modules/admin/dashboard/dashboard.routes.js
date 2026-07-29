const express = require("express");

const authMiddleware = require("../../../middleware/auth.middleware");
const adminMiddleware = require("../../../middleware/admin.middleware");
const { getStats, getRecentOrders } = require("./dashboard.controller");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/stats", getStats);
router.get("/recent-orders", getRecentOrders);

module.exports = router;
