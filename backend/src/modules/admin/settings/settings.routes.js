const express = require("express");

const authMiddleware = require("../../../middleware/auth.middleware");
const adminMiddleware = require("../../../middleware/admin.middleware");

const {
  createAdminPhone,
  deleteAdminPhone,
  getSettings,
  patchAdminPhone,
  patchSettings,
  patchSms
} = require("./settings.controller");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", getSettings);
router.patch("/", patchSettings);
router.post("/admin-phones", createAdminPhone);
router.patch("/admin-phones/:phoneId", patchAdminPhone);
router.delete("/admin-phones/:phoneId", deleteAdminPhone);
router.patch("/sms", patchSms);

module.exports = router;
