"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PromoBannerSlideView = {
  title: string;
  subtitle?: string | null;
  productName: string;
  salePrice: number | string;
  compareAtPrice: number | string;
  imageUrl?: string | null;
  imageMode: "composed" | "uploaded";
  skuLabel?: string | null;
};

function toMoneyNumber(value: number | string) {
  return typeof value === "number" ? value : Number.parseFloat(value);
}

function formatMoney(value: number | string) {
  const n = toMoneyNumber(value);
  if (!Number.isFinite(n)) {
    return String(value);
  }
  return `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
}

function discountPercent(sale: number | string, compare: number | string) {
  const s = toMoneyNumber(sale);
  const c = toMoneyNumber(compare);
  if (!Number.isFinite(s) || !Number.isFinite(c) || c <= 0 || s >= c) {
    return null;
  }
  return Math.round(((c - s) / c) * 100);
}

type PromoBannerSlideProps = {
  banner: PromoBannerSlideView;
  className?: string;
  action?: ReactNode;
  compact?: boolean;
  animationKey?: string | number;
  animate?: boolean;
};

export function PromoBannerSlide({
  banner,
  className,
  action,
  compact = false,
  animationKey,
  animate = false,
}: PromoBannerSlideProps) {
  const imageUrl = banner.imageUrl || null;
  const motion = animate && !compact;
  const off = discountPercent(banner.salePrice, banner.compareAtPrice);

  if (banner.imageMode === "uploaded" && imageUrl) {
    return (
      <div
        key={animationKey}
        className={cn(
          "relative w-full overflow-hidden",
          compact
            ? "min-h-[12rem] rounded-2xl border border-border"
            : "min-h-[min(68vh,34rem)] sm:min-h-[min(72vh,38rem)]",
          motion && "animate-promo-slide-in",
          className,
        )}
      >
        <div className="absolute inset-0">
          <Image
            src={imageUrl}
            alt={banner.title}
            fill
            priority={!compact}
            className={cn("object-cover", motion && "animate-promo-image-ken")}
            sizes="100vw"
            unoptimized={
              imageUrl.startsWith("http") || imageUrl.startsWith("blob:")
            }
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </div>
        <div className="relative z-10 mx-auto flex min-h-[inherit] w-full max-w-screen-2xl flex-col justify-end gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-16">
          <div
            className={cn(
              "max-w-xl text-white",
              motion && "animate-promo-copy-in",
            )}
          >
            {off != null ? (
              <span className="wn-neon-fill mb-3 inline-flex px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase">
                {off}% OFF
              </span>
            ) : null}
            <h2 className="text-4xl font-semibold sm:text-6xl">
              {banner.title}
            </h2>
            {banner.subtitle ? (
              <p className="mt-3 text-lg text-white/90">{banner.subtitle}</p>
            ) : null}
            <p className="mt-4 text-lg font-medium">{banner.productName}</p>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-5xl font-semibold text-primary">
                {formatMoney(banner.salePrice)}
              </span>
              <span className="text-lg text-white/60 line-through">
                {formatMoney(banner.compareAtPrice)}
              </span>
            </div>
            {action ? <div className="mt-8">{action}</div> : null}
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-border bg-[#0b0e0c]",
          className,
        )}
      >
        <div className="grid items-center gap-4 p-4 sm:grid-cols-[1fr_9rem]">
          <div className="min-w-0">
            <p className="text-2xl font-semibold">{banner.title}</p>
            {banner.subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {banner.subtitle}
              </p>
            ) : null}
            <p className="mt-2 font-medium">{banner.productName}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {formatMoney(banner.salePrice)}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                {formatMoney(banner.compareAtPrice)}
              </span>
            </div>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-xl bg-black">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={banner.productName}
                fill
                className="object-cover"
                sizes="160px"
                unoptimized={
                  imageUrl.startsWith("http") || imageUrl.startsWith("blob:")
                }
              />
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key={animationKey}
      className={cn(
        "relative w-full overflow-hidden bg-[#0b0e0c]",
        motion && "animate-promo-slide-in",
        className,
      )}
    >
      <div className="grid min-w-0 md:grid-cols-[minmax(12rem,20rem)_minmax(0,1fr)_minmax(12rem,16rem)]">
        {/* Photo */}
        <div className="relative aspect-[4/3] border-b border-white/10 md:aspect-auto md:min-h-[20rem] md:border-r md:border-b-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={banner.productName}
              fill
              priority
              className={cn("object-cover", motion && "animate-promo-image-ken")}
              sizes="(max-width: 768px) 100vw, 320px"
              unoptimized={
                imageUrl.startsWith("http") || imageUrl.startsWith("blob:")
              }
            />
          ) : (
            <div className="flex h-full min-h-[12rem] items-center justify-center text-sm text-muted-foreground">
              Product photo
            </div>
          )}
        </div>

        {/* Copy */}
        <div
          className={cn(
            "flex min-w-0 flex-col justify-center gap-3 px-6 py-8 sm:px-8",
            motion && "animate-promo-copy-in",
          )}
        >
          <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            {banner.title}
          </h2>
          {banner.subtitle ? (
            <p className="max-w-lg text-base text-muted-foreground">
              {banner.subtitle}
            </p>
          ) : null}
          <p className="text-lg font-medium text-foreground">
            {banner.productName}
            {banner.skuLabel ? (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {banner.skuLabel}
              </span>
            ) : null}
          </p>
        </div>

        {/* Price stub */}
        <div className="relative flex flex-col justify-center gap-4 border-t border-dashed border-white/20 px-6 py-8 md:border-t-0 md:border-l">
          {off != null ? (
            <span className="wn-neon-fill inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold tracking-[0.12em] uppercase">
              Save {off}%
            </span>
          ) : null}
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-semibold tracking-tight text-primary">
              {formatMoney(banner.salePrice)}
            </span>
            <span className="text-lg text-muted-foreground line-through">
              {formatMoney(banner.compareAtPrice)}
            </span>
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
