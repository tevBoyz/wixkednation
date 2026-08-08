const express = require("express");

const { getConfig, listBanners } = require("./store.controller");

const router = express.Router();

router.get("/config", getConfig);
router.get("/banners", listBanners);

module.exports = router;
