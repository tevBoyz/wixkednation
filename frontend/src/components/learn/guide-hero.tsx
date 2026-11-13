import type { ReactNode } from "react";

import { GuideActions } from "@/components/learn/guide-actions";
import type { GuideCta } from "@/components/learn/guide-link";

export function GuideHero({
  title,
  lead,
  primary,
  secondary,
}: {
  title: string;
  lead: ReactNode;
  primary: GuideCta;
  secondary?: GuideCta;
}) {
  return (
    <header className="wn-page-head mt-6">
      <h1 className="relative z-[1] text-4xl sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
        {lead}
      </p>
      <GuideActions primary={primary} secondary={secondary} />
    </header>
  );
}
