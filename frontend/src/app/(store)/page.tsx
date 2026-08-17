import Link from "next/link";
import type { Metadata } from "next";

import { CategoryCard } from "@/components/catalog/category-card";
import { HeroBrandDescription } from "@/components/catalog/hero-brand-description";
import {
  HeroFeaturedStack,
  type HeroStackItem,
} from "@/components/catalog/hero-featured-stack";
import { PromoBannerCarousel } from "@/components/catalog/promo-banner-carousel";
import { ProductCard } from "@/components/catalog/product-card";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { SITE_DEFAULT_TITLE, SITE_DESCRIPTION } from "@/config/brand";
import { SEO_LOCATIONS } from "@/content/seo-locations";
import { listActiveStoreBanners } from "@/lib/api/banners.api";
import { listCategories } from "@/lib/api/categories.api";
import { listFeaturedProducts } from "@/lib/api/products.api";
import { getErrorMessage } from "@/lib/api/errors";
import { getProductCoverUrl } from "@/lib/catalog/format";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: SITE_DEFAULT_TITLE,
  description: SITE_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof listFeaturedProducts>> = [];
  let categories: Awaited<ReturnType<typeof listCategories>> = [];
  let banners: Awaited<ReturnType<typeof listActiveStoreBanners>> = [];
  let featuredError: string | null = null;
  let categoriesError: string | null = null;

  try {
    featured = await listFeaturedProducts({ limit: 9 });
  } catch (err) {
    featuredError = getErrorMessage(err, "Could not load featured products");
  }

  try {
    categories = await listCategories();
  } catch (err) {
    categoriesError = getErrorMessage(err, "Could not load categories");
  }

  try {
    banners = await listActiveStoreBanners();
  } catch {
    banners = [];
  }

  const heroItems: HeroStackItem[] = featured.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    imageUrl: getProductCoverUrl(product),
  }));

  const showPromoCarousel = banners.length > 0;

  return (
    <main className="min-w-0 overflow-x-clip lg:overflow-x-visible">
      {showPromoCarousel ? (
        <section className="relative w-full min-w-0 overflow-x-clip border-b border-border">
          <PromoBannerCarousel banners={banners} />
        </section>
      ) : (
        <section className="relative overflow-x-clip border-b border-border bg-gradient-to-b from-[color-mix(in_srgb,#148547_12%,transparent)] via-transparent to-transparent lg:overflow-visible">
          <Container className="grid min-h-[min(70vh,40rem)] min-w-0 items-center gap-8 py-12 sm:gap-10 sm:py-16 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,38rem)] lg:gap-10 xl:gap-14">
            <div className="flex min-w-0 flex-col justify-center gap-6 sm:gap-7">
              <div className="flex max-w-2xl flex-col gap-6 sm:gap-8">
                <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
                  <span className="text-primary">Gas</span>
                  <span className="text-foreground">Nation</span>
                </h1>
                <HeroBrandDescription />
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Same-day cannabis delivery, weed delivery, and marijuana
                  delivery across Virginia and Washington, DC — including DC
                  weed delivery. Online dispensary for premium flower, edibles,
                  vapes, and concentrates. Flat $20 delivery, 10 AM–10 PM daily.
                  21+ with valid ID.
                </p>
              </div>
              <p className="max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
                Browse our{" "}
                <span className="text-primary">Fresh</span> catalog of Indica,
                Sativa, and Hybrid strains.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button render={<Link href="/products" />} nativeButton={false}>
                  Shop products
                </Button>
                <Button
                  render={<Link href="/delivery" />}
                  nativeButton={false}
                  variant="outline"
                >
                  Delivery areas
                </Button>
              </div>
            </div>

            {heroItems.length > 0 ? (
              <div className="mx-auto flex w-full min-w-0 max-w-full justify-center overflow-x-clip py-4 sm:py-6 lg:justify-end lg:overflow-visible lg:py-8">
                <HeroFeaturedStack items={heroItems} className="mb-2 lg:mb-0" />
              </div>
            ) : null}
          </Container>
        </section>
      )}

      <Container className="flex min-w-0 flex-col gap-14 py-12 sm:py-16">
        <section aria-labelledby="featured-heading" className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="featured-heading"
                className="text-xl font-semibold tracking-tight"
              >
                Featured
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Picks highlighted from the catalog.
              </p>
            </div>
            <Link
              href="/products"
              className="shrink-0 text-sm font-medium underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </div>

          {featuredError ? (
            <p className="mt-6 text-sm text-destructive" role="alert">
              {featuredError}
            </p>
          ) : null}

          {!featuredError && featured.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              No featured products right now.{" "}
              <Link href="/products" className="underline underline-offset-4">
                Browse the full catalog
              </Link>
              .
            </p>
          ) : null}

          {!featuredError && featured.length > 0 ? (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section aria-labelledby="categories-heading" className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="categories-heading"
                className="text-xl font-semibold tracking-tight"
              >
                Shop by category
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Jump into a category from the store.
              </p>
            </div>
            <Link
              href="/categories"
              className="shrink-0 text-sm font-medium underline-offset-4 hover:underline"
            >
              All categories
            </Link>
          </div>

          {categoriesError ? (
            <p className="mt-6 text-sm text-destructive" role="alert">
              {categoriesError}
            </p>
          ) : null}

          {!categoriesError && categories.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Categories will appear here when the catalog is ready.
            </p>
          ) : null}

          {!categoriesError && categories.length > 0 ? (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <CategoryCard category={category} />
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section aria-labelledby="delivery-heading" className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="delivery-heading"
                className="text-xl font-semibold tracking-tight"
              >
                Cannabis delivery near you
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Same-day weed delivery near you across Virginia and Washington,
                DC.
              </p>
            </div>
            <Link
              href="/delivery"
              className="shrink-0 text-sm font-medium underline-offset-4 hover:underline"
            >
              All delivery areas
            </Link>
          </div>
          <ul className="mt-6 flex flex-wrap gap-2">
            {SEO_LOCATIONS.filter((item) => item.kind !== "neighborhood")
              .slice(0, 16)
              .map((location) => (
                <li key={location.slug}>
                  <Link
                    href={`/delivery/${location.slug}`}
                    className="inline-flex rounded-full border border-border bg-card/40 px-3 py-1 text-sm hover:border-primary/40 hover:text-primary"
                  >
                    {location.name}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      </Container>
    </main>
  );
}
