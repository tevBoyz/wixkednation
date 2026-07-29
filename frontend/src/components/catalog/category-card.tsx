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
        "group block rounded-lg border border-border bg-background px-4 py-5 transition-colors hover:border-foreground/25 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <h2 className="text-base font-semibold tracking-tight group-hover:underline">
        {category.name}
      </h2>
      {category.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {category.description}
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Browse products</p>
      )}
    </Link>
  );
}
