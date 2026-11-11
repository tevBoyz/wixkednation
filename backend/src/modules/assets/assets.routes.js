const express = require("express");

const { streamBannerImage } = require("./banner-images.controller");
const { streamBlogImage } = require("./blog-images.controller");
const { streamProductImage } = require("./product-images.controller");

const router = express.Router();

router.get("/product-images/:productId/:imageFile", streamProductImage);
router.get("/banner-images/:bannerId/:imageFile", streamBannerImage);
router.get("/blog-images/:postId/:kind/:imageFile", streamBlogImage);

module.exports = router;
