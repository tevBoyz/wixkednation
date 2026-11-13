"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const REGIONS = [
  "Columbus",
  "Cleveland",
  "Cincinnati",
  "Toledo",
  "Akron",
  "Dayton",
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
    <div className={cn("flex items-center gap-4", className)}>
      <span className="relative flex size-3 shrink-0" aria-hidden>
        <span
          className={cn(
            "absolute inset-0 rounded-full bg-[#7dff3c]/50",
            !reduceMotion && "animate-ping",
          )}
        />
        <span className="relative size-3 rounded-full bg-[#7dff3c]" />
      </span>
      <p className="min-w-0 text-foreground">
        <span className="block font-semibold tracking-tight" aria-live="polite">
          <span
            key={index}
            className={cn(
              "inline-block text-primary",
              !reduceMotion && "hero-region-rotator-animate",
            )}
          >
            {REGIONS[index]}
          </span>
        </span>
      </p>
    </div>
  );
}
