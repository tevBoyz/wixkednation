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
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: Product;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  const currency = useStoreCurrency();
  const coverUrl = getProductCoverUrl(product);
  const cannabinoidLine = formatCannabinoidLine(product);
  const strainLabel = product.strainType?.trim() || null;
  const packLabel = formatPackPrice(product, currency);

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0b0e0c] transition-colors hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="relative">
        <CatalogImage src={coverUrl} alt="" className="aspect-square" />
        {strainLabel ? (
          <span className="absolute top-2 left-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
            {strainLabel}
          </span>
        ) : null}
      </div>

      <div className="wn-perf" aria-hidden />

      <div className="flex min-w-0 flex-1 flex-col gap-1 p-4">
        {product.category?.name ? (
          <p className="truncate text-xs leading-5 text-muted-foreground">
            {product.category.name}
          </p>
        ) : null}
        <h2 className="line-clamp-2 text-base font-semibold tracking-tight group-hover:underline">
          {product.name}
        </h2>
        <div className="mt-auto flex items-baseline justify-between gap-3 pt-2">
          <p className="text-sm font-semibold text-primary">{packLabel}</p>
          {cannabinoidLine ? (
            <p className="truncate text-xs leading-5 text-muted-foreground">
              {cannabinoidLine}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
