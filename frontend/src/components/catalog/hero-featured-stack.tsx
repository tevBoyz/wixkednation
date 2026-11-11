"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CatalogImage } from "@/components/catalog/catalog-image";
import { cn } from "@/lib/utils";

export type HeroStackItem = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
};

type HeroFeaturedStackProps = {
  items: HeroStackItem[];
  className?: string;
};

const STACK_SIZE = 3;
const STACK_COUNT = 3;
const CYCLE_MS = 12_000;
const DEAL_STAGGER_MS = 500;
const DEAL_DURATION_MS = 560;
const DEAL_TOTAL_MS = DEAL_DURATION_MS + DEAL_STAGGER_MS * (STACK_SIZE - 1) + 60;

/** Always build exactly STACK_COUNT stacks of STACK_SIZE cards (wrap items as needed). */
function buildStacks(items: HeroStackItem[]): HeroStackItem[][] {
  if (items.length === 0) {
    return [];
  }

  const stacks: HeroStackItem[][] = [];
  for (let stackIndex = 0; stackIndex < STACK_COUNT; stackIndex += 1) {
    const stack: HeroStackItem[] = [];
    for (let offset = 0; offset < STACK_SIZE; offset += 1) {
      stack.push(items[(stackIndex * STACK_SIZE + offset) % items.length]!);
    }
    stacks.push(stack);
  }
  return stacks;
}

const restTransformsDesktop = [
  "translate(-28%, -14%) rotate(-12deg)",
  "translate(0%, 4%) rotate(1deg)",
  "translate(28%, 16%) rotate(12deg)",
] as const;

const hoverTransformsDesktop = [
  "translate(-42%, -22%) rotate(-16deg) scale(1.04)",
  "translate(0%, -18%) rotate(0deg) scale(1.06)",
  "translate(42%, 6%) rotate(16deg) scale(1.04)",
] as const;

const restTransformsMobile = [
  "translate(-10%, -8%) rotate(-8deg)",
  "translate(0%, 2%) rotate(1deg)",
  "translate(10%, 10%) rotate(8deg)",
] as const;

const hoverTransformsMobile = [
  "translate(-16%, -12%) rotate(-10deg) scale(1.03)",
  "translate(0%, -8%) rotate(0deg) scale(1.04)",
  "translate(16%, 6%) rotate(10deg) scale(1.03)",
] as const;

const dealAnimationClass = [
  "animate-hero-deal-0",
  "animate-hero-deal-1",
  "animate-hero-deal-2",
] as const;

export function HeroFeaturedStack({ items, className }: HeroFeaturedStackProps) {
  const stacks = useMemo(() => buildStacks(items), [items]);
  const [stackIndex, setStackIndex] = useState(0);
  const [dealEpoch, setDealEpoch] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focusedCard, setFocusedCard] = useState<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [isDealing, setIsDealing] = useState(true);

  const changeStack = useCallback(
    (nextIndex: number) => {
      if (stacks.length <= 1) {
        return;
      }
      const normalized =
        ((nextIndex % stacks.length) + stacks.length) % stacks.length;
      setFocusedCard(null);
      setHovered(false);
      setIsDealing(true);
      setStackIndex(normalized);
      setDealEpoch((epoch) => epoch + 1);
      window.setTimeout(() => setIsDealing(false), DEAL_TOTAL_MS);
    },
    [stacks.length],
  );

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 1023px)");
    const syncReduced = () => setPrefersReducedMotion(reduced.matches);
    const syncNarrow = () => setIsNarrow(narrow.matches);
    syncReduced();
    syncNarrow();
    reduced.addEventListener("change", syncReduced);
    narrow.addEventListener("change", syncNarrow);
    return () => {
      reduced.removeEventListener("change", syncReduced);
      narrow.removeEventListener("change", syncNarrow);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      const id = window.setTimeout(() => setIsDealing(false), 0);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setIsDealing(false), DEAL_TOTAL_MS);
    return () => window.clearTimeout(id);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (stacks.length <= 1 || hovered || isDealing || prefersReducedMotion) {
      return;
    }

    const id = window.setInterval(() => {
      setFocusedCard(null);
      setIsDealing(true);
      setStackIndex((current) => (current + 1) % stacks.length);
      setDealEpoch((epoch) => epoch + 1);
      window.setTimeout(() => setIsDealing(false), DEAL_TOTAL_MS);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [hovered, isDealing, prefersReducedMotion, stacks.length]);

  if (stacks.length === 0) {
    return null;
  }

  const activeStack = stacks[stackIndex] ?? stacks[0]!;
  const allowHover = hovered && !isDealing;
  const restTransforms = isNarrow ? restTransformsMobile : restTransformsDesktop;
  const hoverTransforms = isNarrow
    ? hoverTransformsMobile
    : hoverTransformsDesktop;

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[min(100%,20rem)] overflow-x-clip pb-10 sm:max-w-[24rem] md:max-w-[28rem] lg:max-w-[34rem] lg:overflow-visible lg:pb-12 xl:max-w-[36rem]",
        "aspect-square",
        className,
      )}
      onMouseEnter={() => {
        if (!isDealing) {
          setHovered(true);
        }
      }}
      onMouseLeave={() => {
        setHovered(false);
        setFocusedCard(null);
        if (stacks.length > 1 && !isDealing) {
          changeStack(stackIndex + 1);
        }
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured product images"
    >
      <div
        className="absolute inset-[8%] overflow-visible sm:inset-[10%] lg:inset-[12%]"
        aria-live="polite"
      >
        {activeStack.map((item, index) => {
          const isFocused = allowHover && focusedCard === index;
          const transform = isFocused
            ? `${hoverTransforms[index]} translateY(-6%) scale(1.08)`
            : allowHover
              ? hoverTransforms[index]!
              : restTransforms[index]!;
          const z = isFocused ? 40 : 30 - index;
          const runDeal = !prefersReducedMotion && isDealing;

          return (
            <Link
              key={`${dealEpoch}-${item.id}-${index}`}
              href={`/products/${item.slug}`}
              className={cn(
                "absolute inset-[16%] overflow-hidden rounded-2xl border border-border bg-background shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inset-[14%] lg:inset-[12%]",
                isFocused && "shadow-xl",
                runDeal && dealAnimationClass[index],
                !runDeal &&
                  !prefersReducedMotion &&
                  "transition-transform duration-500 ease-out",
              )}
              style={{
                transform: runDeal ? undefined : transform,
                zIndex: z,
                animationDelay: runDeal
                  ? `${(STACK_SIZE - 1 - index) * DEAL_STAGGER_MS}ms`
                  : undefined,
              }}
              onMouseEnter={() => {
                if (!isDealing) {
                  setFocusedCard(index);
                }
              }}
              onMouseLeave={() => setFocusedCard(null)}
              onFocus={() => {
                if (!isDealing) {
                  setHovered(true);
                  setFocusedCard(index);
                }
              }}
              onBlur={() => setFocusedCard(null)}
            >
              <CatalogImage
                src={item.imageUrl}
                alt={item.name}
                className="size-full"
                priority={stackIndex === 0 && index === 0}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-3.5 pb-3.5 pt-14 sm:px-4 sm:pb-4 sm:pt-16">
                <p
                  className={cn(
                    "text-pretty text-base font-semibold leading-snug tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] sm:text-lg lg:text-xl",
                    "line-clamp-2",
                  )}
                >
                  {item.name}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {stacks.length > 1 ? (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1.5">
          {stacks.map((_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              aria-label={`Show featured set ${index + 1}`}
              aria-current={index === stackIndex}
              disabled={isDealing}
              className={cn(
                "size-1.5 rounded-full transition-colors disabled:opacity-40",
                index === stackIndex
                  ? "bg-foreground"
                  : "bg-foreground/25 hover:bg-foreground/50",
              )}
              onClick={() => changeStack(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
