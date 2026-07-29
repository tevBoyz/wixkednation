"use client";

import { useState } from "react";

import { CatalogImage } from "@/components/catalog/catalog-image";
import { getProductCoverUrl } from "@/lib/catalog/format";
import type { ProductImage } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  images: ProductImage[];
  coverImageIndex?: number | null;
  productName: string;
};

export function ProductGallery({
  images,
  coverImageIndex = 0,
  productName,
}: ProductGalleryProps) {
  const safeIndex = images.length
    ? Math.min(Math.max(coverImageIndex ?? 0, 0), images.length - 1)
    : 0;
  const [activeIndex, setActiveIndex] = useState(safeIndex);

  if (!images.length) {
    return (
      <CatalogImage
        src={getProductCoverUrl({ images: [], coverImageIndex: 0 })}
        alt={productName}
        className="aspect-square w-full rounded-lg border border-border"
      />
    );
  }

  const active = images[activeIndex];

  return (
    <div className="space-y-3">
      <CatalogImage
        src={active?.url}
        alt={productName}
        variant="detail"
        priority
        className="aspect-square w-full rounded-lg border border-border"
      />
      {images.length > 1 ? (
        <ul className="flex flex-wrap gap-2">
          {images.map((image, index) => (
            <li key={image.id || `${image.url}-${index}`}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "size-16 overflow-hidden rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  index === activeIndex
                    ? "border-foreground"
                    : "border-border hover:border-foreground/40",
                )}
                aria-label={`View image ${index + 1}`}
                aria-pressed={index === activeIndex}
              >
                <CatalogImage
                  src={image.url}
                  alt=""
                  variant="thumb"
                  className="size-full"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
