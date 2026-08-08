const express = require("express");

const authMiddleware = require("../../../middleware/auth.middleware");
const adminMiddleware = require("../../../middleware/admin.middleware");
const { getSummary } = require("./analytics.controller");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", getSummary);

module.exports = router;
