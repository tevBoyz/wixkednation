"use client";

import Link from "next/link";
import { useState } from "react";

type CityEntry = { name: string; href: string };

const PAGE_SIZE = 40;

/**
 * A–Z city index with "Load more". Cities past the current page are
 * rendered with `hidden` so every link stays in the HTML for crawlers.
 */
export function CityIndex({
  groups,
}: {
  groups: [letter: string, cities: CityEntry[]][];
}) {
  const total = groups.reduce((sum, [, cities]) => sum + cities.length, 0);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = Math.min(visible, total);

  const starts = groups.reduce<number[]>((acc, _group, index) => {
    acc.push(index === 0 ? 0 : acc[index - 1] + groups[index - 1][1].length);
    return acc;
  }, []);

  return (
    <div className="min-w-0">
      <dl className="min-w-0 divide-y divide-white/10 border-y border-white/10">
        {groups.map(([letter, cities], groupIndex) => {
          const start = starts[groupIndex];
          const groupHidden = start >= shown;

          return (
            <div
              key={letter}
              hidden={groupHidden}
              className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-3 py-3"
            >
              <dt className="text-xl font-semibold text-primary">{letter}</dt>
              <dd className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {cities.map((city, index) => (
                  <Link
                    key={city.name}
                    href={city.href}
                    hidden={start + index >= shown}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {city.name}
                  </Link>
                ))}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        {shown < total ? (
          <button
            type="button"
            onClick={() => setVisible((current) => current + PAGE_SIZE)}
            className="inline-flex h-10 items-center rounded-full border border-white/15 px-5 text-sm font-medium text-foreground transition-colors hover:border-white/35"
          >
            Load more cities
          </button>
        ) : null}
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing {shown} of {total}
        </p>
      </div>
    </div>
  );
}
