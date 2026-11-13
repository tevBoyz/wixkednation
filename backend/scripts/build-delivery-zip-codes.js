/**
 * Writes the Ohio delivery ZIP range used by backend and frontend.
 * Ohio USPS ZIP codes run from 43001 through 45999.
 * Run: node backend/scripts/build-delivery-zip-codes.js
 */
const fs = require("fs");
const path = require("path");

const payload = {
  version: 2,
  description:
    "Allowed delivery ZIP codes for the state of Ohio (43001–45999).",
  updatedAt: new Date().toISOString().slice(0, 10),
  zipMin: "43001",
  zipMax: "45999",
};

const repoRoot = path.resolve(__dirname, "..", "..");
const targets = [
  path.join(repoRoot, "backend", "src", "data", "delivery-zip-codes.json"),
  path.join(repoRoot, "frontend", "src", "data", "delivery-zip-codes.json"),
];

for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote Ohio ZIP range to ${target}`);
}
