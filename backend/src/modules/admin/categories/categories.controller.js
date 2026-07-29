const {
  createAdminCategory,
  getAdminCategoryById,
  listAdminCategories,
  restoreAdminCategory,
  softDeleteAdminCategory,
  updateAdminCategory
} = require("../../categories/categories.service");

async function listCategories(req, res, next) {
  try {
    const categories = await listAdminCategories();

    return res.status(200).json({
      success: true,
      message: "Admin categories fetched successfully.",
      data: {
        categories
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getCategory(req, res, next) {
  try {
    const category = await getAdminCategoryById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Admin category fetched successfully.",
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

async function createCategory(req, res, next) {
  try {
    const category = await createAdminCategory(req.body || {});

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
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

async function updateCategory(req, res, next) {
  try {
    const category = await updateAdminCategory(req.params.id, req.body || {});

    return res.status(200).json({
      success: true,
      message: "Category updated successfully.",
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

async function deleteCategory(req, res, next) {
  try {
    const category = await softDeleteAdminCategory(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
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

async function restoreCategory(req, res, next) {
  try {
    const category = await restoreAdminCategory(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Category restored successfully.",
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
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  restoreCategory,
  updateCategory
};
