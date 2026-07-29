"use client";

import type { CSSProperties } from "react";

import { useOrderContactPhones } from "@/components/providers/store-config-provider";
import { phoneTelHref } from "@/lib/phone";

/** Enough copies so the strip always fills wide viewports with no gap. */
const MARQUEE_COPIES = 6;

const OPEN_HOURS_LABEL = "Open from 10 AM to 10 PM";

function BannerMessage({ phones }: { phones: { id: string; phone: string }[] }) {
  return (
    <>
      {phones.length > 0 ? (
        <>
          Call or Text{" "}
          {phones.map((entry, index) => (
            <span key={entry.id} className="whitespace-nowrap">
              {index > 0 ? <span className="text-white/80"> · </span> : null}
              <a
                href={phoneTelHref(entry.phone)}
                className="font-bold text-white underline decoration-white/60 underline-offset-2 transition-colors hover:decoration-white"
              >
                {entry.phone}
              </a>
            </span>
          ))}{" "}
          for orders
          <span className="mx-3 inline-block text-white/50" aria-hidden>
            |
          </span>
        </>
      ) : null}
      <span className="whitespace-nowrap rounded-sm bg-white/20 px-2.5 py-0.5 font-extrabold tracking-wide text-white uppercase shadow-sm ring-1 ring-white/35">
        {OPEN_HOURS_LABEL}
      </span>
    </>
  );
}

/**
 * Primary strip under the nav: order phones + open hours.
 * Seamless looping marquee.
 */
export function OrderContactBanner() {
  const phones = useOrderContactPhones();

  return (
    <div className="border-b border-white/15 bg-primary">
      {/* Static for reduced motion */}
      <div className="hidden px-4 py-2.5 text-center text-sm font-bold tracking-wide text-white motion-reduce:block sm:py-3 sm:text-base">
        <p>
          <BannerMessage phones={phones} />
        </p>
      </div>

      {/* Continuous marquee */}
      <div className="relative overflow-hidden py-2.5 motion-reduce:hidden sm:py-3">
        <div
          className="flex w-max animate-order-banner-marquee hover:[animation-play-state:paused]"
          style={
            {
              "--order-banner-copies": String(MARQUEE_COPIES),
            } as CSSProperties
          }
        >
          {Array.from({ length: MARQUEE_COPIES }, (_, copyIndex) => (
            <p
              key={copyIndex}
              className="shrink-0 px-10 text-sm font-bold tracking-wide text-white sm:px-14 sm:text-base"
              aria-hidden={copyIndex > 0 ? true : undefined}
            >
              <BannerMessage phones={phones} />
              <span className="mx-10 text-white/45" aria-hidden>
                •
              </span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
