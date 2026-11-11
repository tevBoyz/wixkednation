/**
 * Lightweight settings scaffold only.
 * Catalog products come from `npm run catalog:seed` (client catalog),
 * not from vegetables/fresh-tomato test rows.
 */
const prisma = require("../../src/config/prisma");

async function seedTestData() {
  const summary = {
    note: "Test seed no longer creates vegetable/fresh-tomato catalog rows.",
    created: [],
    skipped: []
  };

  const settings = await prisma.adminSettings.findFirst();

  if (!settings) {
    await prisma.adminSettings.create({
      data: {
        adminPhoneNumbers: ["+14696571013", "+251911000000"],
        smsProviderConfig: {
          provider: "mock",
          senderId: "MYSHOP"
        },
        defaultMeasurementUnit: "oz",
        defaultCurrency: "USD"
      }
    });

    summary.created.push("adminSettings");
  } else {
    summary.skipped.push("adminSettings");
  }

  return summary;
}

module.exports = seedTestData;
