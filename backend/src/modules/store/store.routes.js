const express = require("express");

const { getConfig, listBanners } = require("./store.controller");
const {
  claimLead,
  getClaimCampaign,
  listClaimCampaigns,
  validateCoupon,
} = require("./store-coupons.controller");

const router = express.Router();

router.get("/config", getConfig);
router.get("/banners", listBanners);
router.post("/coupons/validate", validateCoupon);
router.get("/claims", listClaimCampaigns);
router.get("/claims/:slug", getClaimCampaign);
router.post("/claims/:slug", claimLead);

module.exports = router;
