require("dotenv").config();

const prisma = require("../src/config/prisma");
const seedAdminSettings = require("./seed/admin-settings.seed");
const seedTestData = require("./seed/test.seed");
const seedUsers = require("./seed/users.seed");

async function main() {
  console.log("Starting database seed...");

  const adminSettings = await seedAdminSettings();
  const users = await seedUsers();
  const testData = await seedTestData();

  console.log("Seed completed successfully.");
  console.log({
    adminSettings: {
      id: adminSettings.id,
      allowCustomerCancellation: adminSettings.allowCustomerCancellation,
      defaultMeasurementUnit: adminSettings.defaultMeasurementUnit
    },
    admin: {
      id: users.adminUser.id,
      supabaseUserId: users.adminUser.supabaseUserId,
      role: users.adminUser.role,
      phone: users.adminUser.phone,
      email: users.adminUser.email
    },
    customer: {
      id: users.customerUser.id,
      supabaseUserId: users.customerUser.supabaseUserId,
      role: users.customerUser.role,
      phone: users.customerUser.phone,
      email: users.customerUser.email
    },
    testData
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });