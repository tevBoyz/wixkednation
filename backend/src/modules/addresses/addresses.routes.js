const express = require("express");

const authMiddleware = require("../../middleware/auth.middleware");
const customerMiddleware = require("../../middleware/customer.middleware");

const {
  create,
  list,
  remove,
  update
} = require("./addresses.controller");

const router = express.Router();

router.use(authMiddleware, customerMiddleware);

router.get("/", list);

router.post("/", create);

router.patch("/:addressId", update);

router.delete("/:addressId", remove);

module.exports = router;
