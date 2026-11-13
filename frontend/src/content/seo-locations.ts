import { DELIVERY_CITIES } from "@/content/delivery-areas";

export type SeoLocationKind = "region" | "city" | "neighborhood";

export type SeoLocation = {
  slug: string;
  name: string;
  kind: SeoLocationKind;
  /** Broader geography shown on the page (state). */
  area: string;
  /** Unique intro copy — avoid synonym stuffing across pages. */
  blurb: string;
  h1?: string;
  title?: string;
};

export function citySlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const OHIO_REGION: SeoLocation = {
  slug: "ohio",
  name: "Ohio",
  kind: "region",
  area: "Ohio",
  h1: "Coverage across Ohio",
  title: "Ohio Coverage | Every City We Drive | Wixked Nation",
  blurb:
    "Wixked Nation delivers same-day across Ohio, including every incorporated city in the state. Order online 10 AM–10 PM, flat $20, cash on delivery, 21+ ID. No medical card required.",
};

function cityLocation(name: string): SeoLocation {
  return {
    slug: citySlug(name),
    name,
    kind: "city",
    area: "Ohio",
    h1: `${name}, Ohio delivery`,
    title: `${name} Delivery Desk | Wixked Nation`,
    blurb: `Same-day weed delivery in ${name}, Ohio from Wixked Nation. Order flower, edibles, vapes, and concentrates online. Flat $20 fee, cash on delivery, 10 AM–10 PM, 21+ with valid ID.`,
  };
}

/**
 * One landing page per incorporated Ohio city, plus the statewide page.
 * Built from DELIVERY_CITIES so the list and the pages stay the same.
 */
export const SEO_LOCATIONS: SeoLocation[] = [
  OHIO_REGION,
  ...DELIVERY_CITIES.map(cityLocation),
];

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export type SeoClusterId = "ohio" | `letter-${string}`;

function clusterIdFor(location: SeoLocation): SeoClusterId {
  if (location.kind === "region") {
    return "ohio";
  }
  const letter = location.name.trim().charAt(0).toUpperCase();
  return `letter-${letter}`;
}

const SEO_SLUG_CLUSTER: Record<string, SeoClusterId> = Object.fromEntries(
  SEO_LOCATIONS.map((location) => [location.slug, clusterIdFor(location)]),
);

function clusterLabel(clusterId: SeoClusterId): string {
  if (clusterId === "ohio") {
    return "Ohio";
  }
  return `Cities starting with ${clusterId.slice("letter-".length)}`;
}

function adjacentClusters(clusterId: SeoClusterId): SeoClusterId[] {
  if (clusterId === "ohio") {
    return LETTERS.map((letter) => `letter-${letter}` as SeoClusterId);
  }
  const letter = clusterId.slice("letter-".length);
  const index = LETTERS.indexOf(letter);
  const neighbors: SeoClusterId[] = ["ohio"];
  if (index > 0) {
    neighbors.push(`letter-${LETTERS[index - 1]}`);
  }
  if (index >= 0 && index < LETTERS.length - 1) {
    neighbors.push(`letter-${LETTERS[index + 1]}`);
  }
  return neighbors;
}

function locationsInCluster(
  clusterId: SeoClusterId,
  excludeSlug: string,
): SeoLocation[] {
  return SEO_LOCATIONS.filter(
    (item) =>
      item.slug !== excludeSlug && SEO_SLUG_CLUSTER[item.slug] === clusterId,
  );
}

export type NearbyDeliveryGroup = {
  clusterId: SeoClusterId;
  label: string;
  locations: SeoLocation[];
};

/** Geographic clusters for internal linking on delivery landing pages. */
export function nearbySeoLocationGroups(slug: string): NearbyDeliveryGroup[] {
  const primaryCluster = SEO_SLUG_CLUSTER[slug] ?? "ohio";
  const groups: NearbyDeliveryGroup[] = [];
  const seenClusters = new Set<SeoClusterId>();

  const pushCluster = (clusterId: SeoClusterId) => {
    if (seenClusters.has(clusterId)) {
      return;
    }
    const locations = locationsInCluster(clusterId, slug);
    if (locations.length === 0) {
      return;
    }
    seenClusters.add(clusterId);
    groups.push({
      clusterId,
      label: clusterLabel(clusterId),
      locations,
    });
  };

  pushCluster(primaryCluster);
  for (const adjacent of adjacentClusters(primaryCluster)) {
    pushCluster(adjacent);
  }

  return groups;
}

/** @deprecated Prefer {@link nearbySeoLocationGroups} for grouped nearby links. */
export function nearbySeoLocations(slug: string, limit = 8): SeoLocation[] {
  return nearbySeoLocationGroups(slug)
    .flatMap((group) => group.locations)
    .slice(0, limit);
}

export const PRODUCT_SEO_LINKS = [
  { label: "Buy flower online", href: "/categories/flower" },
  { label: "Indica flower", href: "/categories/indica" },
  { label: "Sativa flower", href: "/categories/sativa" },
  { label: "Hybrid flower", href: "/categories/hybrid" },
  { label: "Shop all products", href: "/products" },
] as const;

/** Major Ohio cities highlighted on guides. All are in DELIVERY_CITIES. */
export const FEATURED_OHIO_CITY_SLUGS = [
  "ohio",
  "columbus",
  "cleveland",
  "cincinnati",
  "toledo",
  "akron",
  "dayton",
  "youngstown",
] as const;

export function getSeoLocation(slug: string): SeoLocation | undefined {
  return SEO_LOCATIONS.find((item) => item.slug === slug);
}

export function locationHrefByName(name: string): string | undefined {
  const normalized = name.trim().toLowerCase();
  const match = SEO_LOCATIONS.find(
    (item) => item.name.toLowerCase() === normalized,
  );
  return match ? `/delivery/${match.slug}` : undefined;
}

/** Standard SERP title: one intent + place + brand. */
export function locationPageTitle(location: SeoLocation): string {
  if (location.title) {
    return location.title;
  }
  if (location.kind === "region") {
    return `${location.name} Coverage | Wixked Nation`;
  }
  return `${location.name} Delivery Desk | Wixked Nation`;
}

export function locationPageDescription(location: SeoLocation): string {
  return `${location.blurb} Wixked Nation online dispensary — wixkednation.com.`;
}
