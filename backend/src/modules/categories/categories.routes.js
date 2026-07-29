const express = require("express");

const {
  getCategoryBySlug,
  listCategories
} = require("./categories.controller");

const router = express.Router();

router.get("/", listCategories);

router.get("/:slug", getCategoryBySlug);

module.exports = router;
