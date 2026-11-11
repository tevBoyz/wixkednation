import type { Category } from "@/lib/api/types";

export type FlatCategoryOption = {
  id: string;
  label: string;
  depth: number;
  category: Category;
  pathNames: string[];
};

function compareCategories(a: Category, b: Category) {
  const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  if (orderDiff !== 0) {
    return orderDiff;
  }
  return a.name.localeCompare(b.name);
}

/** Sort a tree in place-safe copy by sortOrder then name at every level. */
export function sortCategoryTree(nodes: Category[]): Category[] {
  return [...nodes]
    .map((node) => ({
      ...node,
      children: sortCategoryTree(node.children ?? []),
    }))
    .sort(compareCategories);
}

/**
 * Flatten a category tree for selects / tables.
 * Labels look like `Flower → Indica`.
 */
export function flattenCategoryTree(
  roots: Category[],
  options?: { pathSeparator?: string },
): FlatCategoryOption[] {
  const separator = options?.pathSeparator ?? " → ";
  const result: FlatCategoryOption[] = [];

  function walk(nodes: Category[], pathNames: string[]) {
    for (const node of [...nodes].sort(compareCategories)) {
      const nextPath = [...pathNames, node.name];
      result.push({
        id: node.id,
        label: nextPath.join(separator),
        depth: pathNames.length,
        category: node,
        pathNames: nextPath,
      });
      walk(node.children ?? [], nextPath);
    }
  }

  walk(roots, []);
  return result;
}

export function findCategoryInTree(
  roots: Category[],
  id: string,
): Category | null {
  for (const node of roots) {
    if (node.id === id) {
      return node;
    }
    const nested = findCategoryInTree(node.children ?? [], id);
    if (nested) {
      return nested;
    }
  }
  return null;
}

/** Ancestor chain from root to the node with this slug (inclusive). */
export function findCategoryPathBySlug(
  roots: Category[],
  slug: string,
): Category[] | null {
  for (const node of roots) {
    if (node.slug === slug) {
      return [node];
    }
    const nested = findCategoryPathBySlug(node.children ?? [], slug);
    if (nested) {
      return [node, ...nested];
    }
  }
  return null;
}

/** IDs of all descendants (not including the node itself). */
export function collectDescendantIds(category: Category): Set<string> {
  const ids = new Set<string>();

  function walk(node: Category) {
    for (const child of node.children ?? []) {
      ids.add(child.id);
      walk(child);
    }
  }

  walk(category);
  return ids;
}

/** Parent options for create/edit: exclude self and its descendants. */
export function parentCategoryOptions(
  roots: Category[],
  editingId?: string | null,
): FlatCategoryOption[] {
  const flat = flattenCategoryTree(roots);
  if (!editingId) {
    return flat;
  }

  const editing = findCategoryInTree(roots, editingId);
  const blocked = new Set<string>([editingId]);
  if (editing) {
    for (const id of collectDescendantIds(editing)) {
      blocked.add(id);
    }
  }

  return flat.filter((option) => !blocked.has(option.id));
}

export function filterFlatCategories(
  options: FlatCategoryOption[],
  query: string,
): FlatCategoryOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return options;
  }

  return options.filter(
    (option) =>
      option.category.name.toLowerCase().includes(normalized) ||
      option.category.slug.toLowerCase().includes(normalized) ||
      option.label.toLowerCase().includes(normalized),
  );
}

export function countCategoriesInTree(roots: Category[]): number {
  return flattenCategoryTree(roots).length;
}
