const env = require("../../config/env");
const prisma = require("../../config/prisma");
const afromessageProvider = require("./providers/afromessage.provider");
const mockProvider = require("./providers/mock.provider");

function resolveProvider() {
  const configuredProvider = (env.sms.provider || "").toLowerCase().trim();

  if (configuredProvider === "mock") {
    return mockProvider;
  }

  if (configuredProvider === "afromessage") {
    if (!env.sms.apiKey || !env.sms.identifierId || !env.sms.senderName) {
      console.warn(
        "[sms] AfroMessage credentials incomplete. Falling back to mock provider."
      );
      return mockProvider;
    }

    return afromessageProvider;
  }

  if (!configuredProvider) {
    if (env.sms.apiKey && env.sms.identifierId && env.sms.senderName) {
      return afromessageProvider;
    }

    console.warn(
      "[sms] No SMS provider configured. Falling back to mock provider."
    );
    return mockProvider;
  }

  console.warn(
    `[sms] Unknown SMS provider "${configuredProvider}". Falling back to mock provider.`
  );
  return mockProvider;
}

function redactMessageForLog(message, purpose) {
  if (purpose === "otp" && typeof message === "string") {
    return message.replace(/\b\d{4,8}\b/g, "******");
  }

  return message;
}

async function logSmsResult({
  phone,
  message,
  result,
  purpose = "general",
  metadata = {}
}) {
  try {
    return await prisma.smsLog.create({
      data: {
        phone,
        message: redactMessageForLog(message, purpose),
        provider: result.provider || "unknown",
        providerRef: result.providerRef || null,
        status: result.success ? "sent" : "failed",
        errorMessage: result.error || null,
        metadata: {
          purpose,
          ...(result.raw && typeof result.raw === "object" ? { providerRaw: result.raw } : {}),
          ...(metadata && typeof metadata === "object" ? metadata : {})
        }
      }
    });
  } catch (error) {
    console.error("[sms] Failed to write sms_logs row:", error.message);
    return null;
  }
}

async function sendSms({
  phone,
  message,
  log = true,
  purpose = "general",
  metadata = {}
} = {}) {
  if (!phone) {
    throw new Error("Phone number is required to send SMS.");
  }

  if (!message) {
    throw new Error("Message is required to send SMS.");
  }

  const provider = resolveProvider();
  let result;

  try {
    result = await provider.sendSms({ phone, message });
  } catch (error) {
    result = {
      success: false,
      provider: provider.name || "unknown",
      providerRef: null,
      error: error.message || "SMS provider threw an unexpected error.",
      raw: null
    };
  }

  let smsLog = null;

  if (log) {
    smsLog = await logSmsResult({
      phone,
      message,
      result,
      purpose,
      metadata
    });
  }

  return {
    ...result,
    purpose,
    smsLogId: smsLog ? smsLog.id : null
  };
}

module.exports = {
  logSmsResult,
  resolveProvider,
  sendSms
};
