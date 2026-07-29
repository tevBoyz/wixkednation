import { getPublicEnv } from "@/config/env";
import { ApiError, normalizeApiError, type ApiErrorBody } from "@/lib/api/errors";
import type { ApiEnvelope } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/token-storage";
import { refreshAccessToken } from "@/lib/auth/session";
import type { Product } from "@/lib/api/types";

export const PRODUCT_IMAGE_ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp";

export const PRODUCT_IMAGE_MAX_COUNT = 4;

export function isAllowedProductImageFile(file: File): boolean {
  const type = file.type.toLowerCase();
  if (
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/png" ||
    type === "image/webp"
  ) {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return (
    extension === "jpg" ||
    extension === "jpeg" ||
    extension === "png" ||
    extension === "webp"
  );
}

type UploadOptions = {
  onProgress?: (percent: number) => void;
};

function parseUploadResponse(raw: string): Product {
  let json: ApiEnvelope<{ product: Product }>;
  try {
    json = JSON.parse(raw) as ApiEnvelope<{ product: Product }>;
  } catch {
    throw new ApiError("Unexpected upload response.", { status: 500, body: null });
  }

  if (!json?.data?.product) {
    throw new ApiError(json?.message || "Upload failed.", {
      status: 500,
      body: json as unknown as ApiErrorBody,
    });
  }

  return json.data.product;
}

export async function uploadAdminProductImageWithProgress(
  productId: string,
  file: File,
  options?: UploadOptions,
): Promise<Product> {
  const { apiUrl } = getPublicEnv();
  const url = `${apiUrl}/api/admin/products/${productId}/images`;

  async function attempt(retried: boolean): Promise<Product> {
    const token = getAccessToken();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.responseType = "text";

      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable || !options?.onProgress) {
          return;
        }
        const percent = Math.round((event.loaded / event.total) * 100);
        options.onProgress(Math.min(100, percent));
      };

      xhr.onload = () => {
        void (async () => {
          if (xhr.status === 401 && !retried) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
              try {
                resolve(await attempt(true));
              } catch (error) {
                reject(error);
              }
              return;
            }
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(parseUploadResponse(xhr.responseText));
            } catch (error) {
              reject(error);
            }
            return;
          }

          try {
            reject(
              await normalizeApiError(
                new Response(xhr.responseText, {
                  status: xhr.status,
                  headers: { "Content-Type": "application/json" },
                }),
              ),
            );
          } catch {
            reject(
              new ApiError("Image upload failed.", {
                status: xhr.status,
                body: null,
              }),
            );
          }
        })();
      };

      xhr.onerror = () => {
        reject(
          new ApiError("Unable to reach the server during upload.", {
            status: 0,
            body: null,
          }),
        );
      };

      xhr.onabort = () => {
        reject(
          new ApiError("Upload cancelled.", { status: 0, body: null }),
        );
      };

      const form = new FormData();
      form.append("image", file);
      xhr.send(form);
    });
  }

  return attempt(false);
}
