const {
  getPublicBlogPostBySlug,
  listPublicBlogPosts
} = require("./blog.service");

async function listPosts(req, res, next) {
  try {
    const data = await listPublicBlogPosts(req.query || {});
    return res.status(200).json({
      success: true,
      message: "Blog posts fetched successfully.",
      data
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

async function getPost(req, res, next) {
  try {
    const post = await getPublicBlogPostBySlug(req.params.slug);
    return res.status(200).json({
      success: true,
      message: "Blog post fetched successfully.",
      data: { post }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

module.exports = {
  getPost,
  listPosts
};
