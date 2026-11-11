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
        "group flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-foreground/25 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <CatalogImage
        src={coverUrl}
        alt=""
        className="aspect-[4/3]"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
        {product.category?.name || strainLabel ? (
          <p className="truncate text-xs text-muted-foreground">
            {[product.category?.name, strainLabel].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        <h2 className="line-clamp-2 text-sm font-semibold tracking-tight group-hover:underline">
          {product.name}
        </h2>
        <p className="mt-auto text-sm font-medium">{packLabel}</p>
        {cannabinoidLine ? (
          <p className="text-xs text-muted-foreground">{cannabinoidLine}</p>
        ) : null}
      </div>
    </Link>
  );
}
