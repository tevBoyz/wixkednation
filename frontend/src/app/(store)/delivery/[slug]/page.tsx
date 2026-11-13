import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_NAME } from "@/config/brand";
import {
  getSeoLocation,
  locationPageDescription,
  locationPageTitle,
  nearbySeoLocationGroups,
  PRODUCT_SEO_LINKS,
  SEO_LOCATIONS,
} from "@/content/seo-locations";
import {
  buildBreadcrumbJsonLd,
  buildLocalBusinessJsonLd,
} from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

type DeliveryLocationPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return SEO_LOCATIONS.map((location) => ({ slug: location.slug }));
}

export async function generateMetadata({
  params,
}: DeliveryLocationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const location = getSeoLocation(slug);
  if (!location) {
    return { title: "Delivery" };
  }

  return buildPageMetadata({
    title: locationPageTitle(location),
    description: locationPageDescription(location),
    path: `/delivery/${location.slug}`,
  });
}

export default async function DeliveryLocationPage({
  params,
}: DeliveryLocationPageProps) {
  const { slug } = await params;
  const location = getSeoLocation(slug);
  if (!location) {
    notFound();
  }

  const nearbyGroups = nearbySeoLocationGroups(location.slug);
  const placeLabel = location.name;

  return (
    <main className="min-w-0 overflow-x-clip">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Delivery areas", path: "/delivery" },
          { name: location.name, path: `/delivery/${location.slug}` },
        ])}
      />
      <JsonLd
        data={{
          ...buildLocalBusinessJsonLd(),
          areaServed: {
            "@type": location.kind === "region" ? "AdministrativeArea" : "City",
            name: location.name,
          },
        }}
      />
      <Container className="min-w-0 py-10 sm:py-14">
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/delivery" className="hover:text-foreground">
            Delivery areas
          </Link>
          <span aria-hidden> / </span>
          <span className="text-foreground">{location.name}</span>
        </nav>

        <header className="wn-page-head mt-6">
          <p className="text-sm font-medium text-primary">
            {location.area} · {SITE_NAME}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {location.h1 ?? `Weed delivery in ${placeLabel}`}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {location.blurb}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Order online from Wixked Nation for {placeLabel}: flower, pre-rolls,
            edibles, vapes, and concentrates. Flat $20 delivery, 10 AM–10 PM
            daily, cash on delivery. 21+ with valid ID in person. No medical
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
              How delivery works
            </Button>
          </div>
        </header>

        <section className="mt-12 max-w-3xl" aria-labelledby="order-heading">
          <h2 id="order-heading" className="text-xl font-semibold tracking-tight">
            What you can order for {placeLabel} delivery
          </h2>
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

        <section className="mt-12 max-w-3xl" aria-labelledby="nearby-heading">
          <h2 id="nearby-heading" className="text-xl font-semibold tracking-tight">
            Nearby delivery areas
          </h2>
          <div className="mt-6 space-y-8">
            {nearbyGroups.map((group) => (
              <div key={group.clusterId}>
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  {group.label}
                </h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {group.locations.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/delivery/${item.slug}`}
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Weed delivery in {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
