import type { CreateGuestOrderResult } from "@/lib/api/orders.api";

const STORAGE_PREFIX = "gasnation:guest-order-success:";

export type GuestOrderSnapshot = CreateGuestOrderResult;

function storageKey(orderId: string) {
  return `${STORAGE_PREFIX}${orderId}`;
}

export function saveGuestOrderSnapshot(snapshot: GuestOrderSnapshot) {
  if (typeof window === "undefined" || !snapshot.order?.id) {
    return;
  }

  try {
    sessionStorage.setItem(
      storageKey(snapshot.order.id),
      JSON.stringify(snapshot),
    );
  } catch {
    // ignore quota / private mode
  }
}

export function readGuestOrderSnapshot(
  orderId: string,
): GuestOrderSnapshot | null {
  if (typeof window === "undefined" || !orderId) {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(storageKey(orderId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as GuestOrderSnapshot;
    if (!parsed?.order?.id || parsed.order.id !== orderId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
