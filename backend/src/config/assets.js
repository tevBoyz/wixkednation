const path = require("path");

const env = require("./env");

const DEFAULT_PRODUCT_IMAGE_FILENAME = "default-product.webp";

const assetsDir = path.join(__dirname, "..", "..", "assets");

function getDefaultProductImagePath() {
  return path.join(assetsDir, DEFAULT_PRODUCT_IMAGE_FILENAME);
}

function getDefaultProductImageUrl() {
  const base = String(env.backendUrl || "").replace(/\/$/, "");
  return `${base}/api/assets/${DEFAULT_PRODUCT_IMAGE_FILENAME}`;
}

/** Public URL for a stored product image (proxied through this API). */
function getProductImagePublicUrl(productId, image) {
  const base = String(env.backendUrl || "").replace(/\/$/, "");

  if (!productId || !image) {
    return null;
  }

  if (image.path) {
    const filename = path.basename(image.path);
    return `${base}/api/assets/product-images/${productId}/${filename}`;
  }

  if (image.id) {
    return `${base}/api/assets/product-images/${productId}/${image.id}.webp`;
  }

  return image.url || null;
}

/** Public URL for a stored promo banner image (proxied through this API). */
function getBannerImagePublicUrl(bannerId, imagePath) {
  const base = String(env.backendUrl || "").replace(/\/$/, "");

  if (!bannerId || !imagePath) {
    return null;
  }

  const filename = path.basename(imagePath);
  return `${base}/api/assets/banner-images/${bannerId}/${filename}`;
}

/** Public URL for a stored blog cover/inline image (proxied through this API). */
function getBlogImagePublicUrl(postId, imagePath) {
  const base = String(env.backendUrl || "").replace(/\/$/, "");

  if (!postId || !imagePath) {
    return null;
  }

  const normalized = String(imagePath).replace(/\\/g, "/");
  const parts = normalized.split("/");
  // Expected: blog/{postId}/cover|media/{file}
  if (parts.length >= 4 && parts[0] === "blog") {
    const kind = parts[2];
    const filename = parts[parts.length - 1];
    return `${base}/api/assets/blog-images/${postId}/${kind}/${filename}`;
  }

  const filename = path.basename(imagePath);
  return `${base}/api/assets/blog-images/${postId}/media/${filename}`;
}

module.exports = {
  assetsDir,
  DEFAULT_PRODUCT_IMAGE_FILENAME,
  getDefaultProductImagePath,
  getDefaultProductImageUrl,
  getProductImagePublicUrl,
  getBannerImagePublicUrl,
  getBlogImagePublicUrl
};
