"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import {
  addCartItem as addServerCartItem,
  clearCart as clearServerCart,
  getCart,
  removeCartItem as removeServerCartItem,
  updateCartItem as updateServerCartItem,
} from "@/lib/api/cart.api";
import { ApiError, getErrorMessage } from "@/lib/api/errors";
import type { Cart } from "@/lib/api/types";
import {
  formatSkuLabel,
  getProductCoverUrl,
  resolveEffectiveVolume,
} from "@/lib/catalog/format";
import type { GuestCartLine } from "@/lib/cart/guest-cart";
import {
  computeCartItemCount,
  computeCartSubtotal,
  toCartAmount,
} from "@/lib/cart/totals";
import { ensureGuestCartMerged } from "@/lib/cart/merge-guest-cart";
import { isStaffRole } from "@/lib/auth/redirect";
import { useGuestCartStore } from "@/stores/guest-cart-store";

function isCustomerCartForbidden(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 403 &&
    /customer access required/i.test(error.message)
  );
}

export type CartLine = {
  /** Guest: skuId. Server: cart item id. */
  key: string;
  productId: string;
  skuId: string;
  name: string;
  image: string | null;
  quantity: number;
  volume: number | string | null;
  /** volume × quantity */
  effectiveVolume: number | string | null;
  measurementUnit: string;
  price: number | string;
  skuLabel?: string | null;
  slug?: string;
  lineTotal: number;
};

export type AddToCartInput = {
  productId: string;
  skuId: string;
  name: string;
  image?: string | null;
  quantity?: number;
  volume?: number | string | null;
  measurementUnit: string;
  price: number | string;
  skuLabel?: string | null;
  slug?: string;
};

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  isServerCart: boolean;
  addItem: (input: AddToCartInput) => Promise<void>;
  setQuantity: (key: string, quantity: number) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function mapGuestLines(items: GuestCartLine[]): CartLine[] {
  return items.map((item) => {
    const price = toCartAmount(item.price);
    return {
      key: item.skuId,
      productId: item.productId,
      skuId: item.skuId,
      name: item.name,
      image: item.image,
      quantity: item.quantity,
      volume: item.volume,
      effectiveVolume: resolveEffectiveVolume(item.volume, item.quantity),
      measurementUnit: item.measurementUnit,
      price: item.price,
      skuLabel: item.skuLabel,
      slug: item.slug,
      lineTotal: price * item.quantity,
    };
  });
}

function mapServerCart(cart: Cart | null): CartLine[] {
  if (!cart?.items?.length) {
    return [];
  }

  return cart.items.map((item) => {
    const product = item.product;
    const sku = item.sku;
    const unitFromLine =
      item.quantity > 0 ? toCartAmount(item.lineTotal) / item.quantity : 0;
    const unitPrice =
      sku?.price != null
        ? toCartAmount(sku.price)
        : product?.price != null
          ? toCartAmount(product.price)
          : unitFromLine;
    const volume = item.volume ?? sku?.volume ?? product?.volume ?? null;
    const measurementUnit =
      item.measurementUnit ||
      sku?.measurementUnit ||
      product?.measurementUnit ||
      "";
    const skuLabel =
      item.skuLabel ??
      (sku ? formatSkuLabel(sku) : null) ??
      null;

    return {
      key: item.id,
      productId: item.productId,
      skuId: item.skuId || sku?.id || "",
      name: product?.name || "Product",
      image: getProductCoverUrl(product || {}),
      quantity: item.quantity,
      volume,
      effectiveVolume: resolveEffectiveVolume(
        volume,
        item.quantity,
        item.effectiveVolume,
      ),
      measurementUnit,
      price: unitPrice,
      skuLabel,
      slug: product?.slug,
      lineTotal:
        item.lineTotal != null
          ? toCartAmount(item.lineTotal)
          : unitPrice * item.quantity,
    };
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const guestItems = useGuestCartStore((state) => state.items);
  const guestAdd = useGuestCartStore((state) => state.addItem);
  const guestSetQty = useGuestCartStore((state) => state.setQuantity);
  const guestRemove = useGuestCartStore((state) => state.removeItem);
  const guestClear = useGuestCartStore((state) => state.clear);

  const [serverCart, setServerCart] = useState<Cart | null>(null);
  const [serverLoading, setServerLoading] = useState(false);

  /** Server cart is customer-only; admins keep using the local guest cart. */
  const isServerCart = isAuthenticated && !isStaffRole(user?.role);

  const refresh = useCallback(async () => {
    if (!isServerCart) {
      return;
    }

    setServerLoading(true);
    try {
      const cart = await getCart();
      setServerCart(cart);
    } catch (error) {
      if (!isCustomerCartForbidden(error)) {
        toast.error(getErrorMessage(error, "Could not load cart"));
      }
    } finally {
      setServerLoading(false);
    }
  }, [isServerCart]);

  // Load server cart; merge guest cart once when authenticated and local items exist.
  useEffect(() => {
    if (authLoading || !isServerCart) {
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setServerLoading(true);
        try {
          const mergeResult = await ensureGuestCartMerged();
          if (cancelled) {
            return;
          }

          if (mergeResult) {
            setServerCart(mergeResult.cart);

            if (mergeResult.skipped > 0) {
              toast.message("Some guest cart items could not be merged", {
                description: `${mergeResult.skipped} item${mergeResult.skipped === 1 ? "" : "s"} unavailable. The rest were added to your cart.`,
              });
            } else if (mergeResult.merged > 0) {
              toast.success("Guest cart merged into your account");
            }
            return;
          }

          const cart = await getCart();
          if (!cancelled) {
            setServerCart(cart);
          }
        } catch (error) {
          if (cancelled) {
            return;
          }
          if (isCustomerCartForbidden(error)) {
            return;
          }
          // Keep guest cart on merge failure (ensureGuestCartMerged only clears on success)
          toast.error(
            getErrorMessage(
              error,
              "Could not merge guest cart. Local cart kept.",
            ),
          );
          try {
            const cart = await getCart();
            if (!cancelled) {
              setServerCart(cart);
            }
          } catch {
            // ignore secondary failure
          }
        } finally {
          if (!cancelled) {
            setServerLoading(false);
          }
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [authLoading, isServerCart]);

  const items = useMemo(
    () =>
      isServerCart ? mapServerCart(serverCart) : mapGuestLines(guestItems),
    [guestItems, isServerCart, serverCart],
  );

  const itemCount = useMemo(() => computeCartItemCount(items), [items]);

  const subtotal = useMemo(() => computeCartSubtotal(items), [items]);

  const addItem = useCallback(
    async (input: AddToCartInput) => {
      const quantity = Math.max(1, Math.floor(input.quantity ?? 1));

      if (!isServerCart) {
        guestAdd({
          productId: input.productId,
          skuId: input.skuId,
          name: input.name,
          image: input.image ?? null,
          quantity,
          volume: input.volume ?? null,
          measurementUnit: input.measurementUnit,
          price: input.price,
          skuLabel: input.skuLabel ?? null,
          slug: input.slug,
        });
        toast.success("Added to cart");
        return;
      }

      const previous = serverCart;
      try {
        const cart = await addServerCartItem({
          productId: input.productId,
          skuId: input.skuId,
          quantity,
        });
        setServerCart(cart);
        toast.success("Added to cart");
      } catch (error) {
        setServerCart(previous);
        toast.error(getErrorMessage(error, "Could not add to cart"));
      }
    },
    [guestAdd, isServerCart, serverCart],
  );

  const setQuantity = useCallback(
    async (key: string, quantity: number) => {
      const nextQty = Math.floor(quantity);

      if (!isServerCart) {
        guestSetQty(key, nextQty);
        return;
      }

      const previous = serverCart;
      if (nextQty < 1) {
        setServerCart((current) =>
          current
            ? {
                ...current,
                items: current.items.filter((item) => item.id !== key),
              }
            : current,
        );
        try {
          const cart = await removeServerCartItem(key);
          setServerCart(cart);
        } catch (error) {
          setServerCart(previous);
          toast.error(getErrorMessage(error, "Could not update cart"));
        }
        return;
      }

      setServerCart((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === key ? { ...item, quantity: nextQty } : item,
              ),
            }
          : current,
      );

      try {
        const cart = await updateServerCartItem(key, nextQty);
        setServerCart(cart);
      } catch (error) {
        setServerCart(previous);
        toast.error(getErrorMessage(error, "Could not update quantity"));
      }
    },
    [guestSetQty, isServerCart, serverCart],
  );

  const removeItem = useCallback(
    async (key: string) => {
      if (!isServerCart) {
        guestRemove(key);
        toast.success("Removed from cart");
        return;
      }

      const previous = serverCart;
      setServerCart((current) =>
        current
          ? {
              ...current,
              items: current.items.filter((item) => item.id !== key),
            }
          : current,
      );

      try {
        const cart = await removeServerCartItem(key);
        setServerCart(cart);
        toast.success("Removed from cart");
      } catch (error) {
        setServerCart(previous);
        toast.error(getErrorMessage(error, "Could not remove item"));
      }
    },
    [guestRemove, isServerCart, serverCart],
  );

  const clear = useCallback(async () => {
    if (!isServerCart) {
      guestClear();
      toast.success("Cart cleared");
      return;
    }

    const previous = serverCart;
    setServerCart((current) =>
      current ? { ...current, items: [], itemCount: 0, totalAmount: "0" } : current,
    );

    try {
      const cart = await clearServerCart();
      setServerCart(cart);
      toast.success("Cart cleared");
    } catch (error) {
      setServerCart(previous);
      toast.error(getErrorMessage(error, "Could not clear cart"));
    }
  }, [guestClear, isServerCart, serverCart]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotal,
      isLoading: authLoading || (isServerCart && serverLoading),
      isServerCart,
      addItem,
      setQuantity,
      removeItem,
      clear,
      refresh,
    }),
    [
      addItem,
      authLoading,
      clear,
      isServerCart,
      itemCount,
      items,
      refresh,
      removeItem,
      serverLoading,
      setQuantity,
      subtotal,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
