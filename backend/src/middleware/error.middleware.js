const {
  getHttpStatus,
  getPublicErrorMessage
} = require("../utils/error-response");

function errorHandler(err, req, res, next) {
  console.error("Error:", err);

  const statusCode = getHttpStatus(err);
  const message = getPublicErrorMessage(err);

  const body = {
    success: false,
    message
  };

  if (
    err?.code &&
    typeof err.code === "string" &&
    !err.code.startsWith("P") &&
    statusCode >= 400 &&
    statusCode < 500
  ) {
    body.code = err.code;
  }

  if (err?.blockedUntil) {
    body.blockedUntil = err.blockedUntil;
  }

  res.status(statusCode).json(body);
}

module.exports = errorHandler;
