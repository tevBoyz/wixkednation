const env = require("../../config/env");
const { isEmailOtpEnabled, isSmsOtpEnabled } = require("./otp.service");

function isGoogleConfigured() {
  return Boolean(
    env.google.clientId &&
      env.google.clientSecret &&
      env.google.callbackUrl
  );
}

async function getAuthConfig() {
  const reviewUrl = (env.email.googleReviewUrl || "").trim();
  return {
    googleEnabled: isGoogleConfigured(),
    emailOtpEnabled: isEmailOtpEnabled(),
    smsOtpEnabled: await isSmsOtpEnabled(),
    googleReviewUrl:
      reviewUrl && /^https?:\/\//i.test(reviewUrl) ? reviewUrl : null
  };
}

module.exports = {
  getAuthConfig,
  isGoogleConfigured
};
