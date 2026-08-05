import Link from "next/link";
import type { Metadata } from "next";

import { CategoryCard } from "@/components/catalog/category-card";
import { Container } from "@/components/layout/container";
import { listCategories } from "@/lib/api/categories.api";
import { getErrorMessage } from "@/lib/api/errors";
import { sortCategoryTree } from "@/lib/catalog/category-tree";
import { buildPageMetadata } from "@/lib/seo/site-metadata";
import type { Category } from "@/lib/api/types";

export const metadata: Metadata = buildPageMetadata({
  title: "Cannabis Categories | Flower, Edibles, Vapes & More",
  description:
    "Shop GasNation categories: indica, sativa, hybrid flower, edibles, carts, concentrates, and accessories. Online dispensary with delivery across Northern Virginia and DC.",
  path: "/categories",
});

function CategoryTreeBranch({ category }: { category: Category }) {
  const children = sortCategoryTree(category.children ?? []);

  return (
    <li className="min-w-0">
      <CategoryCard category={category} />
      {children.length > 0 ? (
        <ul className="mt-3 space-y-3 border-l border-border pl-4 sm:pl-6">
          {children.map((child) => (
            <CategoryTreeBranch key={child.id} category={child} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default async function CategoriesIndexPage() {
  let categories: Category[] = [];
  let error: string | null = null;

  try {
    categories = await listCategories();
  } catch (err) {
    error = getErrorMessage(err, "Could not load categories");
  }

  return (
    <Container as="main" className="min-w-0 py-10">
      <header className="max-w-2xl min-w-0">
        <h1>Categories</h1>
        <p className="mt-3 text-muted-foreground">
          Browse the shop by category. Parent categories include products from
          their subcategories.
        </p>
      </header>

      <div className="mt-6">
        <Link
          href="/products"
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          View all products
        </Link>
      </div>

      {error ? (
        <p className="mt-8 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {!error && categories.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No categories yet.
        </p>
      ) : null}

      {!error && categories.length > 0 ? (
        <ul className="mt-8 space-y-6">
          {categories.map((category) => (
            <CategoryTreeBranch key={category.id} category={category} />
          ))}
        </ul>
      ) : null}
    </Container>
  );
}
