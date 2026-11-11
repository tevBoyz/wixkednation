import Link from "next/link";

import type { GuideCta } from "@/components/learn/guide-link";

export function GuideChipLinks({ links }: { links: readonly GuideCta[] }) {
  return (
    <ul className="mt-5 flex flex-wrap gap-2">
      {links.map((item) => (
        <li key={item.label}>
          <Link
            href={item.href}
            className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-medium hover:border-primary/40 hover:text-primary"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
