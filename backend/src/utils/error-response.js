function isPrismaError(err) {
  if (!err || typeof err !== "object") {
    return false;
  }

  if (typeof err.name === "string" && err.name.startsWith("PrismaClient")) {
    return true;
  }

  return typeof err.code === "string" && err.code.startsWith("P");
}

function isTechnicalMessage(message) {
  if (typeof message !== "string" || !message.trim()) {
    return true;
  }

  if (message.length > 200) {
    return true;
  }

  const patterns = [
    /prisma/i,
    /Invalid\s+`/,
    /invocation in/i,
    /Unknown argument/i,
    /\.(?:js|ts|mjs|cjs):\d+/i,
    /\\Users\\/,
    /\/src\//,
    /ECONNREFUSED/,
    /Unexpected token/,
    /at\s+\w+\s+\(/,
    /SyntaxError/,
    /TypeError:/
  ];

  return patterns.some((pattern) => pattern.test(message));
}

function getHttpStatus(err) {
  if (err?.statusCode) {
    return err.statusCode;
  }

  if (err?.code === "P2025") {
    return 404;
  }

  if (err?.code === "P2002") {
    return 409;
  }

  return 500;
}

function getPublicErrorMessage(
  err,
  fallback = "Something went wrong. Please try again."
) {
  const status = getHttpStatus(err);

  if (status >= 400 && status < 500 && err?.message && !isTechnicalMessage(err.message)) {
    return err.message;
  }

  if (isPrismaError(err)) {
    if (err.code === "P2002") {
      return "That value is already in use.";
    }

    if (err.code === "P2025") {
      return "The requested item was not found.";
    }

    return fallback;
  }

  if (err?.message && !isTechnicalMessage(err.message) && status < 500) {
    return err.message;
  }

  return fallback;
}

module.exports = {
  getHttpStatus,
  getPublicErrorMessage,
  isPrismaError,
  isTechnicalMessage
};
