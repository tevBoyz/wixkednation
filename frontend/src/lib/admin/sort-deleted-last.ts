export type SoftDeletable = {
  deletedAt?: string | null;
};

export function isSoftDeleted(item: SoftDeletable): boolean {
  return Boolean(item.deletedAt);
}

/**
 * Comparator that keeps soft-deleted rows at the bottom.
 * Use with Array.sort or sortDeletedLast for admin lists.
 */
export function compareDeletedLast<T extends SoftDeletable>(
  a: T,
  b: T,
  secondaryCompare?: (left: T, right: T) => number,
): number {
  const aDeleted = isSoftDeleted(a);
  const bDeleted = isSoftDeleted(b);

  if (aDeleted !== bDeleted) {
    return aDeleted ? 1 : -1;
  }

  return secondaryCompare?.(a, b) ?? 0;
}

/** Returns a new array with soft-deleted items moved to the bottom. */
export function sortDeletedLast<T extends SoftDeletable>(
  items: readonly T[],
  options?: {
    secondaryCompare?: (left: T, right: T) => number;
  },
): T[] {
  return [...items].sort((a, b) =>
    compareDeletedLast(a, b, options?.secondaryCompare),
  );
}
