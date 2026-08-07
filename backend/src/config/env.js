const dotenv = require("dotenv");

dotenv.config();

function getFirstDefinedEnvValue(keys) {
  for (const key of keys) {
    const value = process.env[key];

    if (value) {
      return value;
    }
  }

  return undefined;
}

const requiredEnvVars = [
  "PORT",
  "NODE_ENV",
  "FRONTEND_URL",
  "BACKEND_URL",
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_STORAGE_BUCKET"
];

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.error("Missing required environment variables:");
  missingEnvVars.forEach((key) => console.error(`- ${key}`));

  process.exit(1);
}

function isLoopbackUrl(value) {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^\[|\]$/g, "");

    return ["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(hostname);
  } catch {
    return false;
  }
}

// BACKEND_URL is baked into the asset URLs the API hands to browsers, so a
// loopback value in production renders every product image unreachable.
if (process.env.NODE_ENV === "production" && isLoopbackUrl(process.env.BACKEND_URL)) {
  console.warn(
    `BACKEND_URL is set to "${process.env.BACKEND_URL}", which browsers cannot reach. ` +
      "Set it to the public API origin (for example https://api.example.com) so image URLs resolve."
  );
}

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  frontendUrl: process.env.FRONTEND_URL,
  corsOrigins: (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  backendUrl: process.env.BACKEND_URL,

  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET
  },

  jwt: {
    accessSecret: getFirstDefinedEnvValue(["JWT_ACCESS_SECRET", "JWT_SECRET"]),
    refreshSecret: getFirstDefinedEnvValue(["JWT_REFRESH_SECRET", "SESSION_SECRET"]),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d"
  },

  cookieSecret: getFirstDefinedEnvValue(["COOKIE_SECRET", "SESSION_SECRET"]),

  sms: {
    // Fallback only when AdminSettings has no provider. Allowed: mock | twilio.
    provider: process.env.SMS_PROVIDER,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioFromNumber: process.env.TWILIO_FROM_NUMBER
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL
  },

  email: {
    provider: (process.env.EMAIL_PROVIDER || "mock").toLowerCase().trim(),
    smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
    smtpPort: Number(process.env.SMTP_PORT || 465),
    smtpSecure:
      process.env.SMTP_SECURE === undefined
        ? true
        : String(process.env.SMTP_SECURE).toLowerCase() !== "false",
    smtpUser: process.env.SMTP_USER || "",
    // Google Workspace App Password for noreply@ (spaces optional).
    smtpPass: (process.env.SMTP_PASS || "").replace(/\s+/g, ""),
    from:
      process.env.EMAIL_FROM ||
      "GasNation <noreply@gasnationweed.com>",
    logoUrl: process.env.EMAIL_LOGO_URL || "",
    // Optional override for links in emails (defaults to FRONTEND_URL, never localhost)
    appUrl: process.env.EMAIL_APP_URL || "",
    adminOrderNotificationEmails: (
      process.env.ADMIN_ORDER_NOTIFICATION_EMAILS ||
      "orders@gasnationweed.com"
    )
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
    systemAlertEmails: (
      process.env.SYSTEM_ALERT_EMAILS || "info@gasnationweed.com"
    )
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
    googleReviewUrl: (process.env.GOOGLE_REVIEW_URL || "").trim()
  },

  otp: {
    expiresMinutes: Number(process.env.OTP_EXPIRES_MINUTES || 5),
    length: Number(process.env.OTP_LENGTH || 6),
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
    resendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60)
  },

  internalApiKey: process.env.INTERNAL_API_KEY,

  // Legacy aliases kept temporarily to avoid breaking existing code during auth migration.
  jwtSecret: getFirstDefinedEnvValue(["JWT_ACCESS_SECRET", "JWT_SECRET"]),
  sessionSecret: getFirstDefinedEnvValue(["COOKIE_SECRET", "SESSION_SECRET"])
};

module.exports = env;