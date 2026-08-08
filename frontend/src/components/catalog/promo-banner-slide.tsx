"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { LeafSvg } from "@/components/brand/leaf-svg";
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
  const marqueeBits = [
    banner.title,
    off ? `${off}% OFF` : "SALE",
    banner.productName,
    "HAPPY HOUR",
  ];

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
              <span className="mb-3 inline-flex rounded-full bg-[#7dffa8] px-3 py-1 text-xs font-bold tracking-wide text-[#0d3d24]">
                {off}% OFF
              </span>
            ) : null}
            <h2 className="font-serif text-4xl font-semibold sm:text-6xl">
              {banner.title}
            </h2>
            {banner.subtitle ? (
              <p className="mt-3 text-lg text-white/90">{banner.subtitle}</p>
            ) : null}
            <p className="mt-4 text-lg font-medium">{banner.productName}</p>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-5xl font-bold text-[#7dffa8]">
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
          "overflow-hidden rounded-2xl border border-border bg-[#eef7f1]",
          className,
        )}
      >
        <div className="grid items-center gap-4 p-4 sm:grid-cols-[1fr_9rem]">
          <div className="min-w-0">
            <p className="font-serif text-2xl font-semibold">{banner.title}</p>
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
          <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
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
        "relative w-full overflow-hidden bg-[#062416]",
        "min-h-[min(70vh,36rem)] sm:min-h-[min(74vh,40rem)]",
        motion && "animate-promo-slide-in",
        className,
      )}
    >
      {/* Atmospheric layers */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,#1a7a45_0%,transparent_55%),radial-gradient(ellipse_at_85%_20%,#0f5a32_0%,transparent_45%),linear-gradient(135deg,#04180e_0%,#0b3d24_45%,#148547_100%)]",
          motion && "animate-promo-gradient-drift",
        )}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.14] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#7dffa8]/25 blur-3xl",
          motion && "animate-promo-orb",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute bottom-[-4rem] right-[18%] h-80 w-80 rounded-full bg-[#148547]/50 blur-3xl",
          motion && "animate-promo-orb [animation-delay:1.5s]",
        )}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -left-2 top-16 h-44 w-44 text-white/25 sm:left-4 sm:top-20 sm:h-64 sm:w-64"
      >
        <LeafSvg />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-4 bottom-4 h-52 w-52 rotate-[160deg] text-white/18 sm:right-10 sm:h-72 sm:w-72"
      >
        <LeafSvg />
      </div>

      {/* Giant watermark */}
      {off != null ? (
        <p
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2 select-none font-serif text-[clamp(8rem,28vw,22rem)] font-bold leading-none text-white/[0.07]",
            motion && "animate-promo-copy-in",
          )}
        >
          {off}%
        </p>
      ) : null}

      {/* Top marquee */}
      <div className="relative z-20 overflow-hidden border-b border-white/10 bg-black/25 py-2 backdrop-blur-sm">
        <div
          className={cn(
            "flex w-max gap-10 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70",
            motion && "animate-promo-marquee",
          )}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex gap-10 px-5">
              {marqueeBits.map((bit, i) => (
                <span key={`${copy}-${i}`} className="flex items-center gap-10">
                  {bit}
                  <span className="inline-block h-1 w-1 rounded-full bg-[#7dffa8]" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100%-2.25rem)] w-full max-w-screen-2xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,42%)] lg:gap-6 lg:px-8 lg:py-14">
        <div
          className={cn(
            "relative z-10 min-w-0 text-white",
            motion && "animate-promo-copy-in",
          )}
        >
          {off != null ? (
            <div className="flex justify-start">
              <span
                className={cn(
                  "inline-flex -rotate-6 items-center rounded-md bg-[#7dffa8] px-3 py-1.5 text-sm font-black tracking-wide text-[#062416] shadow-[0_10px_30px_rgba(125,255,168,0.35)]",
                  motion && "animate-promo-badge-pop",
                )}
              >
                {off}% OFF
              </span>
            </div>
          ) : null}

          <h2 className="mt-5 max-w-[14ch] font-serif text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
            {banner.title}
          </h2>

          {banner.subtitle ? (
            <p
              className={cn(
                "mt-5 max-w-lg text-lg text-white/85 sm:text-xl",
                motion && "animate-promo-copy-in [animation-delay:90ms]",
              )}
            >
              {banner.subtitle}
            </p>
          ) : null}

          <div
            className={cn(
              "mt-7 flex flex-wrap items-baseline gap-x-4 gap-y-2",
              motion && "animate-promo-copy-in [animation-delay:150ms]",
            )}
          >
            <p
              className={cn(
                "text-5xl font-black tracking-tight text-[#7dffa8] sm:text-6xl",
                motion && "animate-promo-price-pulse",
              )}
            >
              {formatMoney(banner.salePrice)}
            </p>
            <p className="text-2xl text-white/45 line-through">
              {formatMoney(banner.compareAtPrice)}
            </p>
          </div>

          <div
            className={cn(
              "mt-5",
              motion && "animate-promo-copy-in [animation-delay:210ms]",
            )}
          >
            <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {banner.productName}
            </p>
            {banner.skuLabel ? (
              <p className="mt-1 text-sm text-white/65">{banner.skuLabel}</p>
            ) : null}
          </div>

          {action ? (
            <div
              className={cn(
                "mt-8",
                motion && "animate-promo-copy-in [animation-delay:280ms]",
              )}
            >
              {action}
            </div>
          ) : null}
        </div>

        {/* Product stage — fills, floats, no letterbox */}
        <div
          className={cn(
            "relative mx-auto w-full max-w-lg lg:max-w-none",
            motion && "animate-promo-copy-in [animation-delay:120ms]",
          )}
        >
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute left-1/2 top-1/2 h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/20",
              motion && "animate-promo-ring-spin",
            )}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[90%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7dffa8]/10 blur-2xl"
          />

          <div
            className={cn(
              "relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-[0_30px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/30 sm:aspect-square lg:aspect-[5/6]",
              motion && "animate-promo-float-tilt",
            )}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={banner.productName}
                fill
                priority
                className={cn(
                  "object-cover",
                  motion && "animate-promo-image-ken",
                )}
                sizes="(max-width: 1024px) 90vw, 480px"
                unoptimized={
                  imageUrl.startsWith("http") || imageUrl.startsWith("blob:")
                }
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-white/10 text-sm text-white/70">
                Product photo
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            {off != null ? (
              <span className="absolute right-4 top-4 rounded-full bg-[#062416]/80 px-3 py-1 text-xs font-bold tracking-wide text-[#7dffa8] backdrop-blur-sm">
                Save {off}%
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
