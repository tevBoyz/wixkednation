import { apiRequest } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";

export type HealthResponse = {
  success: boolean;
  message: string;
  database?: string;
  timestamp?: string;
  environment?: string;
};

export type HealthResult =
  | { ok: true; data: HealthResponse }
  | { ok: false; error: string };

export async function fetchBackendHealth(): Promise<HealthResult> {
  try {
    const data = await apiRequest<HealthResponse>("/api/health", {
      auth: false,
    });
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error, "Unknown network error") };
  }
}
