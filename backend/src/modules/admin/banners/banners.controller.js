const {
  createAdminBanner,
  getAdminBannerById,
  listAdminBanners,
  restoreAdminBanner,
  softDeleteAdminBanner,
  updateAdminBanner,
  uploadAdminBannerImage
} = require("../../banners/banners.service");

async function listBanners(req, res, next) {
  try {
    const banners = await listAdminBanners();
    return res.status(200).json({
      success: true,
      message: "Admin banners fetched successfully.",
      data: { banners }
    });
  } catch (error) {
    next(error);
  }
}

async function getBanner(req, res, next) {
  try {
    const banner = await getAdminBannerById(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Admin banner fetched successfully.",
      data: { banner }
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

async function createBanner(req, res, next) {
  try {
    const banner = await createAdminBanner(req.body || {});
    return res.status(201).json({
      success: true,
      message: "Banner created successfully.",
      data: { banner }
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

async function updateBanner(req, res, next) {
  try {
    const banner = await updateAdminBanner(req.params.id, req.body || {});
    return res.status(200).json({
      success: true,
      message: "Banner updated successfully.",
      data: { banner }
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

async function deleteBanner(req, res, next) {
  try {
    const banner = await softDeleteAdminBanner(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully.",
      data: { banner }
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

async function restoreBanner(req, res, next) {
  try {
    const banner = await restoreAdminBanner(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Banner restored successfully.",
      data: { banner }
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

async function uploadBannerImage(req, res, next) {
  try {
    const banner = await uploadAdminBannerImage(req.params.id, req.file);
    return res.status(200).json({
      success: true,
      message: "Banner image uploaded successfully.",
      data: { banner }
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
  createBanner,
  deleteBanner,
  getBanner,
  listBanners,
  restoreBanner,
  updateBanner,
  uploadBannerImage
};
