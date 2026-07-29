import { getPublicEnv } from "@/config/env";
import { ApiError, normalizeApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/token-storage";
import { refreshAccessToken } from "@/lib/auth/session";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Attach Bearer access token when available. Default true. */
  auth?: boolean;
  headers?: HeadersInit;
  signal?: AbortSignal;
  /** Request timeout in ms. Default 15000. Set 0 to disable. */
  timeoutMs?: number;
  /** Internal: already retried after refresh. */
  _retried?: boolean;
};

function joinUrl(base: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function buildBody(body: unknown): {
  payload: BodyInit | undefined;
  contentType?: string;
} {
  if (body === undefined || body === null) {
    return { payload: undefined };
  }

  if (body instanceof FormData) {
    return { payload: body };
  }

  return {
    payload: JSON.stringify(body),
    contentType: "application/json",
  };
}

function shouldAttemptRefresh(path: string, auth: boolean): boolean {
  if (!auth) {
    return false;
  }

  const skip = [
    "/api/auth/otp/send",
    "/api/auth/otp/verify",
    "/api/auth/pin/login",
    "/api/auth/pin/set",
    "/api/auth/refresh",
    "/api/auth/logout",
    "/api/auth/exchange-code",
  ];

  return !skip.some((prefix) => path.startsWith(prefix));
}

/**
 * Central API fetch wrapper.
 * - Resolves NEXT_PUBLIC_API_URL
 * - Optional Bearer token
 * - JSON or FormData bodies
 * - Timeout / abort
 * - Single 401 → refresh → retry
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    auth = true,
    headers: customHeaders,
    signal,
    timeoutMs = 15_000,
    _retried = false,
  } = options;

  const { apiUrl } = getPublicEnv();
  const headers = new Headers(customHeaders);
  const { payload, contentType } = buildBody(body);

  if (contentType && !headers.has("Content-Type")) {
    headers.set("Content-Type", contentType);
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  try {
    const response = await fetch(joinUrl(apiUrl, path), {
      method,
      headers,
      body: payload,
      signal: controller.signal,
      cache: "no-store",
    });

    if (
      response.status === 401 &&
      !_retried &&
      shouldAttemptRefresh(path, auth)
    ) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiRequest<T>(path, { ...options, _retried: true });
      }
    }

    if (!response.ok) {
      throw await normalizeApiError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentTypeHeader = response.headers.get("content-type") || "";
    if (!contentTypeHeader.includes("application/json")) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out. Please try again.", {
        status: 408,
        body: null,
      });
    }

    if (error instanceof TypeError) {
      throw new ApiError(
        "Unable to reach the server. Check that the backend is running.",
        { status: 0, body: null },
      );
    }

    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    signal?.removeEventListener("abort", onAbort);
  }
}

/** Convenience: unwrap standard `{ success, message, data }` responses. */
export async function apiData<T>(
  path: string,
  options?: ApiRequestOptions,
): Promise<T> {
  const json = await apiRequest<ApiEnvelope<T>>(path, options);

  if (!json || typeof json !== "object" || !("data" in json)) {
    throw new ApiError("Unexpected API response shape.", {
      status: 500,
      body: null,
    });
  }

  return json.data;
}
