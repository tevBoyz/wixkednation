const env = require("../../config/env");
const prisma = require("../../config/prisma");
const mockProvider = require("./providers/mock.provider");
const twilioProvider = require("./providers/twilio.provider");

const ALLOWED_PROVIDERS = new Set(["mock", "twilio"]);

async function readDbProviderName() {
  try {
    const settings = await prisma.adminSettings.findFirst({
      orderBy: {
        createdAt: "asc"
      },
      select: {
        smsProviderConfig: true
      }
    });

    const config =
      settings &&
      settings.smsProviderConfig &&
      typeof settings.smsProviderConfig === "object" &&
      !Array.isArray(settings.smsProviderConfig)
        ? settings.smsProviderConfig
        : {};

    if (typeof config.provider === "string" && config.provider.trim()) {
      return config.provider.trim().toLowerCase();
    }
  } catch (error) {
    console.warn(
      `[sms] Could not read AdminSettings provider: ${error.message}`
    );
  }

  return null;
}

async function getActiveSmsProviderName() {
  const fromDb = await readDbProviderName();

  if (fromDb && ALLOWED_PROVIDERS.has(fromDb)) {
    return fromDb;
  }

  if (fromDb) {
    console.warn(
      `[sms] Ignoring unsupported AdminSettings SMS provider "${fromDb}". ` +
        `Allowed: mock, twilio.`
    );
  }

  const fromEnv = (env.sms.provider || "").toLowerCase().trim();

  if (ALLOWED_PROVIDERS.has(fromEnv)) {
    return fromEnv;
  }

  if (fromEnv) {
    console.warn(
      `[sms] Ignoring unsupported SMS_PROVIDER="${fromEnv}". Falling back to mock.`
    );
  }

  return "mock";
}

async function resolveProvider() {
  const configuredProvider = await getActiveSmsProviderName();

  if (configuredProvider === "twilio") {
    return twilioProvider;
  }

  if (configuredProvider === "mock") {
    return mockProvider;
  }

  // Unreachable for normal resolve; never call retired providers (e.g. afromessage).
  console.warn(
    `[sms] Unknown SMS provider "${configuredProvider}". Using mock.`
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

  const provider = await resolveProvider();
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

async function getSmsStatus() {
  const activeProvider = await getActiveSmsProviderName();
  const configured = twilioProvider.isTwilioConfigured();

  if (!configured) {
    return {
      activeProvider,
      twilio: {
        configured: false,
        reachable: null,
        accountStatus: null,
        error: "Twilio credentials are not fully configured in environment."
      }
    };
  }

  const health = await twilioProvider.checkAccountHealth();

  return {
    activeProvider,
    twilio: {
      configured: health.configured,
      reachable: health.reachable,
      accountStatus: health.accountStatus,
      error: health.error
    }
  };
}

module.exports = {
  getActiveSmsProviderName,
  getSmsStatus,
  logSmsResult,
  resolveProvider,
  sendSms
};
