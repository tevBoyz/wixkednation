const express = require("express");

const { collect } = require("./analytics.controller");

const router = express.Router();

router.post("/collect", collect);

module.exports = router;
