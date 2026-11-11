import type { ReactNode } from "react";

import { GuideActions } from "@/components/learn/guide-actions";
import type { GuideCta } from "@/components/learn/guide-link";

export function GuideHero({
  eyebrow,
  title,
  lead,
  primary,
  secondary,
}: {
  eyebrow: string;
  title: string;
  lead: ReactNode;
  primary: GuideCta;
  secondary?: GuideCta;
}) {
  return (
    <header className="mt-6 max-w-3xl">
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
        {lead}
      </p>
      <GuideActions primary={primary} secondary={secondary} />
    </header>
  );
}
