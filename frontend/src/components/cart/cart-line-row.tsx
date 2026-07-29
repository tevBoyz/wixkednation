"use client";

import Link from "next/link";
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { CatalogImage } from "@/components/catalog/catalog-image";
import { useCart, type CartLine } from "@/components/providers/cart-provider";
import { useFormatPrice } from "@/components/providers/store-config-provider";
import { Button } from "@/components/ui/button";
import { formatVolumeUnit } from "@/lib/catalog/format";

type CartLineRowProps = {
  line: CartLine;
};

export function CartLineRow({ line }: CartLineRowProps) {
  const formatPrice = useFormatPrice();
  const { setQuantity, removeItem } = useCart();
  const packLabel = formatVolumeUnit(line.volume, line.measurementUnit);
  const totalVolumeLabel = formatVolumeUnit(
    line.effectiveVolume,
    line.measurementUnit,
  );
  const href = line.slug ? `/products/${line.slug}` : "/products";

  return (
    <li className="flex gap-4 border-b border-border py-4 last:border-b-0">
      <Link href={href} className="shrink-0">
        <CatalogImage
          src={line.image}
          alt=""
          className="size-20 rounded-md border border-border sm:size-24"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={href}
              className="block truncate font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {line.name}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatPrice(line.price)}
              {packLabel ? ` / ${packLabel}` : null}
            </p>
            {totalVolumeLabel ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Total {totalVolumeLabel}
              </p>
            ) : null}
          </div>
          <p className="shrink-0 text-sm font-medium">
            {formatPrice(line.lineTotal)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-md border border-border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-none"
              aria-label={`Decrease quantity of ${line.name}`}
              onClick={() => void setQuantity(line.key, line.quantity - 1)}
            >
              <MinusIcon className="size-3.5" />
            </Button>
            <span className="min-w-8 px-1 text-center text-sm tabular-nums">
              {line.quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-none"
              aria-label={`Increase quantity of ${line.name}`}
              onClick={() => void setQuantity(line.key, line.quantity + 1)}
            >
              <PlusIcon className="size-3.5" />
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => void removeItem(line.key)}
          >
            <Trash2Icon className="size-3.5" />
            Remove
          </Button>
        </div>
      </div>
    </li>
  );
}
