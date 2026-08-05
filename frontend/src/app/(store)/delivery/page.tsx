import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import {
  DELIVERY_CITIES,
  DELIVERY_COUNTIES,
  DELIVERY_NEIGHBORHOODS,
  PRODUCT_CATEGORY_SEO,
} from "@/content/delivery-areas";
import { buildBreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Cannabis Delivery Near You in Northern Virginia & DC",
  description:
    "Same-day cannabis delivery across Fairfax, Arlington, Alexandria, Loudoun, Prince William, and Washington, DC. Premium flower, edibles, vapes, and concentrates. Flat $20 delivery. 21+.",
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
        <header className="max-w-3xl">
          <p className="text-sm font-medium text-primary">Local delivery</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Cannabis delivery near you in Northern Virginia and DC
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            GasNation is your online dispensary for fast, discreet, same-day
            cannabis delivery. Order premium flower, edibles, carts,
            concentrates, and accessories online. We run 10 AM–10 PM daily with
            a flat $20 delivery fee. 21+ with valid ID required.
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
        </header>

        <section className="mt-12 max-w-3xl" aria-labelledby="cities-heading">
          <h2 id="cities-heading" className="text-xl font-semibold tracking-tight">
            Cities we deliver to
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Cannabis delivery in McLean, Reston, Ashburn, Fairfax, Arlington,
            Alexandria, Washington DC, and more. If your city is nearby, ask us
            — we probably cover it.
          </p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {DELIVERY_CITIES.map((city) => (
              <li
                key={city}
                className="rounded-md border border-border/80 bg-card/40 px-3 py-2 text-sm"
              >
                Cannabis delivery {city.replace(/, DC$/, " DC")}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 max-w-3xl" aria-labelledby="counties-heading">
          <h2
            id="counties-heading"
            className="text-xl font-semibold tracking-tight"
          >
            Counties and metro areas
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {DELIVERY_COUNTIES.map((county) => (
              <li key={county} className="text-sm text-muted-foreground">
                {county}
              </li>
            ))}
          </ul>
        </section>

        <section
          className="mt-12 max-w-3xl"
          aria-labelledby="neighborhoods-heading"
        >
          <h2
            id="neighborhoods-heading"
            className="text-xl font-semibold tracking-tight"
          >
            Neighborhoods and landmarks nearby
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Serving areas around Tysons Corner, Mosaic District, Old Town
            Alexandria, Ballston, Rosslyn, Clarendon, Reston Town Center, and
            more.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {DELIVERY_NEIGHBORHOODS.map((place) => (
              <li
                key={place}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                {place}
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
            {PRODUCT_CATEGORY_SEO.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-medium hover:border-primary/40 hover:text-primary"
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
            Browse the menu, place your order, and get discreet delivery across
            Northern Virginia and DC today.
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
