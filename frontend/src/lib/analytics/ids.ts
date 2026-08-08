const VISITOR_KEY = "gn_analytics_vid";
const SESSION_KEY = "gn_analytics_sid";
const SESSION_TS_KEY = "gn_analytics_sts";
const SESSION_IDLE_MS = 30 * 60 * 1000;

function randomUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readStorage(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") {
    return;
  }
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function getVisitorId(): string {
  if (typeof window === "undefined") {
    return randomUuid();
  }

  const fromLocal = readStorage(window.localStorage, VISITOR_KEY);
  if (fromLocal) {
    return fromLocal;
  }

  const fromCookie = readCookie(VISITOR_KEY);
  if (fromCookie) {
    writeStorage(window.localStorage, VISITOR_KEY, fromCookie);
    return fromCookie;
  }

  const id = randomUuid();
  writeStorage(window.localStorage, VISITOR_KEY, id);
  writeCookie(VISITOR_KEY, id);
  return id;
}

export function getSessionId(): string {
  if (typeof window === "undefined") {
    return randomUuid();
  }

  const now = Date.now();
  const existing = readStorage(window.sessionStorage, SESSION_KEY);
  const tsRaw = readStorage(window.sessionStorage, SESSION_TS_KEY);
  const lastTs = tsRaw ? Number.parseInt(tsRaw, 10) : 0;

  if (existing && lastTs && now - lastTs < SESSION_IDLE_MS) {
    writeStorage(window.sessionStorage, SESSION_TS_KEY, String(now));
    return existing;
  }

  const id = randomUuid();
  writeStorage(window.sessionStorage, SESSION_KEY, id);
  writeStorage(window.sessionStorage, SESSION_TS_KEY, String(now));
  return id;
}
