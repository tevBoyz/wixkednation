const express = require("express");

const { streamProductImage } = require("./product-images.controller");

const router = express.Router();

router.get("/product-images/:productId/:imageFile", streamProductImage);

module.exports = router;
