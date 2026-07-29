const { listAdminMedia } = require("./media.service");

async function listMedia(req, res, next) {
  try {
    const result = await listAdminMedia(req.query);

    return res.status(200).json({
      success: true,
      message: "Media library fetched successfully.",
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
  listMedia
};
