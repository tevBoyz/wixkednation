"use client";

import Image from "next/image";
import { useState } from "react";

import {
  canOptimizeCatalogImage,
  getCatalogImageSizes,
} from "@/lib/catalog/catalog-image-url";
import { cn } from "@/lib/utils";

type CatalogImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Hint for next/image sizes attribute */
  variant?: "card" | "detail" | "thumb";
  priority?: boolean;
};

function isLocalApiSrc(src: string): boolean {
  try {
    const host = new URL(src).hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host === "0.0.0.0"
    );
  } catch {
    return false;
  }
}

/** Catalog image with broken-URL fallback; uses next/image when the host is allowlisted. */
export function CatalogImage({
  src,
  alt,
  className,
  imgClassName,
  variant = "card",
  priority = false,
}: CatalogImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolvedSrc = src?.trim() || null;
  const showImage = Boolean(resolvedSrc) && resolvedSrc !== failedSrc;
  const optimize =
    Boolean(resolvedSrc) && canOptimizeCatalogImage(resolvedSrc);
  // Local API hosts: keep next/image `fill` layout but skip the optimizer
  // (Next 16 SSRF guard blocks localhost unless dangerouslyAllowLocalIP).
  const useNextImage =
    Boolean(resolvedSrc) && (optimize || isLocalApiSrc(resolvedSrc!));

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {showImage ? (
        useNextImage ? (
          <Image
            src={resolvedSrc!}
            alt={alt}
            fill
            unoptimized={!optimize}
            sizes={getCatalogImageSizes(variant)}
            priority={priority}
            className={cn("object-cover", imgClassName)}
            onError={() => setFailedSrc(resolvedSrc)}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- fallback for non-allowlisted hosts
          <img
            src={resolvedSrc!}
            alt={alt}
            className={cn("size-full object-cover", imgClassName)}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            onError={() => setFailedSrc(resolvedSrc)}
          />
        )
      ) : (
        <div className="flex size-full min-h-24 items-center justify-center text-xs text-muted-foreground">
          No image
        </div>
      )}
    </div>
  );
}
