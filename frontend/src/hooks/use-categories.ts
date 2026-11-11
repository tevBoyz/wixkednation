"use client";

import { useQuery } from "@tanstack/react-query";

import { listCategories } from "@/lib/api/categories.api";

export const categoriesQueryKey = ["categories", "public"] as const;

export function useCategories() {
  return useQuery({
    queryKey: categoriesQueryKey,
    queryFn: listCategories,
    staleTime: 60_000,
  });
}
