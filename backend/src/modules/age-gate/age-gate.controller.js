const { blockAgeGate, verifyAgeGate } = require("./age-gate.service");

async function verify(req, res, next) {
  try {
    const result = verifyAgeGate(req.body);

    return res.status(200).json({
      success: true,
      message: "Age verification approved.",
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

async function block(req, res, next) {
  try {
    const result = blockAgeGate(req.body);

    return res.status(200).json({
      success: true,
      message: "Age verification declined.",
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
  block,
  verify
};
