import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ProductCard } from "@/components/catalog/product-card";
import { ProductsPagination } from "@/components/catalog/products-pagination";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import {
  fetchCategoryBySlug,
  listCategories,
} from "@/lib/api/categories.api";
import { fetchProductsPage } from "@/lib/api/products.api";
import { ApiError, getErrorMessage } from "@/lib/api/errors";
import {
  findCategoryPathBySlug,
  sortCategoryTree,
} from "@/lib/catalog/category-tree";
import { SITE_NAME } from "@/config/brand";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

const PAGE_SIZE = 12;

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const category = await fetchCategoryBySlug(slug);
    const seoBySlug: Record<string, { title: string; description: string }> = {
      flower: {
        title: "Buy Flower Online | Premium Flower Delivery NoVA & DC",
        description:
          "Buy flower online with same-day cannabis delivery in Northern Virginia and Washington, DC. Premium flower from GasNation. 21+.",
      },
      indica: {
        title: "Indica Flower Delivery | Northern Virginia & DC",
        description:
          "Indica flower delivery from GasNation. Shop indica for evening and relaxation-oriented strains. Same-day weed delivery in NoVA and DC.",
      },
      sativa: {
        title: "Sativa Flower Delivery | Northern Virginia & DC",
        description:
          "Sativa flower delivery from GasNation. Daytime sativa strains with same-day cannabis delivery across Northern Virginia and DC.",
      },
      hybrid: {
        title: "Hybrid Flower Delivery | Northern Virginia & DC",
        description:
          "Hybrid flower delivery from GasNation. Shop hybrid strains with same-day weed delivery in Northern Virginia and Washington, DC.",
      },
    };

    const extras = seoBySlug[slug];
    const description =
      extras?.description ||
      category.description?.trim() ||
      `Shop ${category.name} cannabis products with same-day delivery from ${SITE_NAME} across Northern Virginia and Washington, DC.`;

    return buildPageMetadata({
      title: extras?.title || `${category.name} | Cannabis Menu Delivery`,
      description,
      path: `/categories/${slug}`,
    });
  } catch {
    return { title: "Category" };
  }
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number.parseInt(query.page || "1", 10) || 1);

  let category;
  try {
    category = await fetchCategoryBySlug(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  let breadcrumbPath = [category];
  try {
    const roots = await listCategories();
    const path = findCategoryPathBySlug(roots, category.slug);
    if (path?.length) {
      breadcrumbPath = path;
    }
  } catch {
    // keep single-segment breadcrumb
  }

  const children = sortCategoryTree(category.children ?? []);

  let products: Awaited<ReturnType<typeof fetchProductsPage>>["products"] = [];
  let pagination = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 };
  let productsError: string | null = null;

  try {
    const result = await fetchProductsPage({
      category: category.slug,
      page,
      limit: PAGE_SIZE,
    });
    products = result.products ?? [];
    pagination = result.pagination ?? pagination;
  } catch (err) {
    productsError = getErrorMessage(err, "Could not load products");
  }

  return (
    <Container as="main" className="min-w-0 py-10">
      <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href="/categories" className="hover:text-foreground">
              Categories
            </Link>
          </li>
          {breadcrumbPath.map((item, index) => {
            const isLast = index === breadcrumbPath.length - 1;
            return (
              <li key={item.id} className="flex items-center gap-2">
                <span aria-hidden>/</span>
                {isLast ? (
                  <span className="text-foreground">{item.name}</span>
                ) : (
                  <Link
                    href={`/categories/${item.slug}`}
                    className="hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <header className="mt-6 max-w-2xl min-w-0">
        <h1>{category.name}</h1>
          <p className="mt-3 text-muted-foreground">
            {category.description?.trim() ||
              `Shop ${category.name} with same-day cannabis delivery from ${SITE_NAME} across Northern Virginia and Washington, DC.`}
          </p>
      </header>

      {children.length > 0 ? (
        <section className="mt-8" aria-labelledby="subcategories-heading">
          <h2
            id="subcategories-heading"
            className="text-sm font-medium text-muted-foreground"
          >
            Subcategories
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {children.map((child) => (
              <li key={child.id}>
                <Button
                  render={<Link href={`/categories/${child.slug}`} />}
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                >
                  {child.name}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          render={<Link href="/products" />}
          nativeButton={false}
          variant="outline"
        >
          All products
        </Button>
        <Button
          render={<Link href="/categories" />}
          nativeButton={false}
          variant="outline"
        >
          All categories
        </Button>
      </div>

      {productsError ? (
        <p className="mt-8 text-sm text-destructive" role="alert">
          {productsError}
        </p>
      ) : null}

      {!productsError && products.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No products in this category yet.
        </p>
      ) : null}

      {!productsError && products.length > 0 ? (
        <>
          <p className="mt-8 text-sm text-muted-foreground">
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
            basePath={`/categories/${category.slug}`}
          />
        </>
      ) : null}
    </Container>
  );
}
