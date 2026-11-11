import { getPublicEnv } from "@/config/env";
import { ApiError, type ApiErrorBody } from "@/lib/api/errors";
import type { ApiEnvelope } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/token-storage";
import { refreshAccessToken } from "@/lib/auth/session";
import {
  isAllowedProductImageFile,
  PRODUCT_IMAGE_ACCEPT,
} from "@/lib/api/admin/product-image-upload";
import type { PromoBanner } from "@/lib/api/types";

export { PRODUCT_IMAGE_ACCEPT, isAllowedProductImageFile };

type UploadOptions = {
  onProgress?: (percent: number) => void;
};

function parseUploadResponse(raw: string): PromoBanner {
  let json: ApiEnvelope<{ banner: PromoBanner }>;
  try {
    json = JSON.parse(raw) as ApiEnvelope<{ banner: PromoBanner }>;
  } catch {
    throw new ApiError("Unexpected upload response.", {
      status: 500,
      body: null,
    });
  }

  if (!json?.data?.banner) {
    throw new ApiError(json?.message || "Upload failed.", {
      status: 500,
      body: json as unknown as ApiErrorBody,
    });
  }

  return json.data.banner;
}

export async function uploadAdminBannerImageWithProgress(
  bannerId: string,
  file: File,
  options?: UploadOptions,
): Promise<PromoBanner> {
  const { apiUrl } = getPublicEnv();
  const url = `${apiUrl}/api/admin/banners/${bannerId}/image`;

  async function attempt(retried: boolean): Promise<PromoBanner> {
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
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(parseUploadResponse(xhr.responseText));
          } catch (error) {
            reject(error);
          }
          return;
        }

        if (xhr.status === 401 && !retried) {
          void refreshAccessToken()
            .then(() => attempt(true))
            .then(resolve)
            .catch(reject);
          return;
        }

        let message = "Upload failed.";
        try {
          const json = JSON.parse(xhr.responseText) as { message?: string };
          if (json?.message) {
            message = json.message;
          }
        } catch {
          // ignore
        }
        reject(
          new ApiError(message, {
            status: xhr.status,
            body: null,
          }),
        );
      };

      xhr.onerror = () => {
        reject(
          new ApiError("Network error during upload.", {
            status: 0,
            body: null,
          }),
        );
      };

      const form = new FormData();
      form.append("image", file);
      xhr.send(form);
    });
  }

  return attempt(false);
}
