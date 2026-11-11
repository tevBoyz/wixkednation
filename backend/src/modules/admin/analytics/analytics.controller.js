const { getAnalyticsSummary } = require("./analytics.service");

async function getSummary(req, res, next) {
  try {
    const data = await getAnalyticsSummary(req.query);

    return res.status(200).json({
      success: true,
      message: "Analytics fetched successfully.",
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
  getSummary
};
