import Image from "next/image";

import { BRAND_MARK_PATH } from "@/config/brand";
import { cn } from "@/lib/utils";

type GasNationMarkProps = {
  className?: string;
  animated?: boolean;
  /** Pixel size hint for next/image. */
  size?: number;
  priority?: boolean;
};

/**
 * Brand mark - stylized G with leaf (from official logo artwork).
 */
export function GasNationMark({
  className,
  animated = false,
  size = 48,
  priority = false,
}: GasNationMarkProps) {
  return (
    <Image
      src={BRAND_MARK_PATH}
      alt=""
      width={size}
      height={size}
      aria-hidden
      priority={priority}
      className={cn(
        "block size-full shrink-0 object-contain object-center",
        animated && "gn-mark-pulse",
        className,
      )}
    />
  );
}
