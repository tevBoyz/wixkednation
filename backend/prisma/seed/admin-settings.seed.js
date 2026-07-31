const crypto = require("crypto");

const prisma = require("../../src/config/prisma");

async function seedAdminSettings() {
  const existingSettings = await prisma.adminSettings.findFirst();

  if (existingSettings) {
    return existingSettings;
  }

  return prisma.adminSettings.create({
    data: {
      adminPhoneNumbers: [
        {
          id: crypto.randomUUID(),
          phone: process.env.SEED_ADMIN_PHONE || "+251911000000"
        }
      ],
      smsProviderConfig: {
        provider: (() => {
          const hasTwilio =
            Boolean(process.env.TWILIO_ACCOUNT_SID) &&
            Boolean(process.env.TWILIO_AUTH_TOKEN) &&
            Boolean(process.env.TWILIO_FROM_NUMBER);
          const envProvider = (process.env.SMS_PROVIDER || "").toLowerCase().trim();
          if (envProvider === "mock" || envProvider === "twilio") {
            return envProvider;
          }
          return hasTwilio ? "twilio" : "mock";
        })(),
        senderId: process.env.TWILIO_FROM_NUMBER || ""
      },
      defaultMeasurementUnit: "pcs",
      defaultCurrency: "ETB"
    }
  });
}

module.exports = seedAdminSettings;
