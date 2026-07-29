/**
 * Seed client catalog from baseDocs/images/catalog-seed-manifest.json
 * and upload images to Supabase storage.
 *
 * Usage: node scripts/run-client-catalog-seed.js
 */
require("dotenv").config();

const prisma = require("../src/config/prisma");
const seedClientCatalog = require("../prisma/seed/client-catalog.seed");

seedClientCatalog()
  .then((summary) => {
    console.log("Client catalog seed completed.", summary);
  })
  .catch((error) => {
    console.error("Client catalog seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
