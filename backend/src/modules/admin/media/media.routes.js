const express = require("express");

const authMiddleware = require("../../../middleware/auth.middleware");
const adminMiddleware = require("../../../middleware/admin.middleware");
const { listMedia } = require("./media.controller");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", listMedia);

module.exports = router;
