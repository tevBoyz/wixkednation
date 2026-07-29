const express = require("express");

const authMiddleware = require("../../../middleware/auth.middleware");
const adminMiddleware = require("../../../middleware/admin.middleware");

const { getCustomer, getCustomerOrders, listCustomers } = require("./customers.controller");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", listCustomers);
router.get("/:id/orders", getCustomerOrders);
router.get("/:id", getCustomer);

module.exports = router;
