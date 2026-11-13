import Image from "next/image";

import { BRAND_MARK_PATH } from "@/config/brand";
import { cn } from "@/lib/utils";

type WixkedNationMarkProps = {
  className?: string;
  animated?: boolean;
  /** Pixel size hint for next/image. */
  size?: number;
  priority?: boolean;
};

/**
 * Text-free brand mark: WN monogram and leaf, for nav, favicon, and other small spots.
 */
export function WixkedNationMark({
  className,
  animated = false,
  size = 48,
  priority = false,
}: WixkedNationMarkProps) {
  // Layout boxes are small, but the artwork is detailed. Request a larger
  // source so nav and age-gate marks stay sharp when CSS scales them down.
  const pixelSize = Math.max(size, 256);

  return (
    <Image
      src={BRAND_MARK_PATH}
      alt=""
      width={pixelSize}
      height={pixelSize}
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
