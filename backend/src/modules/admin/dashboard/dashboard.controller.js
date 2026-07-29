const {
  getDashboardStats,
  getDashboardRecentOrders
} = require("./dashboard.service");

async function getStats(req, res, next) {
  try {
    const stats = await getDashboardStats();

    return res.status(200).json({
      success: true,
      message: "Dashboard stats fetched successfully.",
      data: {
        stats
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

async function getRecentOrders(req, res, next) {
  try {
    const result = await getDashboardRecentOrders(req.query);

    return res.status(200).json({
      success: true,
      message: "Recent orders fetched successfully.",
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

module.exports = {
  getStats,
  getRecentOrders
};
