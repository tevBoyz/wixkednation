import {
  compareDeletedLast,
  isSoftDeleted,
  type SoftDeletable,
} from "@/lib/admin/sort-deleted-last";

export type AdminListProduct = SoftDeletable & {
  isVisible?: boolean;
  createdAt?: string | null;
};

/** 0 = active visible, 1 = hidden, 2 = deleted */
export function getAdminProductSortTier(product: AdminListProduct): number {
  if (isSoftDeleted(product)) {
    return 2;
  }
  if (product.isVisible === false) {
    return 1;
  }
  return 0;
}

/**
 * Admin product list order: newest visible first, hidden next, deleted last.
 * Prefer backend `orderBy` for paginated lists; use this after client-side filters.
 */
export function compareAdminProducts(
  a: AdminListProduct,
  b: AdminListProduct,
): number {
  const tierA = getAdminProductSortTier(a);
  const tierB = getAdminProductSortTier(b);

  if (tierA !== tierB) {
    return tierA - tierB;
  }

  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

  if (dateA !== dateB) {
    return dateB - dateA;
  }

  return compareDeletedLast(a, b);
}

export function sortAdminProducts<T extends AdminListProduct>(
  items: readonly T[],
): T[] {
  return [...items].sort(compareAdminProducts);
}
