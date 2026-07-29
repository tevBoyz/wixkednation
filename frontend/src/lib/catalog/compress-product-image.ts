import imageCompression from "browser-image-compression";

/** Compress on the client when the original file exceeds this size. */
export const PRODUCT_IMAGE_COMPRESS_THRESHOLD_BYTES = 1024 * 1024;

const MAX_DIMENSION = 1600;
const TARGET_MAX_MB = 1;

function buildCompressedFileName(file: File): string {
  const base = file.name.replace(/\.[^.]+$/, "") || "product-image";
  return `${base}.jpg`;
}

/**
 * Returns the file unchanged when under 1MB; otherwise compresses in-browser
 * before upload (backend still re-compresses to WebP for storage).
 */
export async function prepareProductImageForUpload(file: File): Promise<{
  file: File;
  compressed: boolean;
  originalSize: number;
  finalSize: number;
}> {
  const originalSize = file.size;

  if (originalSize <= PRODUCT_IMAGE_COMPRESS_THRESHOLD_BYTES) {
    return {
      file,
      compressed: false,
      originalSize,
      finalSize: originalSize,
    };
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: TARGET_MAX_MB,
    maxWidthOrHeight: MAX_DIMENSION,
    useWebWorker: true,
    initialQuality: 0.82,
    fileType: "image/jpeg",
  });

  const named =
    compressed.name && compressed.name !== "blob"
      ? compressed
      : new File([compressed], buildCompressedFileName(file), {
          type: compressed.type || "image/jpeg",
          lastModified: Date.now(),
        });

  return {
    file: named,
    compressed: true,
    originalSize,
    finalSize: named.size,
  };
}

export function formatImageByteSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
