const express = require("express");

const { getConfig } = require("./store.controller");

const router = express.Router();

router.get("/config", getConfig);

module.exports = router;
