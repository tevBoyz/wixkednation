import { WixkedNationLogo } from "@/components/brand/wixkednation-logo";
import { cn } from "@/lib/utils";

type WixkedNationLoaderProps = {
  className?: string;
  /** fullscreen overlay vs inline block */
  variant?: "fullscreen" | "inline";
  message?: string;
};

/** Cities flipped on the split-flap board (first entry repeats for a seamless loop). */
const FLAP_CITIES = [
  "Columbus",
  "Cleveland",
  "Cincinnati",
  "Toledo",
  "Akron",
  "Dayton",
  "Columbus",
] as const;

const TICK_COUNT = 60;

/**
 * "Dispatch dial" loader: the lockup inside a ticked radar dial with a green
 * sweep and an orbiting driver dot, over a split-flap board of Ohio cities.
 * Pure CSS motion (see .wn-ld-* in globals.css); still under reduced motion.
 */
export function WixkedNationLoader({
  className,
  variant = "fullscreen",
  message,
}: WixkedNationLoaderProps) {
  const compact = variant === "inline";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "wn-ld flex w-full max-w-full flex-col items-center justify-center overflow-hidden bg-background px-4",
        variant === "fullscreen" &&
          "fixed inset-0 z-[200] h-dvh w-full max-w-none",
        compact && "min-h-[40vh] py-16",
        className,
      )}
    >
      <div
        className={cn(
          "wn-ld-dial relative aspect-square",
          compact ? "w-44 sm:w-52" : "w-64 sm:w-80",
        )}
        aria-hidden
      >
        {/* Tick ring */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 size-full">
          {Array.from({ length: TICK_COUNT }, (_, i) => {
            const major = i % 5 === 0;
            return (
              <line
                key={i}
                x1="100"
                y1={major ? 4 : 7}
                x2="100"
                y2="13"
                transform={`rotate(${(360 / TICK_COUNT) * i} 100 100)`}
                className={major ? "wn-ld-tick-major" : "wn-ld-tick"}
                style={{ animationDelay: `${(i / TICK_COUNT) * 2.4}s` }}
              />
            );
          })}
          <circle cx="100" cy="100" r="88" className="wn-ld-orbit" />
        </svg>

        {/* Radar sweep */}
        <div className="wn-ld-sweep absolute inset-[7%] rounded-full" />

        {/* Driver dot on the inner orbit */}
        <div className="wn-ld-driver absolute inset-[6%]">
          <span className="wn-ld-driver-dot" />
        </div>

        {/* Lockup */}
        <div className="absolute inset-[18%] flex items-center justify-center">
          <WixkedNationLogo
            variant="stacked"
            size="lg"
            priority
            className="wn-ld-logo w-full"
          />
        </div>
      </div>

      {/* Split-flap board */}
      <div className={cn("flex flex-col items-center", compact ? "mt-5" : "mt-8")}>
        <div
          className={cn(
            "wn-ld-flap relative mt-3 overflow-hidden rounded-md border border-white/12 bg-[#0e110f]",
            compact ? "h-9 w-44" : "h-11 w-56 sm:w-60",
          )}
          aria-hidden
        >
          <ul className="wn-ld-flap-reel">
            {FLAP_CITIES.map((city, index) => (
              <li
                key={`${city}-${index}`}
                className={cn(
                  "flex items-center justify-center font-semibold tracking-[0.2em] text-foreground uppercase tabular-nums",
                  compact ? "h-9 text-sm" : "h-11 text-base",
                )}
              >
                {city}
              </li>
            ))}
          </ul>
          <span className="wn-ld-flap-split" />
        </div>
      </div>

      {message ? (
        <p className="mt-6 max-w-[16rem] text-center text-sm text-pretty text-muted-foreground sm:max-w-xs">
          {message}
        </p>
      ) : null}
      <span className="sr-only">Loading</span>
    </div>
  );
}
