import Link from "next/link";

import type { GuideCta } from "@/components/learn/guide-link";

export function GuideChipLinks({ links }: { links: readonly GuideCta[] }) {
  return (
    <ul className="mt-5 flex flex-wrap gap-2">
      {links.map((item) => (
        <li key={item.label}>
          <Link
            href={item.href}
            className="wn-plate inline-flex px-3 py-2 text-xs font-medium hover:border-white/30"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
