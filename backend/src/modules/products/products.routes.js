const express = require("express");

const {
  getProductBySlug,
  listFeaturedProducts,
  listProducts
} = require("./products.controller");

const router = express.Router();

router.get("/", listProducts);

router.get("/featured", listFeaturedProducts);

router.get("/:slug", getProductBySlug);

module.exports = router;
