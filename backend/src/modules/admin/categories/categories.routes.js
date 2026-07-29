const express = require("express");

const authMiddleware = require("../../../middleware/auth.middleware");
const adminMiddleware = require("../../../middleware/admin.middleware");

const {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  restoreCategory,
  updateCategory
} = require("./categories.controller");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", listCategories);

router.post("/", createCategory);

router.patch("/:id/restore", restoreCategory);

router.get("/:id", getCategory);

router.patch("/:id", updateCategory);

router.delete("/:id", deleteCategory);

module.exports = router;
