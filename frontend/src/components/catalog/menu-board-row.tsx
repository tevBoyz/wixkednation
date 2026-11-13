"use client";

import Link from "next/link";

import { CatalogImage } from "@/components/catalog/catalog-image";
import { useStoreCurrency } from "@/components/providers/store-config-provider";
import type { Product } from "@/lib/api/types";
import {
  formatCannabinoidLine,
  formatPackPrice,
  getProductCoverUrl,
} from "@/lib/catalog/format";

/** One line on the homepage menu board: thumb, name, dotted leader, price. */
export function MenuBoardRow({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const currency = useStoreCurrency();
  const coverUrl = getProductCoverUrl(product);
  const cannabinoidLine = formatCannabinoidLine(product);
  const meta = [product.category?.name, product.strainType?.trim(), cannabinoidLine]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group grid grid-cols-[2rem_3.5rem_minmax(0,1fr)] items-center gap-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[2.25rem_4rem_minmax(0,1fr)] sm:gap-4"
    >
      <span className="text-xs tabular-nums text-muted-foreground">
        {String(index + 1).padStart(2, "0")}
      </span>
      <CatalogImage
        src={coverUrl}
        alt=""
        variant="thumb"
        className="aspect-square overflow-hidden rounded-md border border-white/10"
      />
      <span className="min-w-0">
        <span className="flex items-baseline gap-3">
          <span className="truncate text-base font-medium text-foreground group-hover:underline sm:text-lg">
            {product.name}
          </span>
          <span className="wn-leader hidden sm:block" aria-hidden />
          <span className="ml-auto shrink-0 text-sm font-semibold tabular-nums text-primary sm:ml-0 sm:text-base">
            {formatPackPrice(product, currency)}
          </span>
        </span>
        {meta ? (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground sm:text-sm">
            {meta}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
