const express = require("express");

const authMiddleware = require("../../../middleware/auth.middleware");
const adminMiddleware = require("../../../middleware/admin.middleware");
const {
  archiveCoupon,
  createCoupon,
  getCoupon,
  listCoupons,
  updateCoupon,
} = require("./coupons.controller");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", listCoupons);
router.post("/", createCoupon);
router.get("/:id", getCoupon);
router.patch("/:id", updateCoupon);
router.post("/:id/archive", archiveCoupon);

module.exports = router;
