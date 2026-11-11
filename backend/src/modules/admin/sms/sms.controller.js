const { sendAdminTestSms, listSmsLogs } = require("./sms.service");

async function getLogs(req, res, next) {
  try {
    const result = await listSmsLogs(req.query);

    return res.status(200).json({
      success: true,
      message: "SMS logs fetched successfully.",
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

async function sendTestSms(req, res, next) {
  try {
    const result = await sendAdminTestSms(req.body || {}, req.user?.id || null);

    return res.status(200).json({
      success: true,
      message: "Test SMS sent successfully.",
      data: result
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        ...(error.details ? { data: error.details } : {})
      });
    }

    next(error);
  }
}

module.exports = {
  getLogs,
  sendTestSms
};
