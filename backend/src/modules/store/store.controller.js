const { getStoreConfig } = require("./store.service");
const { listPublicActiveBanners } = require("../banners/banners.service");

async function getConfig(req, res, next) {
  try {
    const config = await getStoreConfig();

    return res.status(200).json({
      success: true,
      message: "Store config fetched successfully.",
      data: config
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

async function listBanners(req, res, next) {
  try {
    const banners = await listPublicActiveBanners();

    return res.status(200).json({
      success: true,
      message: "Store banners fetched successfully.",
      data: { banners }
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
  getConfig,
  listBanners
};
