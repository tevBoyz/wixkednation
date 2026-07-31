const env = require("../../../config/env");

function getTwilioBasicAuthHeader() {
  const sid = env.sms.twilioAccountSid;
  const token = env.sms.twilioAuthToken;

  if (!sid || !token) {
    return null;
  }

  return `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
}

function isTwilioConfigured() {
  return Boolean(
    env.sms.twilioAccountSid &&
      env.sms.twilioAuthToken &&
      env.sms.twilioFromNumber
  );
}

async function sendSms({ phone, message }) {
  if (!env.sms.twilioAccountSid) {
    return {
      success: false,
      provider: "twilio",
      providerRef: null,
      error: "Missing TWILIO_ACCOUNT_SID.",
      raw: null
    };
  }

  if (!env.sms.twilioAuthToken) {
    return {
      success: false,
      provider: "twilio",
      providerRef: null,
      error: "Missing TWILIO_AUTH_TOKEN.",
      raw: null
    };
  }

  if (!env.sms.twilioFromNumber) {
    return {
      success: false,
      provider: "twilio",
      providerRef: null,
      error: "Missing TWILIO_FROM_NUMBER.",
      raw: null
    };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${env.sms.twilioAccountSid}/Messages.json`;
  const body = new URLSearchParams({
    To: phone,
    From: env.sms.twilioFromNumber,
    Body: message
  });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: getTwilioBasicAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });

    const rawText = await response.text();
    let raw = null;

    try {
      raw = rawText ? JSON.parse(rawText) : null;
    } catch {
      raw = { rawText };
    }

    if (!response.ok) {
      return {
        success: false,
        provider: "twilio",
        providerRef: raw?.sid || null,
        error:
          raw?.message ||
          raw?.error_message ||
          `Twilio request failed with status ${response.status}`,
        raw
      };
    }

    return {
      success: true,
      provider: "twilio",
      providerRef: raw?.sid || null,
      error: null,
      raw
    };
  } catch (error) {
    return {
      success: false,
      provider: "twilio",
      providerRef: null,
      error: error.message || "Twilio request failed.",
      raw: null
    };
  }
}

async function checkAccountHealth({ timeoutMs = 5000 } = {}) {
  if (!env.sms.twilioAccountSid || !env.sms.twilioAuthToken) {
    return {
      configured: isTwilioConfigured(),
      reachable: false,
      accountStatus: null,
      error: "Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN."
    };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${env.sms.twilioAccountSid}.json`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: getTwilioBasicAuthHeader()
      },
      signal: controller.signal
    });

    const rawText = await response.text();
    let raw = null;

    try {
      raw = rawText ? JSON.parse(rawText) : null;
    } catch {
      raw = null;
    }

    if (!response.ok) {
      return {
        configured: isTwilioConfigured(),
        reachable: false,
        accountStatus: null,
        error:
          raw?.message ||
          raw?.error_message ||
          `Twilio account check failed with status ${response.status}`
      };
    }

    return {
      configured: isTwilioConfigured(),
      reachable: true,
      accountStatus: typeof raw?.status === "string" ? raw.status : null,
      error: null
    };
  } catch (error) {
    const aborted = error && error.name === "AbortError";
    return {
      configured: isTwilioConfigured(),
      reachable: false,
      accountStatus: null,
      error: aborted
        ? "Twilio account check timed out."
        : error.message || "Twilio account check failed."
    };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  name: "twilio",
  sendSms,
  isTwilioConfigured,
  checkAccountHealth
};
