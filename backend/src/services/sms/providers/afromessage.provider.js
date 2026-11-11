/**
 * RETIRED — AfroMessage is no longer wired into sms.service.
 * Kept in-repo for reference only. Do not re-enable without an explicit product decision.
 */

async function sendSms() {
  return {
    success: false,
    provider: "afromessage",
    providerRef: null,
    error:
      "AfroMessage provider is disabled. Use mock or twilio via AdminSettings / SMS_PROVIDER.",
    raw: null
  };
}

module.exports = {
  name: "afromessage",
  sendSms
};
