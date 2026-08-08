const express = require("express");

const { streamBannerImage } = require("./banner-images.controller");
const { streamProductImage } = require("./product-images.controller");

const router = express.Router();

router.get("/product-images/:productId/:imageFile", streamProductImage);
router.get("/banner-images/:bannerId/:imageFile", streamBannerImage);

module.exports = router;
