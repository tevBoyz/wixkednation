"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  PromoBannerSlide,
  type PromoBannerSlideView,
} from "@/components/catalog/promo-banner-slide";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { formatSkuLabel } from "@/lib/catalog/format";
import { getErrorMessage } from "@/lib/api/errors";
import type { PromoBanner } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const ROTATE_MS = 10_000;

function toSlideView(banner: PromoBanner): PromoBannerSlideView {
  const skuLabel = banner.sku
    ? formatSkuLabel({
        label: banner.sku.label,
        volume: banner.sku.volume,
        measurementUnit: banner.sku.measurementUnit,
      })
    : null;

  return {
    title: banner.title,
    subtitle: banner.subtitle,
    productName: banner.product?.name || "Product",
    salePrice: banner.salePrice,
    compareAtPrice: banner.compareAtPrice,
    imageUrl: banner.imageUrl || banner.product?.coverImageUrl || null,
    imageMode: banner.imageMode === "uploaded" ? "uploaded" : "composed",
    skuLabel,
  };
}

type PromoBannerCarouselProps = {
  banners: PromoBanner[];
  className?: string;
};

export function PromoBannerCarousel({
  banners,
  className,
}: PromoBannerCarouselProps) {
  const { addItem } = useCart();
  const [index, setIndex] = useState(0);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const lengthRef = useRef(banners.length);
  lengthRef.current = banners.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Always rotate when multiple banners exist (hover must not block — banner is full-bleed).
  useEffect(() => {
    if (banners.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => {
        const len = lengthRef.current;
        if (len <= 1) {
          return 0;
        }
        return (current + 1) % len;
      });
      setProgressKey((key) => key + 1);
    }, ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    if (index >= banners.length) {
      setIndex(0);
    }
  }, [banners.length, index]);

  const goTo = useCallback((next: number) => {
    setIndex(next);
    setProgressKey((key) => key + 1);
  }, []);

  const active = banners[index] ?? banners[0];

  const onAdd = useCallback(async () => {
    if (!active?.product || !active.sku) {
      toast.error("This deal is unavailable.");
      return;
    }
    setPendingId(active.id);
    try {
      await addItem({
        productId: active.productId,
        skuId: active.skuId,
        name: active.product.name,
        image: active.imageUrl || active.product.coverImageUrl || null,
        quantity: 1,
        volume: active.sku.volume,
        measurementUnit: active.sku.measurementUnit,
        price: active.salePrice,
        skuLabel: formatSkuLabel({
          label: active.sku.label,
          volume: active.sku.volume,
          measurementUnit: active.sku.measurementUnit,
        }),
        slug: active.product.slug,
      });
      toast.success("Added to cart");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not add to cart"));
    } finally {
      setPendingId(null);
    }
  }, [active, addItem]);

  if (!active) {
    return null;
  }

  return (
    <section
      className={cn("relative w-full", className)}
      aria-roledescription="carousel"
      aria-label="Sale and happy hour deals"
    >
      <PromoBannerSlide
        key={active.id}
        animationKey={`${active.id}-${progressKey}`}
        animate={!reduceMotion}
        banner={toSlideView(active)}
        action={
          <Button
            type="button"
            size="lg"
            className="h-11 w-full px-6 text-sm font-semibold"
            disabled={pendingId === active.id}
            onClick={() => void onAdd()}
          >
            {pendingId === active.id ? "Adding…" : "Add to cart"}
          </Button>
        }
      />

      {banners.length > 1 ? (
        <div className="border-t border-white/10">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="pointer-events-auto flex items-center gap-2">
              {banners.map((banner, i) => (
                <button
                  key={banner.id}
                  type="button"
                  aria-label={`Show deal ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-300",
                    i === index
                      ? "w-8 bg-white"
                      : "w-2.5 bg-white/45 hover:bg-white/70",
                  )}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
            {!reduceMotion ? (
              <div className="h-1 w-28 overflow-hidden rounded-full bg-white/25 sm:w-40">
                <div
                  key={progressKey}
                  className="h-full w-full origin-left rounded-full bg-white animate-promo-progress"
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
