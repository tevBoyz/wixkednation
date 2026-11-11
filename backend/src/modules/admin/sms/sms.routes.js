const express = require("express");

const authMiddleware = require("../../../middleware/auth.middleware");
const adminMiddleware = require("../../../middleware/admin.middleware");

const { sendTestSms, getLogs } = require("./sms.controller");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/logs", getLogs);
router.post("/test", sendTestSms);

module.exports = router;
