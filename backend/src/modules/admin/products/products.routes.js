const express = require("express");

const authMiddleware = require("../../../middleware/auth.middleware");
const adminMiddleware = require("../../../middleware/admin.middleware");
const {
  productImageUploadMiddleware
} = require("../../../middleware/upload.middleware");

const {
  createProduct,
  deleteProduct,
  deleteProductImage,
  getProduct,
  listProducts,
  reorderProductImages,
  restoreProduct,
  setProductCoverImage,
  updateProduct,
  updateProductVisibility,
  uploadProductImage
} = require("./products.controller");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", listProducts);

router.post("/", createProduct);

router.post("/:id/images", productImageUploadMiddleware, uploadProductImage);

router.patch("/:id/images/reorder", reorderProductImages);

router.patch("/:id/images/:imageId/cover", setProductCoverImage);

router.delete("/:id/images/:imageId", deleteProductImage);

router.patch("/:id/visibility", updateProductVisibility);

router.patch("/:id/restore", restoreProduct);

router.get("/:id", getProduct);

router.patch("/:id", updateProduct);

router.delete("/:id", deleteProduct);

module.exports = router;
