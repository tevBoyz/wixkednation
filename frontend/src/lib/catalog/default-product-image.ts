import { getPublicEnv } from "@/config/env";

const DEFAULT_PRODUCT_IMAGE_PATH = "/api/assets/default-product.webp";

/** Public default product cover served by the backend API. */
export function getDefaultProductImageUrl(): string {
  const { apiUrl } = getPublicEnv();
  return `${apiUrl}${DEFAULT_PRODUCT_IMAGE_PATH}`;
}
