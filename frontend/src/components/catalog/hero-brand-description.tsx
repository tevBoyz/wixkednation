"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const REGIONS = [
  "North Virginia",
  "Washington DC",
  "South Maryland",
] as const;

const INTERVAL_MS = 2600;

type HeroBrandDescriptionProps = {
  className?: string;
};

export function HeroBrandDescription({ className }: HeroBrandDescriptionProps) {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % REGIONS.length);
    }, INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <p
      className={cn(
        "max-w-2xl text-pretty text-lg font-medium leading-snug tracking-tight text-foreground/90 sm:text-xl md:text-2xl",
        className,
      )}
    >
      Premium cannabis delivered in{" "}
      <span className="hero-region-rotator" aria-live="polite">
        <span
          key={index}
          className={cn(
            "hero-region-rotator-item font-bold text-primary",
            !reduceMotion && "hero-region-rotator-animate",
          )}
        >
          {REGIONS[index]}
        </span>
      </span>
    </p>
  );
}
