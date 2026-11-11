const { getCurrentUser, updateCurrentUser } = require("./users.service");

async function getMe(req, res, next) {
  try {
    const user = await getCurrentUser(req.user.id);

    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully.",
      data: {
        user
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

async function updateMe(req, res, next) {
  try {
    const user = await updateCurrentUser(req.user.id, req.body || {});

    return res.status(200).json({
      success: true,
      message: "User profile updated successfully.",
      data: {
        user
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
  getMe,
  updateMe
};
