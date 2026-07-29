const express = require("express");

const { block, verify } = require("./age-gate.controller");

const router = express.Router();

router.post("/verify", verify);
router.post("/block", block);

module.exports = router;
