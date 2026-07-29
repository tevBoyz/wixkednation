const env = require("../../../config/env");

async function sendSms({ phone, message }) {
  if (!env.sms.apiKey) {
    return {
      success: false,
      provider: "afromessage",
      providerRef: null,
      error: "Missing AfroMessage API token.",
      raw: null
    };
  }

  if (!env.sms.identifierId) {
    return {
      success: false,
      provider: "afromessage",
      providerRef: null,
      error: "Missing AfroMessage identifier ID (from).",
      raw: null
    };
  }

  if (!env.sms.senderName) {
    return {
      success: false,
      provider: "afromessage",
      providerRef: null,
      error: "Missing AfroMessage sender name (sender).",
      raw: null
    };
  }

  const endpoint = `${env.sms.baseUrl.replace(/\/$/, "")}/send`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.sms.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.sms.identifierId,
        sender: env.sms.senderName,
        to: phone,
        message
      })
    });

    const rawText = await response.text();
    let raw = null;

    try {
      raw = rawText ? JSON.parse(rawText) : null;
    } catch (error) {
      raw = {
        rawText
      };
    }

    if (!response.ok) {
      return {
        success: false,
        provider: "afromessage",
        providerRef: raw?.acknowledge || raw?.response?.acknowledge || null,
        error:
          raw?.message ||
          raw?.error ||
          raw?.response?.message ||
          `AfroMessage request failed with status ${response.status}`,
        raw
      };
    }

    return {
      success: true,
      provider: "afromessage",
      providerRef:
        raw?.acknowledge ||
        raw?.response?.acknowledge ||
        raw?.message_id ||
        raw?.id ||
        null,
      error: null,
      raw
    };
  } catch (error) {
    return {
      success: false,
      provider: "afromessage",
      providerRef: null,
      error: error.message || "AfroMessage request failed.",
      raw: {
        causeCode: error.cause?.code || null,
        causeMessage: error.cause?.message || null
      }
    };
  }
}

module.exports = {
  name: "afromessage",
  sendSms
};
