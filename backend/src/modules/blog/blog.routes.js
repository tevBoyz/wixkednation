const express = require("express");

const { getPost, listPosts } = require("./blog.controller");
const { getTag, listTags } = require("./blog-tags.controller");

const router = express.Router();

router.get("/", listPosts);
router.get("/tags", listTags);
router.get("/tags/:slug", getTag);
router.get("/:slug", getPost);

module.exports = router;
