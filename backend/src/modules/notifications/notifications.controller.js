const {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} = require("./notifications.service");

async function list(req, res, next) {
  try {
    const result = await listNotifications(req.user.id, req.query);

    return res.status(200).json({
      success: true,
      message: "Notifications fetched successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function markRead(req, res, next) {
  try {
    const notification = await markNotificationRead(
      req.user.id,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: {
        notification
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

async function markAllRead(req, res, next) {
  try {
    const result = await markAllNotificationsRead(req.user.id);

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  markAllRead,
  markRead
};
