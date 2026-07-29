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
        adminPhoneNumbers: ["+251911000000"],
        smsProviderConfig: {
          provider: "afromessage",
          senderId: "MYSHOP"
        },
        defaultMeasurementUnit: "pcs"
      }
    });

    summary.created.push("adminSettings");
  } else {
    summary.skipped.push("adminSettings");
  }

  return summary;
}

module.exports = seedTestData;
