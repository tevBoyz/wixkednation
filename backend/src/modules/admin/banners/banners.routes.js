const express = require("express");

const authMiddleware = require("../../../middleware/auth.middleware");
const adminMiddleware = require("../../../middleware/admin.middleware");
const {
  productImageUploadMiddleware
} = require("../../../middleware/upload.middleware");

const {
  createBanner,
  deleteBanner,
  getBanner,
  listBanners,
  restoreBanner,
  updateBanner,
  uploadBannerImage
} = require("./banners.controller");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", listBanners);

router.post("/", createBanner);

router.post("/:id/image", productImageUploadMiddleware, uploadBannerImage);

router.patch("/:id/restore", restoreBanner);

router.get("/:id", getBanner);

router.patch("/:id", updateBanner);

router.delete("/:id", deleteBanner);

module.exports = router;
