import { LeafSvg } from "@/components/brand/leaf-svg";
import { cn } from "@/lib/utils";

type FloatingArtifactsProps = {
  className?: string;
};

function SprigSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("block size-full", className)}
    >
      <path
        d="M24 58V18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M24 42c-8-4-14-4-18-2 6-8 12-10 18-8"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M24 34c8-4 14-4 18-2-6-8-12-10-18-8"
        fill="currentColor"
        opacity="0.75"
      />
      <path
        d="M24 24c-6-4-11-5-15-4 5-6 10-8 15-6"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M24 18c6-3 10-4 14-3-4-5-9-7-14-5"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}

function BudOrbSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("block size-full", className)}
    >
      <circle cx="24" cy="24" r="14" fill="currentColor" opacity="0.35" />
      <circle cx="24" cy="24" r="9" fill="currentColor" opacity="0.55" />
      <circle cx="24" cy="24" r="4" fill="currentColor" />
      <path
        d="M24 8c7 4 11 10 12 16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

/** Soft rising smoke plume - green-tinted haze matching flower product vibe */
function SmokeWispSvg({
  className,
  gradId,
}: {
  className?: string;
  gradId: string;
}) {
  const fadeId = `${gradId}-fade`;
  const blurId = `${gradId}-blur`;
  return (
    <svg
      viewBox="0 0 80 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("block size-full", className)}
    >
      <defs>
        <linearGradient id={fadeId} x1="40" y1="120" x2="40" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="35%" stopColor="currentColor" stopOpacity="0.45" />
          <stop offset="70%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <filter id={blurId} x="-40%" y="-20%" width="180%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" />
        </filter>
      </defs>
      <g filter={`url(#${blurId})`} fill={`url(#${fadeId})`}>
        <path d="M38 118c-10-18-4-28 6-40 8-10 4-22-2-32 10 6 18 4 22-6-2 18-10 28-6 42 4 12-4 24-20 36Z" />
        <path
          d="M42 118c8-16 14-26 8-40-4-10 2-20 10-28-12 2-20 10-18 22 2 14-4 28-14 40 6 0 10 2 14 6Z"
          opacity="0.7"
        />
        <ellipse cx="44" cy="48" rx="14" ry="22" opacity="0.5" />
        <ellipse cx="32" cy="72" rx="10" ry="16" opacity="0.4" />
      </g>
    </svg>
  );
}

function SmokePuffSvg({
  className,
  gradId,
}: {
  className?: string;
  gradId: string;
}) {
  const puffId = `${gradId}-puff`;
  const blurId = `${gradId}-blur`;
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("block size-full", className)}
    >
      <defs>
        <radialGradient id={puffId} cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
          <stop offset="55%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <filter id={blurId}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
        </filter>
      </defs>
      <g filter={`url(#${blurId})`} fill={`url(#${puffId})`}>
        <circle cx="28" cy="34" r="16" />
        <circle cx="40" cy="28" r="12" />
        <circle cx="34" cy="22" r="10" />
        <circle cx="22" cy="26" r="9" />
      </g>
    </svg>
  );
}

const artifacts = [
  {
    key: "leaf-a",
    Svg: LeafSvg,
    className:
      "gn-float gn-float-a left-[-6%] top-[8%] size-32 text-primary/28 sm:left-[0%] sm:size-40 md:size-48",
  },
  {
    key: "sprig-a",
    Svg: SprigSvg,
    className:
      "gn-float gn-float-b right-[-4%] top-[10%] size-24 text-primary/22 sm:right-[2%] sm:size-28 md:size-32",
  },
  {
    key: "orb-a",
    Svg: BudOrbSvg,
    className:
      "gn-float gn-float-c left-[8%] bottom-[16%] size-16 text-primary/20 sm:left-[12%] sm:size-20",
  },
  {
    key: "leaf-b",
    Svg: LeafSvg,
    className:
      "gn-float gn-float-d right-[2%] bottom-[8%] hidden size-28 rotate-[-28deg] text-primary/20 sm:block md:right-[6%] md:size-36",
  },
  {
    key: "orb-b",
    Svg: BudOrbSvg,
    className:
      "gn-float gn-float-e left-[46%] top-[6%] size-12 text-primary/16 sm:size-14",
  },
  {
    key: "sprig-b",
    Svg: SprigSvg,
    className:
      "gn-float gn-float-f left-[1%] top-[44%] hidden size-20 rotate-[18deg] text-primary/16 md:block",
  },
  {
    key: "leaf-c",
    Svg: LeafSvg,
    className:
      "gn-float gn-float-g right-[1%] top-[48%] hidden size-24 rotate-[22deg] text-primary/16 lg:block",
  },
] as const;

type SmokeItem = {
  key: string;
  kind: "wisp" | "puff";
  className: string;
};

const smoke: SmokeItem[] = [
  {
    key: "smoke-a",
    kind: "wisp",
    className:
      "gn-smoke gn-smoke-a left-[12%] bottom-[-4%] h-56 w-28 text-primary/35 sm:h-72 sm:w-36",
  },
  {
    key: "smoke-b",
    kind: "wisp",
    className:
      "gn-smoke gn-smoke-b right-[10%] bottom-[-8%] h-64 w-32 text-emerald-800/25 sm:h-80 sm:w-40 dark:text-emerald-300/20",
  },
  {
    key: "smoke-c",
    kind: "wisp",
    className:
      "gn-smoke gn-smoke-c left-[42%] bottom-[-2%] hidden h-52 w-24 text-primary/22 md:block",
  },
  {
    key: "puff-a",
    kind: "puff",
    className:
      "gn-smoke gn-smoke-d left-[28%] bottom-[8%] size-28 text-muted-foreground/30 sm:size-36",
  },
  {
    key: "puff-b",
    kind: "puff",
    className:
      "gn-smoke gn-smoke-e right-[22%] bottom-[14%] size-24 text-primary/20 sm:size-32",
  },
  {
    key: "puff-c",
    kind: "puff",
    className:
      "gn-smoke gn-smoke-f left-[58%] bottom-[4%] hidden size-20 text-muted-foreground/25 lg:block",
  },
  {
    key: "smoke-d",
    kind: "wisp",
    className:
      "gn-smoke gn-smoke-g left-[70%] bottom-[-6%] hidden h-60 w-28 text-primary/18 xl:block",
  },
];

/**
 * Decorative floating botanical SVGs + rising smoke for site atmosphere.
 * Purely visual - pointer-events none, aria-hidden.
 */
export function FloatingArtifacts({ className }: FloatingArtifactsProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {smoke.map(({ key, kind, className: itemClass }) => (
        <div key={key} className={cn("absolute", itemClass)}>
          {kind === "wisp" ? (
            <SmokeWispSvg gradId={key} />
          ) : (
            <SmokePuffSvg gradId={key} />
          )}
        </div>
      ))}
      {artifacts.map(({ key, Svg, className: itemClass }) => (
        <div key={key} className={cn("absolute", itemClass)}>
          <Svg />
        </div>
      ))}
    </div>
  );
}
