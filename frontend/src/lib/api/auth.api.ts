import { apiData, apiRequest, type ApiEnvelope } from "@/lib/api/client";
import type { AuthUser } from "@/lib/api/types";

export type AuthTokensPayload = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type PinSetupPayload = {
  requiresPinSetup: true;
  setupToken: string;
  user: AuthUser;
};

export type OtpPurpose = "register" | "forgot_pin";

export type AuthSessionOrPinSetup = AuthTokensPayload | PinSetupPayload;

export function isPinSetupPayload(
  data: AuthSessionOrPinSetup,
): data is PinSetupPayload {
  return (
    "requiresPinSetup" in data &&
    data.requiresPinSetup === true &&
    typeof data.setupToken === "string"
  );
}

export function isAuthTokensPayload(
  data: AuthSessionOrPinSetup,
): data is AuthTokensPayload {
  return (
    "accessToken" in data &&
    typeof data.accessToken === "string" &&
    "refreshToken" in data &&
    typeof data.refreshToken === "string"
  );
}

export type PinLoginBody =
  | { phone: string; pin: string; email?: never }
  | { email: string; pin: string; phone?: never };

export async function pinLogin(body: PinLoginBody) {
  return apiData<AuthTokensPayload>("/api/auth/pin/login", {
    method: "POST",
    auth: false,
    body,
  });
}

export async function setPin(
  setupToken: string,
  body: { pin: string; confirmPin: string },
) {
  return apiData<AuthTokensPayload>("/api/auth/pin/set", {
    method: "POST",
    auth: false,
    headers: {
      Authorization: `Bearer ${setupToken}`,
    },
    body,
  });
}

export async function changePin(body: {
  currentPin: string;
  newPin: string;
  confirmPin: string;
}) {
  return apiData<unknown>("/api/auth/pin/change", {
    method: "POST",
    body,
  });
}

export async function sendOtp(phone: string, purpose: OtpPurpose = "register") {
  return apiRequest<ApiEnvelope<unknown>>("/api/auth/otp/send", {
    method: "POST",
    auth: false,
    body: { phone, purpose },
  });
}

export async function verifyOtp(
  phone: string,
  otp: string,
  purpose: OtpPurpose = "register",
) {
  return apiData<AuthSessionOrPinSetup>("/api/auth/otp/verify", {
    method: "POST",
    auth: false,
    body: { phone, otp, purpose },
  });
}

export async function refreshTokens(refreshToken: string) {
  return apiData<AuthTokensPayload>("/api/auth/refresh", {
    method: "POST",
    auth: false,
    body: { refreshToken },
  });
}

export async function logout(refreshToken: string) {
  return apiRequest<ApiEnvelope<unknown>>("/api/auth/logout", {
    method: "POST",
    auth: false,
    body: { refreshToken },
  });
}

export async function exchangeAuthCode(code: string) {
  return apiData<AuthSessionOrPinSetup>("/api/auth/exchange-code", {
    method: "POST",
    auth: false,
    body: { code },
  });
}

/** Legacy shape: user at top level (not data.user). */
export async function getAuthMe() {
  return apiRequest<{
    success: boolean;
    message: string;
    user: AuthUser;
  }>("/api/auth/me");
}

export async function adminCheck() {
  return apiRequest<ApiEnvelope<unknown>>("/api/auth/admin-check");
}

export function getGoogleStartUrl(apiUrl: string): string {
  return `${apiUrl.replace(/\/$/, "")}/api/auth/google/start`;
}
