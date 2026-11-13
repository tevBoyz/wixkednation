import Link from "next/link";
import type { Metadata } from "next";

import { HeroBrandDescription } from "@/components/catalog/hero-brand-description";
import { DeliveryRunScene } from "@/components/home/delivery-run-scene";
import { MenuBoardRow } from "@/components/catalog/menu-board-row";
import { PromoBannerCarousel } from "@/components/catalog/promo-banner-carousel";
import { Container } from "@/components/layout/container";
import { CityIndex } from "@/components/delivery/city-index";
import { SITE_DEFAULT_TITLE, SITE_DESCRIPTION } from "@/config/brand";
import { DELIVERY_CITIES } from "@/content/delivery-areas";
import { locationHrefByName } from "@/content/seo-locations";
import { listPublicBlogPosts } from "@/lib/api/blog.api";
import { listActiveStoreBanners } from "@/lib/api/banners.api";
import { listFeaturedProducts } from "@/lib/api/products.api";
import { getErrorMessage } from "@/lib/api/errors";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: SITE_DEFAULT_TITLE,
  description: SITE_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

function groupCitiesByLetter(cities: readonly string[]) {
  const groups = new Map<string, string[]>();
  for (const city of [...cities].sort((a, b) => a.localeCompare(b))) {
    const letter = city.charAt(0).toUpperCase();
    const bucket = groups.get(letter) ?? [];
    bucket.push(city);
    groups.set(letter, bucket);
  }
  return [...groups.entries()];
}

function formatPostDate(value?: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const DISPATCH_STEPS = [
  {
    title: "Pick from the board",
    body: "Flower, edibles, vapes, concentrates.",
  },
  {
    title: "We confirm by phone",
    body: "A real person checks your address and ETA.",
  },
  {
    title: "Cash at the door",
    body: "Show a valid ID. Adults 21+ only.",
  },
] as const;

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof listFeaturedProducts>> = [];
  let banners: Awaited<ReturnType<typeof listActiveStoreBanners>> = [];
  let homepagePosts: Awaited<
    ReturnType<typeof listPublicBlogPosts>
  >["posts"] = [];
  let featuredError: string | null = null;

  try {
    const picks = await listFeaturedProducts({ limit: 9 });
    featured = picks.filter((product) => product.isFeatured);
  } catch (err) {
    featuredError = getErrorMessage(err, "Could not load featured products");
  }

  try {
    banners = await listActiveStoreBanners();
  } catch {
    banners = [];
  }

  try {
    const blog = await listPublicBlogPosts({
      showOnHomepage: true,
      limit: 6,
    });
    homepagePosts = blog.posts ?? [];
  } catch {
    homepagePosts = [];
  }

  const showPromoCarousel = banners.length > 0;
  const cityGroups = groupCitiesByLetter(DELIVERY_CITIES);

  return (
    <main className="min-w-0 overflow-x-clip">
      <DeliveryRunScene />

      {/* 1. The counter: menu board + dispatch desk */}
      <Container className="grid min-w-0 gap-6 py-6 sm:py-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)] lg:items-start lg:gap-8 lg:py-10">
        <aside
          aria-labelledby="dispatch-heading"
          className="wn-stage order-first flex min-w-0 flex-col gap-7 rounded-2xl p-6 sm:p-8 lg:sticky lg:top-6 lg:order-last lg:self-start"
        >
          <div>
            <h1
              id="dispatch-heading"
              className="mt-3 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl"
            >
              Same-day cannabis delivery across Ohio.
            </h1>
          </div>

          <HeroBrandDescription className="text-3xl sm:text-4xl" />

          <ol className="space-y-4 border-t border-white/10 pt-6">
            {DISPATCH_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2"
              >
                <span className="text-sm font-semibold tabular-nums text-primary">
                  {index + 1}.
                </span>
                <span>
                  <span className="block text-base font-medium text-foreground">
                    {step.title}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {step.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <Link
            href="/delivery"
            className="group flex items-center justify-between gap-4 rounded-xl border border-white/15 px-4 py-3 text-sm text-foreground transition-colors hover:border-white/35"
          >
            <span className="block text-base">Is my address covered?</span>
            <span
              aria-hidden
              className="text-xl transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </aside>

        <section
          aria-labelledby="board-heading"
          className="min-w-0 rounded-2xl border border-white/10 bg-[#0b0e0c]"
        >
          <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-6 sm:px-7">
            <div>
              <h2 id="board-heading" className="text-2xl sm:text-3xl">
                What&apos;s on the menu
              </h2>
            </div>
            <Link
              href="/products"
              className="wn-neon-fill inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold"
            >
              Open the full menu
            </Link>
          </div>

          <div className="mt-5 border-t border-white/10 px-5 pb-6 sm:px-7">
            {featuredError ? (
              <p className="mt-5 text-sm text-destructive" role="alert">
                {featuredError}
              </p>
            ) : null}

            {!featuredError && featured.length === 0 ? (
              <div className="py-12 text-center sm:py-16">
                <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  The board is being restocked.
                </p>
                <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                  Featured picks show up here. Meanwhile, the{" "}
                  <Link
                    href="/products"
                    className="text-foreground underline underline-offset-4"
                  >
                    full catalog
                  </Link>{" "}
                  is open.
                </p>
              </div>
            ) : null}

            {!featuredError && featured.length > 0 ? (
              <ul className="max-h-80 divide-y divide-white/10 overflow-y-auto overscroll-contain [scrollbar-width:none] sm:max-h-96 [&::-webkit-scrollbar]:hidden">
                {featured.map((product, index) => (
                  <li key={product.id}>
                    <MenuBoardRow product={product} index={index} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      </Container>

      {/* 2. Deals (only when banners exist) */}
      {showPromoCarousel ? (
        <Container className="min-w-0 pb-8 sm:pb-12">
          <section
            aria-label="Current deals"
            className="overflow-hidden rounded-2xl border border-white/10"
          >
            <PromoBannerCarousel banners={banners} />
          </section>
        </Container>
      ) : null}

      {/* 3. Coverage: every Ohio city, A to Z */}
      <section
        aria-labelledby="coverage-heading"
        className="border-y border-white/10 bg-[#0b0e0c]"
      >
        <Container className="grid min-w-0 gap-8 py-12 sm:py-16 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
          <div className="lg:sticky lg:top-6 lg:self-start">
            <h2 id="coverage-heading" className="text-3xl sm:text-4xl">
              {DELIVERY_CITIES.length} Ohio cities, A to Z
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Find your town for local hours, fees, and ETA.
            </p>
            <Link
              href="/delivery"
              className="mt-5 inline-block text-sm text-foreground underline underline-offset-4 hover:text-primary"
            >
              Delivery areas &amp; map
            </Link>
          </div>

          <CityIndex
            groups={cityGroups.map(([letter, cities]) => [
              letter,
              cities.map((city) => ({
                name: city,
                href: locationHrefByName(city) ?? "/delivery",
              })),
            ])}
          />
        </Container>
      </section>

      {/* 4. Journal */}
      {homepagePosts.length > 0 ? (
        <Container className="min-w-0 py-12 sm:py-16">
          <section aria-labelledby="journal-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="journal-heading" className="text-3xl sm:text-4xl">
                  Notes from the desk
                </h2>
              </div>
              <Link
                href="/blog"
                className="text-sm text-foreground underline underline-offset-4 hover:text-primary"
              >
                Every entry
              </Link>
            </div>
            <ol className="mt-6 grid gap-x-10 border-t border-white/10 md:grid-cols-2">
              {homepagePosts.map((post) => {
                const dateLabel = formatPostDate(
                  post.publishedAt || post.createdAt,
                );
                return (
                  <li key={post.id} className="border-b border-white/10">
                    <Link href={`/blog/${post.slug}`} className="group block py-5">
                      {dateLabel ? (
                        <span className="block text-xs text-muted-foreground">
                          {dateLabel}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-lg font-medium tracking-tight text-foreground group-hover:underline sm:text-xl">
                        {post.title}
                      </span>
                      {post.excerpt ? (
                        <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                          {post.excerpt}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        </Container>
      ) : null}
    </main>
  );
}
