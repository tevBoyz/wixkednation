"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useMemo, type ReactNode } from "react";

import {
  getStoreConfig,
  storeConfigQueryKey,
} from "@/lib/api/store-config.api";
import type { OrderContactPhone } from "@/lib/api/types";
import {
  DEFAULT_CURRENCY,
  type StoreCurrency,
} from "@/lib/catalog/currency";
import {
  formatPrice as formatPriceBase,
  formatProductPrice as formatProductPriceBase,
} from "@/lib/catalog/format";

type StoreConfigContextValue = {
  currency: StoreCurrency;
  orderContactPhones: OrderContactPhone[];
  isLoading: boolean;
  formatPrice: (value: number | string | null | undefined) => string;
  formatProductPrice: (value: number | string | null | undefined) => string;
};

const StoreConfigContext = createContext<StoreConfigContextValue>({
  currency: DEFAULT_CURRENCY,
  orderContactPhones: [],
  isLoading: true,
  formatPrice: (value) => formatPriceBase(value, DEFAULT_CURRENCY),
  formatProductPrice: (value) =>
    formatProductPriceBase(value, DEFAULT_CURRENCY),
});

export function StoreConfigProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: storeConfigQueryKey,
    queryFn: getStoreConfig,
    staleTime: 60_000,
  });

  const currency = query.data?.defaultCurrency ?? DEFAULT_CURRENCY;
  const orderContactPhones = query.data?.orderContactPhones ?? [];

  const value = useMemo(
    () => ({
      currency,
      orderContactPhones,
      isLoading: query.isLoading,
      formatPrice: (value: number | string | null | undefined) =>
        formatPriceBase(value, currency),
      formatProductPrice: (value: number | string | null | undefined) =>
        formatProductPriceBase(value, currency),
    }),
    [currency, orderContactPhones, query.isLoading],
  );

  return (
    <StoreConfigContext.Provider value={value}>
      {children}
    </StoreConfigContext.Provider>
  );
}

export function useStoreCurrency(): StoreCurrency {
  return useContext(StoreConfigContext).currency;
}

export function useOrderContactPhones(): OrderContactPhone[] {
  return useContext(StoreConfigContext).orderContactPhones;
}

export function useFormatPrice() {
  return useContext(StoreConfigContext).formatPrice;
}

export function useFormatProductPrice() {
  return useContext(StoreConfigContext).formatProductPrice;
}
