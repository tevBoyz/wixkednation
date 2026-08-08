const { collectPageView } = require("./analytics.service");

async function collect(req, res, next) {
  try {
    const result = await collectPageView(req.body || {}, req);

    return res.status(200).json({
      success: true,
      message: "Recorded.",
      data: result
    });
  } catch (error) {
    if (error.statusCode === 204) {
      return res.status(204).end();
    }

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
  collect
};
