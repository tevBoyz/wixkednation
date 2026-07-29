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
    provider: process.env.SMS_PROVIDER,
    apiKey: getFirstDefinedEnvValue(["AFROMESSAGE_API_TOKEN", "AFRO_MESSAGE_API_KEY", "SMS_API_KEY"]),
    // AfroMessage "from" = identifier ID from the dashboard identifiers list.
    identifierId: getFirstDefinedEnvValue([
      "AFROMESSAGE_IDENTIFIER_ID",
      "AFROMESSAGE_SENDER_ID",
      "SMS_SENDER_ID"
    ]),
    // AfroMessage "sender" = verified sender/display name.
    senderName: getFirstDefinedEnvValue([
      "AFROMESSAGE_SENDER_NAME",
      "AFROMESSAGE_SENDER_NAMES",
      "SMS_SENDER_NAME"
    ]),
    baseUrl: process.env.AFROMESSAGE_BASE_URL || "https://api.afromessage.com/api"
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL
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