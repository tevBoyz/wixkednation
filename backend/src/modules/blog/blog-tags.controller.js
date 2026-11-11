const {
  getPublicBlogTagBySlug,
  listPublicBlogTags
} = require("./blog-tags.service");

async function listTags(req, res, next) {
  try {
    const tags = await listPublicBlogTags();
    return res.status(200).json({
      success: true,
      message: "Blog tags fetched successfully.",
      data: { tags }
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

async function getTag(req, res, next) {
  try {
    const data = await getPublicBlogTagBySlug(req.params.slug, req.query || {});
    return res.status(200).json({
      success: true,
      message: "Blog tag fetched successfully.",
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

module.exports = {
  getTag,
  listTags
};
