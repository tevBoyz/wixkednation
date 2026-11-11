"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

import { getPreviousAppPath } from "@/components/layout/navigation-trail";
import { Button } from "@/components/ui/button";

function labelFromPath(path: string | null): string {
  if (!path) {
    return "Back to products";
  }

  const pathname = path.split("?")[0] || path;

  if (pathname === "/" || pathname === "") {
    return "Back to home";
  }
  if (pathname.startsWith("/categories")) {
    return "Back to category";
  }
  if (pathname.startsWith("/products")) {
    return "Back to products";
  }
  if (pathname.startsWith("/cart")) {
    return "Back to cart";
  }
  if (pathname.startsWith("/account")) {
    return "Back to account";
  }
  return "Go back";
}

function subscribe() {
  return () => {};
}

/**
 * Returns to the previous in-app page (home, category, filtered list, etc.).
 * Falls back to /products for direct links / new tabs.
 */
export function ProductBackButton() {
  const router = useRouter();
  const previousPath = useSyncExternalStore(
    subscribe,
    getPreviousAppPath,
    () => null,
  );
  const label = labelFromPath(previousPath);

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        const target = getPreviousAppPath();
        if (target && !target.startsWith("/products/")) {
          router.push(target);
          return;
        }
        if (target?.startsWith("/products/")) {
          router.back();
          return;
        }
        router.push("/products");
      }}
    >
      {label}
    </Button>
  );
}
