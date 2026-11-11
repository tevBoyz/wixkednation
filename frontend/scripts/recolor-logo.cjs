const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const TARGET = { r: 0x14, g: 0x85, b: 0x47 }; // #148547

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return { h: h * 360, s, l };
}

function hslToRgb(h, s, l) {
  h /= 360;
  let r;
  let g;
  let b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(Math.min(255, Math.max(0, r * 255))),
    g: Math.round(Math.min(255, Math.max(0, g * 255))),
    b: Math.round(Math.min(255, Math.max(0, b * 255))),
  };
}

const targetHsl = rgbToHsl(TARGET.r, TARGET.g, TARGET.b);

function isGreenish(r, g, b, a) {
  if (a < 12) return false;
  if (r > 180 && g > 180 && b > 160 && Math.abs(r - g) < 40) return false;
  const hsl = rgbToHsl(r, g, b);
  const greenHue = hsl.h >= 70 && hsl.h <= 170;
  const greenChannel = g > r * 0.9 && g > b * 0.85 && g > 40;
  return (greenHue && hsl.s > 0.12) || (greenChannel && g > r && g > b);
}

function recolorGreen(r, g, b, a) {
  if (!isGreenish(r, g, b, a)) return [r, g, b, a];
  const { l } = rgbToHsl(r, g, b);
  // Lock hue to brand; keep relative shading around brand midtone.
  const brandL = targetHsl.l; // ~0.30 for #148547
  const brandS = Math.min(0.78, targetHsl.s + 0.05);
  // Remap original lightness (logo is often bright/neon) into a
  // narrower band centered on brand green.
  const remappedL = brandL + (l - 0.5) * 0.65;
  const newL = Math.min(0.58, Math.max(0.12, remappedL));
  const newS = brandS * (0.85 + (1 - Math.abs(newL - brandL) * 1.2) * 0.15);
  const rgb = hslToRgb(targetHsl.h, Math.min(0.8, Math.max(0.4, newS)), newL);
  return [rgb.r, rgb.g, rgb.b, a];
}

async function recolorBuffer(buf) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += info.channels) {
    const [nr, ng, nb, na] = recolorGreen(
      data[i],
      data[i + 1],
      data[i + 2],
      data[i + 3],
    );
    data[i] = nr;
    data[i + 1] = ng;
    data[i + 2] = nb;
    data[i + 3] = na;
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer();
}

async function removeNearBlack(input, thresh = 40) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i] <= thresh && data[i + 1] <= thresh && data[i + 2] <= thresh) {
      data[i + 3] = 0;
    }
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer();
}

async function contentBbox(buf) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;
  let found = false;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      if (data[i + 3] > 16) {
        found = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return found
    ? { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
    : { left: 0, top: 0, width: info.width, height: info.height };
}

async function main() {
  const brand = path.join(process.cwd(), "public", "brand");
  const original =
    "C:/Users/Victus/.cursor/projects/c-Users-Victus-Documents-D-ww/assets/c__Users_Victus_AppData_Roaming_Cursor_User_workspaceStorage_0f07f97aa78db3a8abf25c53597c076d_images_image-06f68d35-cd2f-4887-94b1-8758f519a249.png";

  let buf = await removeNearBlack(original);
  buf = await sharp(buf)
    .extract(await contentBbox(buf))
    .resize({ width: 1200, withoutEnlargement: true })
    .png()
    .toBuffer();
  buf = await recolorBuffer(buf);

  const fullPath = path.join(brand, "gasnation-logo-full.png");
  await sharp(buf).toFile(fullPath);
  await sharp(buf).toFile(path.join(brand, "gasnation-logo.png"));
  console.log("wrote full logo");

  const { data, info } = await sharp(fullPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const densities = [];
  for (let y = 0; y < info.height; y++) {
    let count = 0;
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] > 20) count++;
    }
    densities.push(count / info.width);
  }
  let started = false;
  let gapStart = -1;
  for (let i = 0; i < densities.length; i++) {
    if (densities[i] > 0.02) started = true;
    if (started && densities[i] < 0.008) {
      let gapLen = 0;
      while (i + gapLen < densities.length && densities[i + gapLen] < 0.012) {
        gapLen++;
      }
      if (gapLen >= 8) {
        gapStart = i;
        break;
      }
    }
  }
  const markEnd = gapStart > 40 ? gapStart : Math.round(info.height * 0.52);
  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < markEnd; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] > 20) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  let mark = await sharp(fullPath)
    .extract({
      left: minX,
      top: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    })
    .png()
    .toBuffer();
  const mm = await sharp(mark).metadata();
  const pad = Math.round(Math.max(mm.width, mm.height) * 0.18);
  const canvas = Math.max(mm.width, mm.height) + pad * 2;
  const markSq = await sharp(mark)
    .extend({
      top: Math.floor((canvas - mm.height) / 2),
      bottom: Math.ceil((canvas - mm.height) / 2),
      left: Math.floor((canvas - mm.width) / 2),
      right: Math.ceil((canvas - mm.width) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const markV3 = path.join(brand, "gasnation-mark-v3.png");
  await sharp(markSq).resize(512, 512).png().toFile(markV3);
  await sharp(markSq).resize(64, 64).png().toFile(path.join(brand, "gasnation-mark-64.png"));
  await sharp(markSq).resize(32, 32).png().toFile(path.join(brand, "gasnation-mark-32.png"));
  await sharp(markSq).resize(192, 192).png().toFile(path.join(brand, "icon-192.png"));
  await sharp(markSq).resize(180, 180).png().toFile(path.join(brand, "apple-touch-icon.png"));
  await sharp(markSq).resize(512, 512).png().toFile(path.join(process.cwd(), "src", "app", "icon.png"));
  await sharp(markV3).toFile(path.join(brand, "gasnation-mark.png"));

  const ogLogo = await sharp(fullPath)
    .resize({ width: 840, height: 500, fit: "inside" })
    .png()
    .toBuffer();
  const om = await sharp(ogLogo).metadata();
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite([
      {
        input: ogLogo,
        left: Math.round((1200 - om.width) / 2),
        top: Math.round((630 - om.height) / 2),
      },
    ])
    .png()
    .toFile(path.join(brand, "gasnation-og.png"));

  console.log("done - logo greens remapped to #148547");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
