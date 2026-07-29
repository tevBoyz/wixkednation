const {
  getPublicCategoryBySlug,
  listPublicCategories
} = require("./categories.service");

async function listCategories(req, res, next) {
  try {
    const categories = await listPublicCategories();

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully.",
      data: {
        categories
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getCategoryBySlug(req, res, next) {
  try {
    const category = await getPublicCategoryBySlug(req.params.slug);

    return res.status(200).json({
      success: true,
      message: "Category fetched successfully.",
      data: {
        category
      }
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
  getCategoryBySlug,
  listCategories
};
