const { spawnSync } = require("child_process");

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log("[docker] Applying Prisma migrations...");
run("npx", ["prisma", "migrate", "deploy"]);

console.log(`[docker] Starting API on port ${process.env.PORT || 5000}...`);
require("./src/server.js");
