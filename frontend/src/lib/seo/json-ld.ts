import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/config/brand";
import { DELIVERY_CITIES } from "@/content/delivery-areas";
import type { FaqItem } from "@/content/faqs";
import { absoluteUrl } from "@/lib/seo/site-metadata";

export function jsonLdScript(data: Record<string, unknown> | Record<string, unknown>[]) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/gasnation-mark-v3.png"),
    description: SITE_DESCRIPTION,
    areaServed: DELIVERY_CITIES.map((name) => ({
      "@type": "City",
      name,
    })),
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_TAGLINE,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/products")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    image: absoluteUrl("/brand/gasnation-og.png"),
    description: SITE_DESCRIPTION,
    priceRange: "$$",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "10:00",
      closes: "22:00",
    },
    areaServed: [
      { "@type": "AdministrativeArea", name: "Northern Virginia" },
      { "@type": "City", name: "Washington, DC" },
      ...DELIVERY_CITIES.map((name) => ({
        "@type": "City" as const,
        name,
      })),
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Cannabis menu",
      itemListElement: [
        { "@type": "OfferCatalog", name: "Flower" },
        { "@type": "OfferCatalog", name: "Edibles" },
        { "@type": "OfferCatalog", name: "Vapes" },
        { "@type": "OfferCatalog", name: "Concentrates" },
      ],
    },
  };
}

export function buildFaqPageJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer.replace(/\n+/g, " ").trim(),
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(
  crumbs: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function buildProductJsonLd(input: {
  name: string;
  description: string;
  slug: string;
  imageUrl?: string | null;
  priceLabel?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    url: absoluteUrl(`/products/${input.slug}`),
    image: input.imageUrl ? [input.imageUrl] : [absoluteUrl("/brand/gasnation-og.png")],
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    ...(input.priceLabel
      ? {
          offers: {
            "@type": "Offer",
            availability: "https://schema.org/InStock",
            url: absoluteUrl(`/products/${input.slug}`),
            priceCurrency: "USD",
            // Schema wants a number; if we only have a display string, omit price.
          },
        }
      : {}),
  };
}
