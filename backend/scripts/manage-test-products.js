require("dotenv").config();

const prisma = require("../src/config/prisma");
const {
  seedTestProducts,
  listTestProducts,
  cleanTestProducts,
  restoreTestProducts
} = require("../prisma/seed/test-products.seed");

const COMMANDS = new Set(["seed", "list", "clean", "restore"]);

function printUsage() {
  console.log(`
Manage QA test catalog (slug prefix: qa-)

Usage:
  node scripts/manage-test-products.js seed
  node scripts/manage-test-products.js list
  node scripts/manage-test-products.js clean [--hard]
  node scripts/manage-test-products.js restore

npm shortcuts:
  npm run seed:test-products
  npm run seed:test-products:list
  npm run seed:test-products:clean
  npm run seed:test-products:restore
`);
}

async function main() {
  const command = process.argv[2];
  const hard = process.argv.includes("--hard");

  if (!command || !COMMANDS.has(command)) {
    printUsage();
    process.exit(command ? 1 : 0);
  }

  if (command === "seed") {
    const result = await seedTestProducts();
    console.log("QA test catalog seeded.");
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "list") {
    const result = await listTestProducts();
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "clean") {
    const result = await cleanTestProducts({ hard });
    console.log(`QA test catalog cleaned (${result.mode}).`);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "restore") {
    const result = await restoreTestProducts();
    console.log("QA test catalog restored and re-seeded.");
    console.log(JSON.stringify(result, null, 2));
  }
}

main()
  .catch((error) => {
    console.error("manage-test-products failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
