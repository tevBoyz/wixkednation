import { apiData, apiRequest, type ApiEnvelope } from "@/lib/api/client";
import type { Cart } from "@/lib/api/types";

type CartEnvelope = { cart: Cart };

export async function getCart(): Promise<Cart> {
  const data = await apiData<CartEnvelope>("/api/cart");
  return data.cart;
}

export async function addCartItem(body: {
  productId: string;
  skuId: string;
  quantity: number;
}): Promise<Cart> {
  const data = await apiData<CartEnvelope>("/api/cart/items", {
    method: "POST",
    body,
  });
  return data.cart;
}

export async function updateCartItem(
  itemId: string,
  quantity: number,
): Promise<Cart> {
  const data = await apiData<CartEnvelope>(`/api/cart/items/${itemId}`, {
    method: "PATCH",
    body: { quantity },
  });
  return data.cart;
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const data = await apiData<CartEnvelope>(`/api/cart/items/${itemId}`, {
    method: "DELETE",
  });
  return data.cart;
}

export async function clearCart(): Promise<Cart> {
  const data = await apiData<CartEnvelope>("/api/cart", { method: "DELETE" });
  return data.cart;
}

export async function mergeCart(
  items: Array<{
    productId: string;
    skuId: string;
    quantity: number;
  }>,
) {
  return apiData<{
    cart: Cart;
    summary?: {
      merged: number;
      skipped: number;
      skippedProductIds: string[];
    };
  }>("/api/cart/merge", {
    method: "POST",
    body: { items },
  });
}

/** @deprecated Prefer typed helpers above; kept for envelope-level callers. */
export async function getCartRaw() {
  return apiRequest<ApiEnvelope<CartEnvelope>>("/api/cart");
}
