const express = require("express");

const authMiddleware = require("../../middleware/auth.middleware");
const customerMiddleware = require("../../middleware/customer.middleware");

const {
  addItem,
  clear,
  getCart,
  merge,
  removeItem,
  updateItem
} = require("./cart.controller");

const router = express.Router();

router.use(authMiddleware, customerMiddleware);

router.get("/", getCart);

router.post("/items", addItem);

router.post("/merge", merge);

router.patch("/items/:itemId", updateItem);

router.delete("/items/:itemId", removeItem);

router.delete("/", clear);

module.exports = router;
