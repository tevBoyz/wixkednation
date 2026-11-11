import { GasNationLogo } from "@/components/brand/gasnation-logo";
import { cn } from "@/lib/utils";

type GasNationLoaderProps = {
  className?: string;
  /** fullscreen overlay vs inline block */
  variant?: "fullscreen" | "inline";
  message?: string;
};

export function GasNationLoader({
  className,
  variant = "fullscreen",
  message,
}: GasNationLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex w-full max-w-full flex-col items-center justify-center overflow-hidden bg-background px-4",
        variant === "fullscreen" &&
          "fixed inset-0 z-[200] h-dvh w-full max-w-none",
        variant === "inline" && "min-h-[40vh] py-16",
        className,
      )}
    >
      <div className="relative flex w-full max-w-[14rem] flex-col items-center gap-5 sm:max-w-[16rem]">
        <GasNationLogo
          variant="stacked"
          size="lg"
          priority
          className="relative z-[1] w-full max-w-[11rem] sm:max-w-[13rem]"
        />
        <div className="gn-loader-track relative z-[1]" aria-hidden>
          <div className="gn-loader-bar" />
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
