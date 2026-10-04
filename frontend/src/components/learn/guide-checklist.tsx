import type { ReactNode } from "react";

export function GuideChecklist({ items }: { items: readonly ReactNode[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <span
            aria-hidden
            className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
          />
          <span className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}
