import Image from "next/image";
import Link from "next/link";

import { WixkedNationMark } from "@/components/brand/wixkednation-mark";
import { SITE_NAME } from "@/config/brand";
import { cn } from "@/lib/utils";

type WixkedNationLogoProps = {
  className?: string;
  markClassName?: string;
  /** Show animated mark (loader / intro). */
  animated?: boolean;
  /** Render as a home link. */
  asLink?: boolean;
  /**
   * full = mark + wordmark,
   * mark = icon only,
   * wordmark = text only,
   * stacked = official full artwork (loader / splash)
   */
  variant?: "full" | "mark" | "wordmark" | "stacked";
  size?: "sm" | "md" | "lg";
  priority?: boolean;
};

const sizeMap = {
  sm: { mark: "size-8", markPx: 32, text: "text-sm", gap: "gap-2", stackedW: 120 },
  md: { mark: "size-10", markPx: 40, text: "text-base", gap: "gap-2.5", stackedW: 160 },
  lg: { mark: "size-12", markPx: 48, text: "text-xl", gap: "gap-3", stackedW: 200 },
} as const;

export function WixkedNationLogo({
  className,
  markClassName,
  animated = false,
  asLink = false,
  variant = "full",
  size = "md",
  priority = false,
}: WixkedNationLogoProps) {
  const sizing = sizeMap[size];

  const content =
    variant === "stacked" ? (
      <span
        className={cn(
          "relative inline-flex max-w-full items-center justify-center",
          animated && "gn-logo-stacked-pulse",
          className,
        )}
      >
        <Image
          src="/brand/wixkednation-logo-full.png"
          alt={SITE_NAME}
          width={sizing.stackedW}
          height={Math.round(sizing.stackedW * 0.92)}
          priority={priority}
          className="h-auto w-full max-w-full object-contain mix-blend-lighten"
        />
      </span>
    ) : (
      <span
        className={cn(
          "inline-flex min-w-0 max-w-full items-center",
          variant === "mark" ? "overflow-visible" : "overflow-hidden",
          variant !== "wordmark" && variant !== "mark" && sizing.gap,
          className,
        )}
      >
        {variant !== "wordmark" ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center justify-center",
              sizing.mark,
              markClassName,
            )}
          >
            <WixkedNationMark
              animated={animated}
              size={sizing.markPx}
              priority={priority}
              className="block size-full"
            />
          </span>
        ) : null}
        {variant !== "mark" ? (
          <span
            className={cn(
              "wn-word min-w-0 items-baseline truncate font-semibold leading-none tracking-tight",
              sizing.text,
              animated && "gn-wordmark",
            )}
            aria-label={SITE_NAME}
          >
            <span className="text-primary">Wixked</span>{" "}
            <span className="text-foreground">Nation</span>
          </span>
        ) : null}
      </span>
    );

  if (asLink) {
    return (
      <Link
        href="/"
        aria-label={variant === "mark" || variant === "stacked" ? SITE_NAME : undefined}
        className={cn(
          "inline-flex min-w-0 max-w-full items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          variant === "mark" || variant === "stacked" ? "overflow-visible" : "overflow-hidden",
        )}
      >
        {content}
      </Link>
    );
  }

  return content;
}
