import { Suspense } from "react";

import { ProductCard } from "@/components/catalog/product-card";
import { ProductsFilters } from "@/components/catalog/products-filters";
import { ProductsPagination } from "@/components/catalog/products-pagination";
import { Container } from "@/components/layout/container";
import { listCategories } from "@/lib/api/categories.api";
import { fetchProductsPage } from "@/lib/api/products.api";
import { getErrorMessage } from "@/lib/api/errors";

type ProductsPageProps = {
  searchParams: Promise<{
    category?: string;
    search?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 12;

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const category = params.category?.trim() || undefined;
  const search = params.search?.trim() || undefined;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);

  let products: Awaited<ReturnType<typeof fetchProductsPage>>["products"] = [];
  let pagination = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 };
  let categories: Awaited<ReturnType<typeof listCategories>> = [];
  let error: string | null = null;

  try {
    const [productsResult, categoriesResult] = await Promise.all([
      fetchProductsPage({ category, search, page, limit: PAGE_SIZE }),
      listCategories(),
    ]);
    products = productsResult.products ?? [];
    pagination = productsResult.pagination ?? pagination;
    categories = categoriesResult;
  } catch (err) {
    error = getErrorMessage(err, "Could not load products");
    try {
      categories = await listCategories();
    } catch {
      // filters can still render empty
    }
  }

  return (
    <Container as="main" className="min-w-0 py-10">
      <header className="max-w-2xl min-w-0">
        <h1>Products</h1>
        <p className="mt-2 text-muted-foreground">
          Browse the catalog. Filter by category or search - hidden products are
          not listed.
        </p>
      </header>

      <div className="mt-8">
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">Loading filters…</p>
          }
        >
          <ProductsFilters categories={categories} />
        </Suspense>
      </div>

      {error ? (
        <p className="mt-8 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {!error && products.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No products match these filters.
        </p>
      ) : null}

      {!error && products.length > 0 ? (
        <>
          <p className="mt-6 text-sm text-muted-foreground">
            {pagination.total} product{pagination.total === 1 ? "" : "s"}
          </p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
          <ProductsPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            category={category}
            search={search}
          />
        </>
      ) : null}
    </Container>
  );
}
