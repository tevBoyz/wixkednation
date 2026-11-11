const express = require("express");

const authMiddleware = require("../../../middleware/auth.middleware");
const adminMiddleware = require("../../../middleware/admin.middleware");
const {
  exportLeads,
  listCampaigns,
  listLeads,
} = require("./leads.controller");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", listLeads);
router.get("/campaigns", listCampaigns);
router.get("/export", exportLeads);

module.exports = router;
