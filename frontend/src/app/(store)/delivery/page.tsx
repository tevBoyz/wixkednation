import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { DELIVERY_CITIES, DELIVERY_COUNTIES } from "@/content/delivery-areas";
import { locationHrefByName, PRODUCT_SEO_LINKS } from "@/content/seo-locations";
import { buildBreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Cities We Cover in Ohio | Wixked Nation",
  description:
    "See every incorporated Ohio city Wixked Nation delivers to, including Columbus, Cleveland, Cincinnati, Toledo, Akron, and Dayton. Flat $20. 10 AM–10 PM. 21+.",
  path: "/delivery",
});

export default function DeliveryPage() {
  return (
    <main className="min-w-0 overflow-x-clip">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Delivery areas", path: "/delivery" },
        ])}
      />
      <Container className="min-w-0 py-10 sm:py-14">
        <header className="wn-page-head">
          <h1 className="relative z-[1] text-4xl sm:text-5xl">
            Cities we cover in Ohio
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Wixked Nation delivers same-day to every incorporated city in Ohio.
            Order flower, edibles, vapes, and concentrates online — flat $20
            fee, 10 AM–10 PM, cash on delivery, 21+ with valid ID. No medical
            card needed.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button render={<Link href="/products" />} nativeButton={false}>
              Shop the menu
            </Button>
            <Button
              render={<Link href="/faqs" />}
              nativeButton={false}
              variant="outline"
            >
              Delivery FAQ
            </Button>
          </div>
          <p className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link
              href="/delivery/ohio"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Weed delivery in Ohio
            </Link>
            <Link
              href="/delivery/columbus"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Columbus delivery
            </Link>
            <Link
              href="/delivery/cleveland"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Cleveland delivery
            </Link>
            <Link
              href="/delivery/cincinnati"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Cincinnati delivery
            </Link>
          </p>
        </header>

        <section className="mt-12" aria-labelledby="cities-heading">
          <h2 id="cities-heading" className="text-xl font-semibold tracking-tight">
            Cities we deliver to
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Every incorporated city in Ohio, from Akron and Athens through
            Columbus, Cleveland, Cincinnati, Toledo, and Zanesville.
          </p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {DELIVERY_CITIES.map((city) => {
              const href = locationHrefByName(city);
              return (
                <li
                  key={city}
                  className="rounded-md border border-border/80 bg-card/40 px-3 py-2 text-sm"
                >
                  {href ? (
                    <Link
                      href={href}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {city}
                    </Link>
                  ) : (
                    city
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-12 max-w-3xl" aria-labelledby="counties-heading">
          <h2
            id="counties-heading"
            className="text-xl font-semibold tracking-tight"
          >
            Ohio counties
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {DELIVERY_COUNTIES.map((county) => (
              <li key={county} className="text-sm text-muted-foreground">
                {county}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 max-w-3xl" aria-labelledby="menu-heading">
          <h2 id="menu-heading" className="text-xl font-semibold tracking-tight">
            What you can order
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Premium flower (indica, sativa, hybrid), pre-rolls, edibles, vape
            cartridges, disposable vapes, concentrates, live resin, rosin, and
            accessories.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {PRODUCT_SEO_LINKS.map((item) => (
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
        </section>

        <section className="mt-12 max-w-3xl rounded-lg border border-border bg-card/50 p-6">
          <h2 className="text-lg font-semibold tracking-tight">
            Ready for same-day cannabis delivery?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse the menu, place your order, and get discreet weed delivery in
            Ohio today.
          </p>
          <Button
            className="mt-4"
            render={<Link href="/products" />}
            nativeButton={false}
          >
            Buy cannabis online
          </Button>
        </section>
      </Container>
    </main>
  );
}
