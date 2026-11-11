import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function GuideSection({
  id,
  title,
  intro,
  wide = false,
  children,
}: {
  id: string;
  title: string;
  intro?: ReactNode;
  /** Full container width instead of the reading column (card grids). */
  wide?: boolean;
  children?: ReactNode;
}) {
  const headingId = `${id}-heading`;
  return (
    <section
      className={cn("mt-14", !wide && "max-w-3xl")}
      aria-labelledby={headingId}
    >
      <h2
        id={headingId}
        className="text-xl font-semibold tracking-tight sm:text-2xl"
      >
        {title}
      </h2>
      {intro ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {intro}
        </p>
      ) : null}
      {children}
    </section>
  );
}

export function GuideProse({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
      {children}
    </p>
  );
}
