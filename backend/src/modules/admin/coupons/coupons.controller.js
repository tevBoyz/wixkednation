const {
  archiveAdminCoupon,
  createAdminCoupon,
  getAdminCouponById,
  listAdminCoupons,
  updateAdminCoupon,
} = require("../../../services/coupons/coupons.service");

async function listCoupons(req, res, next) {
  try {
    const coupons = await listAdminCoupons();
    return res.status(200).json({
      success: true,
      message: "Coupons fetched successfully.",
      data: { coupons },
    });
  } catch (error) {
    next(error);
  }
}

async function getCoupon(req, res, next) {
  try {
    const coupon = await getAdminCouponById(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Coupon fetched successfully.",
      data: { coupon },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

async function createCoupon(req, res, next) {
  try {
    const coupon = await createAdminCoupon(req.body || {});
    return res.status(201).json({
      success: true,
      message: "Coupon created successfully.",
      data: { coupon },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

async function updateCoupon(req, res, next) {
  try {
    const coupon = await updateAdminCoupon(req.params.id, req.body || {});
    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully.",
      data: { coupon },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

async function archiveCoupon(req, res, next) {
  try {
    const coupon = await archiveAdminCoupon(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Coupon archived successfully.",
      data: { coupon },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

module.exports = {
  listCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  archiveCoupon,
};
