import Link from "next/link";

import { Button } from "@/components/ui/button";

type ProductsPaginationProps = {
  page: number;
  totalPages: number;
  /** Defaults to `/products` (uses category/search query params). */
  basePath?: string;
  category?: string;
  search?: string;
};

function hrefForPage(
  page: number,
  options: {
    basePath: string;
    category?: string;
    search?: string;
  },
): string {
  const params = new URLSearchParams();
  if (options.basePath === "/products") {
    if (options.category) {
      params.set("category", options.category);
    }
    if (options.search) {
      params.set("search", options.search);
    }
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const qs = params.toString();
  return qs ? `${options.basePath}?${qs}` : options.basePath;
}

export function ProductsPagination({
  page,
  totalPages,
  basePath = "/products",
  category,
  search,
}: ProductsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const options = { basePath, category, search };

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-between gap-3"
      aria-label="Product pagination"
    >
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          render={
            <Link
              href={hrefForPage(Math.max(1, page - 1), options)}
              aria-disabled={page <= 1}
              tabIndex={page <= 1 ? -1 : undefined}
            />
          }
          nativeButton={false}
          variant="outline"
          disabled={page <= 1}
          className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
        >
          Previous
        </Button>
        <Button
          render={
            <Link
              href={hrefForPage(Math.min(totalPages, page + 1), options)}
              aria-disabled={page >= totalPages}
              tabIndex={page >= totalPages ? -1 : undefined}
            />
          }
          nativeButton={false}
          variant="outline"
          disabled={page >= totalPages}
          className={
            page >= totalPages ? "pointer-events-none opacity-50" : undefined
          }
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
