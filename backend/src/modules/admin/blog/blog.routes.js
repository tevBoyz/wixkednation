const express = require("express");

const authMiddleware = require("../../../middleware/auth.middleware");
const adminMiddleware = require("../../../middleware/admin.middleware");
const {
  productImageUploadMiddleware
} = require("../../../middleware/upload.middleware");

const {
  createPost,
  createTag,
  deletePost,
  getPost,
  listPosts,
  listTags,
  restorePost,
  updatePost,
  updateTag,
  uploadCover,
  uploadMedia
} = require("./blog.controller");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", listPosts);
router.post("/", createPost);
router.get("/tags", listTags);
router.post("/tags", createTag);
router.patch("/tags/:id", updateTag);
router.post("/:id/cover", productImageUploadMiddleware, uploadCover);
router.post("/:id/media", productImageUploadMiddleware, uploadMedia);
router.patch("/:id/restore", restorePost);
router.get("/:id", getPost);
router.patch("/:id", updatePost);
router.delete("/:id", deletePost);

module.exports = router;
