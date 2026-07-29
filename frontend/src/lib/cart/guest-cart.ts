export const GUEST_CART_KEY = "guest_cart";

export type GuestCartLine = {
  productId: string;
  name: string;
  image: string | null;
  quantity: number;
  volume: number | string | null;
  measurementUnit: string;
  price: number | string;
  slug?: string;
};

function isGuestCartLine(value: unknown): value is GuestCartLine {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.productId === "string" &&
    typeof row.name === "string" &&
    typeof row.quantity === "number" &&
    Number.isFinite(row.quantity) &&
    row.quantity >= 1 &&
    (typeof row.price === "number" || typeof row.price === "string") &&
    typeof row.measurementUnit === "string"
  );
}

/** Parse guest cart JSON; returns [] on corrupt / invalid data. */
export function parseGuestCart(raw: string | null): GuestCartLine[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const list = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === "object" &&
          Array.isArray((parsed as { items?: unknown }).items)
        ? (parsed as { items: unknown[] }).items
        : null;

    if (!list) {
      return [];
    }

    return list.filter(isGuestCartLine).map((item) => ({
      productId: item.productId,
      name: item.name,
      image: typeof item.image === "string" ? item.image : null,
      quantity: Math.floor(item.quantity),
      volume: item.volume ?? null,
      measurementUnit: item.measurementUnit,
      price: item.price,
      slug: typeof item.slug === "string" ? item.slug : undefined,
    }));
  } catch {
    return [];
  }
}

export function readGuestCart(): GuestCartLine[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    return parseGuestCart(localStorage.getItem(GUEST_CART_KEY));
  } catch {
    return [];
  }
}

export function writeGuestCart(items: GuestCartLine[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    // quota / private mode
  }
}

export function clearGuestCartStorage(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // ignore
  }
}

export function mergeGuestLine(
  items: GuestCartLine[],
  incoming: Omit<GuestCartLine, "quantity"> & { quantity?: number },
): GuestCartLine[] {
  const quantity = Math.max(1, Math.floor(incoming.quantity ?? 1));
  const index = items.findIndex((item) => item.productId === incoming.productId);

  if (index === -1) {
    return [
      ...items,
      {
        productId: incoming.productId,
        name: incoming.name,
        image: incoming.image ?? null,
        quantity,
        volume: incoming.volume ?? null,
        measurementUnit: incoming.measurementUnit,
        price: incoming.price,
        slug: incoming.slug,
      },
    ];
  }

  return items.map((item, i) =>
    i === index
      ? { ...item, quantity: item.quantity + quantity, name: incoming.name, image: incoming.image ?? item.image, price: incoming.price, slug: incoming.slug ?? item.slug }
      : item,
  );
}
