"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import {
  GUEST_CART_KEY,
  mergeGuestLine,
  parseGuestCart,
  type GuestCartLine,
} from "@/lib/cart/guest-cart";

type GuestCartState = {
  items: GuestCartLine[];
  addItem: (
    item: Omit<GuestCartLine, "quantity"> & { quantity?: number },
  ) => void;
  setQuantity: (skuId: string, quantity: number) => void;
  removeItem: (skuId: string) => void;
  clear: () => void;
};

const safeStorage = createJSONStorage(() => ({
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name);
      if (!raw) {
        return null;
      }
      // Zustand persist expects the wrapped { state, version } JSON string.
      // Also accept a bare array (legacy) by wrapping it.
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          return JSON.stringify({
            state: { items: parseGuestCart(raw) },
            version: 0,
          });
        }
        if (
          parsed &&
          typeof parsed === "object" &&
          "state" in (parsed as object)
        ) {
          const state = (parsed as { state?: { items?: unknown } }).state;
          if (state && Array.isArray(state.items)) {
            const items = parseGuestCart(JSON.stringify(state.items));
            return JSON.stringify({
              ...(parsed as object),
              state: { ...state, items },
            });
          }
        }
      } catch {
        return JSON.stringify({ state: { items: [] }, version: 0 });
      }
      return raw;
    } catch {
      return JSON.stringify({ state: { items: [] }, version: 0 });
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // ignore
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
}));

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set({ items: mergeGuestLine(get().items, item) });
      },
      setQuantity: (skuId, quantity) => {
        const nextQty = Math.floor(quantity);
        if (nextQty < 1) {
          set({
            items: get().items.filter((item) => item.skuId !== skuId),
          });
          return;
        }
        set({
          items: get().items.map((item) =>
            item.skuId === skuId ? { ...item, quantity: nextQty } : item,
          ),
        });
      },
      removeItem: (skuId) => {
        set({
          items: get().items.filter((item) => item.skuId !== skuId),
        });
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: GUEST_CART_KEY,
      storage: safeStorage,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
