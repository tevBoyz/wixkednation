const crypto = require("crypto");

const prisma = require("../../src/config/prisma");

const CLIENT_ADMIN_PHONE = process.env.SEED_ADMIN_PHONE || "+14696571013";

function phoneEntryKey(entry) {
  if (typeof entry === "string") {
    return entry.trim();
  }
  if (entry && typeof entry.phone === "string") {
    return entry.phone.trim();
  }
  return "";
}

async function seedAdminSettings() {
  const existingSettings = await prisma.adminSettings.findFirst();

  if (existingSettings) {
    const phones = Array.isArray(existingSettings.adminPhoneNumbers)
      ? [...existingSettings.adminPhoneNumbers]
      : [];
    const hasClientPhone = phones.some(
      (entry) => phoneEntryKey(entry) === CLIENT_ADMIN_PHONE
    );

    if (hasClientPhone) {
      return existingSettings;
    }

    phones.push({
      id: crypto.randomUUID(),
      phone: CLIENT_ADMIN_PHONE,
      showOnBanner: true
    });

    return prisma.adminSettings.update({
      where: { id: existingSettings.id },
      data: { adminPhoneNumbers: phones }
    });
  }

  return prisma.adminSettings.create({
    data: {
      adminPhoneNumbers: [
        {
          id: crypto.randomUUID(),
          phone: CLIENT_ADMIN_PHONE,
          showOnBanner: true
        }
      ],
      smsProviderConfig: {
        provider: (() => {
          const hasTwilio =
            Boolean(process.env.TWILIO_ACCOUNT_SID) &&
            Boolean(process.env.TWILIO_AUTH_TOKEN) &&
            Boolean(process.env.TWILIO_FROM_NUMBER);
          const envProvider = (process.env.SMS_PROVIDER || "")
            .toLowerCase()
            .trim();
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
