const crypto = require("crypto");
const sharp = require("sharp");

const env = require("../../config/env");
const {
  getBannerImagePublicUrl,
  getBlogImagePublicUrl,
  getProductImagePublicUrl
} = require("../../config/assets");
const { supabaseAdmin } = require("../../config/supabase");

const MAX_COMPRESSED_BYTES = 3 * 1024 * 1024;
const MAX_OUTPUT_WIDTH = 1600;

function createStorageError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function compressProductImage(buffer) {
  let quality = 82;
  let compressed = await sharp(buffer)
    .rotate()
    .resize({
      width: MAX_OUTPUT_WIDTH,
      withoutEnlargement: true
    })
    .webp({ quality })
    .toBuffer();

  while (compressed.length > MAX_COMPRESSED_BYTES && quality > 40) {
    quality -= 10;
    compressed = await sharp(buffer)
      .rotate()
      .resize({
        width: MAX_OUTPUT_WIDTH,
        withoutEnlargement: true
      })
      .webp({ quality })
      .toBuffer();
  }

  if (compressed.length > MAX_COMPRESSED_BYTES) {
    throw createStorageError(
      "Compressed image exceeds the 3MB limit. Use a smaller source image.",
      400
    );
  }

  return {
    buffer: compressed,
    mimeType: "image/webp",
    extension: "webp",
    size: compressed.length
  };
}

async function uploadProductImageBuffer({
  productId,
  buffer,
  originalName
}) {
  const imageId = crypto.randomUUID();
  const compressed = await compressProductImage(buffer);
  const path = `products/${productId}/${imageId}.${compressed.extension}`;

  const { error } = await supabaseAdmin.storage
    .from(env.supabase.storageBucket)
    .upload(path, compressed.buffer, {
      contentType: compressed.mimeType,
      upsert: false
    });

  if (error) {
    throw createStorageError(
      `Failed to upload image to storage: ${error.message}`,
      502
    );
  }

  return {
    id: imageId,
    path,
    url: getProductImagePublicUrl(productId, { id: imageId, path }),
    mimeType: compressed.mimeType,
    size: compressed.size,
    originalName: originalName || null,
    createdAt: new Date().toISOString()
  };
}

async function deleteProductImageFromStorage(path) {
  if (!path || typeof path !== "string") {
    throw createStorageError("Storage path is required to delete an image.", 400);
  }

  const { error } = await supabaseAdmin.storage
    .from(env.supabase.storageBucket)
    .remove([path]);

  if (error) {
    throw createStorageError(
      `Failed to delete image from storage: ${error.message}`,
      502
    );
  }

  return true;
}

async function downloadProductImageFromStorage(storagePath) {
  if (!storagePath || typeof storagePath !== "string") {
    throw createStorageError("Storage path is required.", 400);
  }

  const { data, error } = await supabaseAdmin.storage
    .from(env.supabase.storageBucket)
    .download(storagePath);

  if (error || !data) {
    throw createStorageError("Product image not found.", 404);
  }

  const buffer = Buffer.from(await data.arrayBuffer());

  return {
    buffer,
    mimeType: data.type || "image/webp"
  };
}

async function uploadBannerImageBuffer({ bannerId, buffer, originalName }) {
  const imageId = crypto.randomUUID();
  const compressed = await compressProductImage(buffer);
  const path = `banners/${bannerId}/${imageId}.${compressed.extension}`;

  const { error } = await supabaseAdmin.storage
    .from(env.supabase.storageBucket)
    .upload(path, compressed.buffer, {
      contentType: compressed.mimeType,
      upsert: false
    });

  if (error) {
    throw createStorageError(
      `Failed to upload image to storage: ${error.message}`,
      502
    );
  }

  return {
    id: imageId,
    path,
    url: getBannerImagePublicUrl(bannerId, path),
    mimeType: compressed.mimeType,
    size: compressed.size,
    originalName: originalName || null,
    createdAt: new Date().toISOString()
  };
}

async function uploadBlogImageBuffer({
  postId,
  buffer,
  originalName,
  kind = "media",
  mediaId
}) {
  const imageId = mediaId || crypto.randomUUID();
  const compressed = await compressProductImage(buffer);
  const folder = kind === "cover" ? "cover" : "media";
  const path = `blog/${postId}/${folder}/${imageId}.${compressed.extension}`;

  const { error } = await supabaseAdmin.storage
    .from(env.supabase.storageBucket)
    .upload(path, compressed.buffer, {
      contentType: compressed.mimeType,
      upsert: false
    });

  if (error) {
    throw createStorageError(
      `Failed to upload image to storage: ${error.message}`,
      502
    );
  }

  return {
    id: imageId,
    path,
    url: getBlogImagePublicUrl(postId, path),
    mimeType: compressed.mimeType,
    size: compressed.size,
    originalName: originalName || null,
    createdAt: new Date().toISOString()
  };
}

module.exports = {
  MAX_COMPRESSED_BYTES,
  compressProductImage,
  deleteProductImageFromStorage,
  downloadProductImageFromStorage,
  uploadBannerImageBuffer,
  uploadBlogImageBuffer,
  uploadProductImageBuffer
};
