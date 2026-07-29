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
        provider: process.env.SMS_PROVIDER || "afromessage",
        senderId: process.env.AFROMESSAGE_SENDER_ID || process.env.SMS_SENDER_ID || "MYSHOP"
      },
      defaultMeasurementUnit: "pcs",
      defaultCurrency: "ETB"
    }
  });
}

module.exports = seedAdminSettings;
