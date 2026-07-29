const {
  getPublicProductBySlug,
  listFeaturedPublicProducts,
  listPublicProducts
} = require("./products.service");

async function listProducts(req, res, next) {
  try {
    const result = await listPublicProducts(req.query);

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function listFeaturedProducts(req, res, next) {
  try {
    const result = await listFeaturedPublicProducts(req.query);

    return res.status(200).json({
      success: true,
      message: "Featured products fetched successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getProductBySlug(req, res, next) {
  try {
    const product = await getPublicProductBySlug(req.params.slug);

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully.",
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
  getProductBySlug,
  listFeaturedProducts,
  listProducts
};
