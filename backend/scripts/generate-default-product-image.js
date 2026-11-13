const fs = require("fs");
const path = require("path");

const sharp = require("sharp");

const PRIMARY = "#48801F";
const SIZE = 800;
const assetsDir = path.join(__dirname, "..", "assets");
const outputPath = path.join(assetsDir, "default-product.webp");

const svg = `
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${PRIMARY}"/>
  <text
    x="50%"
    y="52%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    font-size="420"
    font-weight="700"
    fill="#ffffff"
  >G</text>
</svg>`;

async function main() {
  fs.mkdirSync(assetsDir, { recursive: true });

  await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(outputPath);

  console.log(`Default product image written to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
