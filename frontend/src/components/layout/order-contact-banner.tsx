"use client";

import { useOrderContactPhones } from "@/components/providers/store-config-provider";
import { phoneTelHref } from "@/lib/phone";
import { cn } from "@/lib/utils";

const OPEN_HOURS_LABEL = "10:00 AM – 10:00 PM";

type OrderPhone = { id: string; phone: string };

function PhoneLinks({
  phones,
  className,
  separator = " / ",
}: {
  phones: OrderPhone[];
  className?: string;
  separator?: string;
}) {
  return (
    <>
      {phones.map((entry, index) => (
        <span key={entry.id} className="whitespace-nowrap">
          {index > 0 ? (
            <span className="text-muted-foreground" aria-hidden>
              {separator}
            </span>
          ) : null}
          <a
            href={phoneTelHref(entry.phone)}
            className={cn(
              "underline decoration-white/25 underline-offset-4 transition-colors hover:decoration-current",
              className,
            )}
          >
            {entry.phone}
          </a>
        </span>
      ))}
    </>
  );
}

/**
 * Order phones + hours from store config.
 * - masthead: stacked block on the left of the desktop masthead
 * - line: one static line (phones · hours) for small screens
 * - panel: labelled rows, used inside the homepage dispatch panel
 */
export function OrderContactBanner({
  placement = "line",
  className,
}: {
  placement?: "masthead" | "line" | "panel";
  className?: string;
}) {
  const phones = useOrderContactPhones();

  if (placement === "masthead") {
    return (
      <div className={cn("min-w-0", className)}>
        <p className="flex items-center gap-2 text-xs leading-4 font-medium text-foreground xl:text-sm">
          <span className="size-1.5 shrink-0 rounded-full bg-[#7dff3c]" aria-hidden />
          <span className="whitespace-nowrap">Open daily {OPEN_HOURS_LABEL}</span>
        </p>
        <p className="text-xs leading-4 text-muted-foreground xl:text-sm">
          {phones.length > 0 ? (
            <>
              Call or text{" "}
              <PhoneLinks phones={phones} className="text-foreground" />
            </>
          ) : (
            "Call or text to order"
          )}
        </p>
      </div>
    );
  }

  if (placement === "panel") {
    return (
      <dl className={cn("grid gap-3 text-sm", className)}>
        <div className="flex items-baseline gap-3">
          <dt className="shrink-0 text-xs text-muted-foreground">Hours</dt>
          <span className="wn-leader" aria-hidden />
          <dd className="text-foreground">{OPEN_HOURS_LABEL}</dd>
        </div>
        <div className="flex items-baseline gap-3">
          <dt className="shrink-0 text-xs text-muted-foreground">Call / text</dt>
          <span className="wn-leader" aria-hidden />
          <dd className="text-right text-foreground">
            {phones.length > 0 ? (
              <PhoneLinks phones={phones} className="text-primary" />
            ) : (
              <span className="text-muted-foreground">See store desk</span>
            )}
          </dd>
        </div>
      </dl>
    );
  }

  return (
    <div className={cn("text-center", className)}>
      <p className="text-xs leading-4 text-foreground sm:text-sm">
        <span className="text-muted-foreground">Open daily </span>
        <span className="whitespace-nowrap">{OPEN_HOURS_LABEL}</span>
      </p>
      <p className="text-xs leading-4 sm:text-sm">
        {phones.length > 0 ? (
          <>
            <span className="text-muted-foreground">Call or text </span>
            <PhoneLinks phones={phones} className="text-foreground" />
          </>
        ) : (
          <span className="text-muted-foreground">Call or text to order</span>
        )}
      </p>
    </div>
  );
}
