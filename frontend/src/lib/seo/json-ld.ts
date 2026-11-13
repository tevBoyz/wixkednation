import {
  SITE_ALTERNATE_NAMES,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/config/brand";
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
    alternateName: [...SITE_ALTERNATE_NAMES],
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/wixkednation-mark-v3.png"),
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
    alternateName: [...SITE_ALTERNATE_NAMES],
    url: absoluteUrl("/"),
    description: SITE_TAGLINE,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      alternateName: [...SITE_ALTERNATE_NAMES],
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/products")}?search={search_term_string}`,
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
    alternateName: [...SITE_ALTERNATE_NAMES],
    url: absoluteUrl("/"),
    image: absoluteUrl("/brand/wixkednation-og.png"),
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
      { "@type": "State", name: "Ohio" },
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

export function buildArticleJsonLd(input: {
  title: string;
  description: string;
  slug: string;
  imageUrl?: string | null;
  publishedAt?: string | null;
  modifiedAt?: string | null;
  authorName?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url: absoluteUrl(`/blog/${input.slug}`),
    image: input.imageUrl
      ? [input.imageUrl]
      : [absoluteUrl("/brand/wixkednation-og.png")],
    datePublished: input.publishedAt || undefined,
    dateModified: input.modifiedAt || input.publishedAt || undefined,
    author: {
      "@type": "Person",
      name: input.authorName?.trim() || SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/brand/wixkednation-mark-v3.png"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/blog/${input.slug}`),
    },
  };
}

export function buildTagCollectionJsonLd(input: {
  name: string;
  description: string;
  slug: string;
  posts: Array<{ title: string; slug: string }>;
}) {
  const pageUrl = absoluteUrl(`/tag/${input.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: input.posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/blog/${post.slug}`),
        name: post.title,
      })),
    },
  };
}

export function buildCollectionPageJsonLd(input: {
  name: string;
  description: string;
  path: string;
  items: Array<{ name: string; path: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: input.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(item.path),
        name: item.name,
      })),
    },
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
    image: input.imageUrl ? [input.imageUrl] : [absoluteUrl("/brand/wixkednation-og.png")],
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
