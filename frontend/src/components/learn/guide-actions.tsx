import Link from "next/link";

import type { GuideCta } from "@/components/learn/guide-link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GuideActions({
  primary,
  secondary,
  className,
}: {
  primary: GuideCta;
  secondary?: GuideCta;
  className?: string;
}) {
  return (
    <div className={cn("mt-6 flex flex-wrap gap-3", className)}>
      <Button render={<Link href={primary.href} />} nativeButton={false}>
        {primary.label}
      </Button>
      {secondary ? (
        <Button
          render={<Link href={secondary.href} />}
          nativeButton={false}
          variant="outline"
        >
          {secondary.label}
        </Button>
      ) : null}
    </div>
  );
}
