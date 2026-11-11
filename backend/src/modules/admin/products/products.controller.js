const {
  createAdminProduct,
  deleteAdminProductImage,
  getAdminProductById,
  listAdminProducts,
  reorderAdminProductImages,
  restoreAdminProduct,
  setAdminProductCoverImage,
  setAdminProductVisibility,
  softDeleteAdminProduct,
  updateAdminProduct,
  uploadAdminProductImage
} = require("../../products/products.service");

async function listProducts(req, res, next) {
  try {
    const result = await listAdminProducts(req.query);

    return res.status(200).json({
      success: true,
      message: "Admin products fetched successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await getAdminProductById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Admin product fetched successfully.",
      data: {
        product
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

async function createProduct(req, res, next) {
  try {
    const product = await createAdminProduct(req.body || {});

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      data: {
        product
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

async function updateProduct(req, res, next) {
  try {
    const product = await updateAdminProduct(req.params.id, req.body || {});

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: {
        product
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

async function updateProductVisibility(req, res, next) {
  try {
    const product = await setAdminProductVisibility(
      req.params.id,
      req.body?.isVisible
    );

    return res.status(200).json({
      success: true,
      message: product.isVisible
        ? "Product is now visible publicly."
        : "Product is now hidden from public endpoints.",
      data: {
        product
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

async function deleteProduct(req, res, next) {
  try {
    const product = await softDeleteAdminProduct(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
      data: {
        product
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

async function restoreProduct(req, res, next) {
  try {
    const product = await restoreAdminProduct(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Product restored successfully.",
      data: {
        product
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

async function uploadProductImage(req, res, next) {
  try {
    const result = await uploadAdminProductImage(req.params.id, req.file);

    return res.status(201).json({
      success: true,
      message: "Product image uploaded successfully.",
      data: result
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

async function deleteProductImage(req, res, next) {
  try {
    const result = await deleteAdminProductImage(
      req.params.id,
      req.params.imageId
    );

    return res.status(200).json({
      success: true,
      message: "Product image deleted successfully.",
      data: result
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

async function setProductCoverImage(req, res, next) {
  try {
    const product = await setAdminProductCoverImage(
      req.params.id,
      req.params.imageId
    );

    return res.status(200).json({
      success: true,
      message: "Product cover image updated successfully.",
      data: {
        product
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

async function reorderProductImages(req, res, next) {
  try {
    const product = await reorderAdminProductImages(
      req.params.id,
      req.body?.imageIds
    );

    return res.status(200).json({
      success: true,
      message: "Product images reordered successfully.",
      data: {
        product
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
};
