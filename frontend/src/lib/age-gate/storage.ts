import {
  AGE_GATE_COOKIE,
  AGE_GATE_MAX_AGE_SECONDS,
  AGE_GATE_STORAGE_KEY,
} from "@/lib/age-gate/constants";

export {
  AGE_GATE_COOKIE,
  AGE_GATE_MAX_AGE_SECONDS,
  AGE_GATE_STORAGE_KEY,
} from "@/lib/age-gate/constants";

export function getAgeGateTokenFromDocument(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${AGE_GATE_COOKIE}=`));

  if (match) {
    return decodeURIComponent(match.split("=").slice(1).join("=")) || null;
  }

  try {
    return localStorage.getItem(AGE_GATE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function persistAgeGateToken(token: string): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${AGE_GATE_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${AGE_GATE_MAX_AGE_SECONDS}; SameSite=Lax`;

  try {
    localStorage.setItem(AGE_GATE_STORAGE_KEY, token);
  } catch {
    // ignore quota / private mode
  }
}

export function clearAgeGateToken(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${AGE_GATE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;

  try {
    localStorage.removeItem(AGE_GATE_STORAGE_KEY);
  } catch {
    // ignore
  }
}
