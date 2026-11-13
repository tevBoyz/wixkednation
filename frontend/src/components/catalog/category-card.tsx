import Link from "next/link";

import type { Category } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type CategoryCardProps = {
  category: Category;
  className?: string;
};

export function CategoryCard({ category, className }: CategoryCardProps) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        "group flex items-start gap-4 rounded-xl border border-white/10 bg-[#0b0e0c] px-4 py-5 transition-colors hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-white/10 text-xl font-semibold text-primary"
      >
        {category.name.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <h2 className="text-base font-semibold tracking-tight group-hover:underline">
          {category.name}
        </h2>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {category.description || "Browse products"}
        </p>
      </span>
      <span
        aria-hidden
        className="self-center text-lg text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground"
      >
        →
      </span>
    </Link>
  );
}
