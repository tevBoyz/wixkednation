const express = require("express");

const authMiddleware = require("../../middleware/auth.middleware");
const { getMe, updateMe } = require("./users.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getMe);
router.patch("/", updateMe);

module.exports = router;
