import { apiData } from "@/lib/api/client";
import type { OrderContactPhone } from "@/lib/api/types";
import {
  DEFAULT_CURRENCY,
  normalizeStoreCurrency,
  type StoreCurrency,
} from "@/lib/catalog/currency";

export type StoreConfig = {
  defaultCurrency: StoreCurrency;
  /** Phones flagged for the storefront order banner. */
  orderContactPhones: OrderContactPhone[];
};

export const storeConfigQueryKey = ["store", "config"] as const;

export async function getStoreConfig(): Promise<StoreConfig> {
  const data = await apiData<{
    defaultCurrency?: string;
    orderContactPhones?: OrderContactPhone[];
  }>("/api/store/config", {
    auth: false,
  });

  const phones = Array.isArray(data.orderContactPhones)
    ? data.orderContactPhones.filter(
        (entry): entry is OrderContactPhone =>
          Boolean(entry?.id && entry?.phone),
      )
    : [];

  return {
    defaultCurrency: normalizeStoreCurrency(
      data.defaultCurrency ?? DEFAULT_CURRENCY,
    ),
    orderContactPhones: phones,
  };
}
