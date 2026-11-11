import { getPublicEnv } from "@/config/env";
import { ApiError, type ApiErrorBody } from "@/lib/api/errors";
import type { ApiEnvelope } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/token-storage";
import { refreshAccessToken } from "@/lib/auth/session";
import {
  isAllowedProductImageFile,
  PRODUCT_IMAGE_ACCEPT,
} from "@/lib/api/admin/product-image-upload";
import type { BlogMediaItem, BlogPost } from "@/lib/api/blog.api";

export { PRODUCT_IMAGE_ACCEPT, isAllowedProductImageFile };

type UploadOptions = {
  onProgress?: (percent: number) => void;
};

function parseCoverResponse(raw: string): BlogPost {
  let json: ApiEnvelope<{ post: BlogPost }>;
  try {
    json = JSON.parse(raw) as ApiEnvelope<{ post: BlogPost }>;
  } catch {
    throw new ApiError("Unexpected upload response.", {
      status: 500,
      body: null,
    });
  }
  if (!json?.data?.post) {
    throw new ApiError(json?.message || "Upload failed.", {
      status: 500,
      body: json as unknown as ApiErrorBody,
    });
  }
  return json.data.post;
}

function parseMediaResponse(raw: string): BlogMediaItem {
  let json: ApiEnvelope<{ media: BlogMediaItem }>;
  try {
    json = JSON.parse(raw) as ApiEnvelope<{ media: BlogMediaItem }>;
  } catch {
    throw new ApiError("Unexpected upload response.", {
      status: 500,
      body: null,
    });
  }
  if (!json?.data?.media) {
    throw new ApiError(json?.message || "Upload failed.", {
      status: 500,
      body: json as unknown as ApiErrorBody,
    });
  }
  return json.data.media;
}

async function uploadWithProgress<T>(
  url: string,
  file: File,
  parse: (raw: string) => T,
  options?: UploadOptions,
  extraFields?: Record<string, string>,
): Promise<T> {
  async function attempt(retried: boolean): Promise<T> {
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
            resolve(parse(xhr.responseText));
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
      if (extraFields) {
        for (const [key, value] of Object.entries(extraFields)) {
          form.append(key, value);
        }
      }
      xhr.send(form);
    });
  }

  return attempt(false);
}

export async function uploadAdminBlogCoverWithProgress(
  postId: string,
  file: File,
  options?: UploadOptions,
): Promise<BlogPost> {
  const { apiUrl } = getPublicEnv();
  return uploadWithProgress(
    `${apiUrl}/api/admin/blog/${postId}/cover`,
    file,
    parseCoverResponse,
    options,
  );
}

export async function uploadAdminBlogMediaWithProgress(
  postId: string,
  file: File,
  options?: UploadOptions & { alt?: string },
): Promise<BlogMediaItem> {
  const { apiUrl } = getPublicEnv();
  return uploadWithProgress(
    `${apiUrl}/api/admin/blog/${postId}/media`,
    file,
    parseMediaResponse,
    options,
    options?.alt ? { alt: options.alt } : undefined,
  );
}
