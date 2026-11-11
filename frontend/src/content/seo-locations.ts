export type SeoLocationKind = "region" | "city" | "neighborhood";

export type SeoLocation = {
  slug: string;
  name: string;
  kind: SeoLocationKind;
  /** Broader geography shown on the page (county / metro). */
  area: string;
  /** Unique intro copy — avoid synonym stuffing across pages. */
  blurb: string;
  h1?: string;
  title?: string;
};

/**
 * Local landing pages for weed delivery SEO.
 * Kept to high-intent cities/neighborhoods only — thin doorway pages removed.
 */
export const SEO_LOCATIONS: SeoLocation[] = [
  {
    slug: "northern-virginia",
    name: "Northern Virginia",
    kind: "region",
    area: "NoVA / DC metro",
    h1: "Weed delivery in Northern Virginia",
    title: "Weed Delivery in Northern Virginia | Same-Day | Gas Nation",
    blurb:
      "Gas Nation delivers same-day across Northern Virginia (NoVA): Arlington, Alexandria, Fairfax, Loudoun, and Prince William. Order online 10 AM–10 PM, flat $20, cash on delivery, 21+ ID. No medical card required.",
  },
  {
    slug: "washington-dc",
    name: "Washington, DC",
    kind: "region",
    area: "Washington, DC",
    h1: "Weed delivery in Washington, DC",
    title: "Weed Delivery in Washington, DC | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery to Washington, DC addresses from Gas Nation (gasnationweed.com). Flat $20 fee, cash on delivery, 21+ ID at the door. Order flower, edibles, vapes, and more online.",
  },
  {
    slug: "virginia",
    name: "Virginia",
    kind: "region",
    area: "Virginia & the DMV",
    h1: "Weed delivery in Virginia",
    title: "Weed Delivery in Virginia | Same-Day NoVA & DC | Gas Nation",
    blurb:
      "Gas Nation focuses on same-day delivery in Northern Virginia and into Washington, DC. Browse the online menu, check out, and meet the driver with cash and a valid 21+ ID.",
  },
  {
    slug: "arlington",
    name: "Arlington",
    kind: "city",
    area: "Arlington County, VA",
    h1: "Weed delivery in Arlington, VA",
    title: "Weed Delivery in Arlington, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Arlington, VA — Clarendon, Ballston, Rosslyn, Crystal City, and nearby corridors. Order from Gas Nation online; discreet drop-off 10 AM–10 PM with a flat $20 fee.",
  },
  {
    slug: "alexandria",
    name: "Alexandria",
    kind: "city",
    area: "Northern Virginia",
    h1: "Weed delivery in Alexandria, VA",
    title: "Weed Delivery in Alexandria, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Alexandria, VA including Old Town, Del Ray, Kingstowne, and the Eisenhower corridor. Gas Nation brings the menu to your door with cash on delivery and 21+ ID check.",
  },
  {
    slug: "fairfax",
    name: "Fairfax",
    kind: "city",
    area: "Fairfax County, VA",
    h1: "Weed delivery in Fairfax, VA",
    title: "Weed Delivery in Fairfax, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Fairfax, VA — City of Fairfax and nearby Fairfax County addresses. Order flower, edibles, and vapes online from Gas Nation; flat $20, 10 AM–10 PM.",
  },
  {
    slug: "mclean",
    name: "McLean",
    kind: "city",
    area: "Fairfax County, VA",
    h1: "Weed delivery in McLean, VA",
    title: "Weed Delivery in McLean, VA | Same-Day | Gas Nation",
    blurb:
      "Discreet same-day weed delivery in McLean, VA near Tysons and the GW Parkway. Gas Nation delivers to homes and offices with cash on delivery and valid 21+ ID.",
  },
  {
    slug: "reston",
    name: "Reston",
    kind: "city",
    area: "Fairfax County, VA",
    h1: "Weed delivery in Reston, VA",
    title: "Weed Delivery in Reston, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Reston, VA including Reston Town Center and nearby neighborhoods. Browse Gas Nation’s menu online and schedule discreet delivery 10 AM–10 PM.",
  },
  {
    slug: "ashburn",
    name: "Ashburn",
    kind: "city",
    area: "Loudoun County, VA",
    h1: "Weed delivery in Ashburn, VA",
    title: "Weed Delivery in Ashburn, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Ashburn, VA and nearby Loudoun neighborhoods. Order from Gas Nation’s online dispensary — flat $20 fee, cash on delivery, 21+.",
  },
  {
    slug: "springfield",
    name: "Springfield",
    kind: "city",
    area: "Fairfax County, VA",
    h1: "Weed delivery in Springfield, VA",
    title: "Weed Delivery in Springfield, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Springfield and West Springfield, VA along the Beltway and Franconia corridor. Gas Nation: online menu, flat $20, cash on delivery.",
  },
  {
    slug: "vienna",
    name: "Vienna",
    kind: "city",
    area: "Fairfax County, VA",
    h1: "Weed delivery in Vienna, VA",
    title: "Weed Delivery in Vienna, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Vienna, VA near Maple Avenue, the Metro, and Tysons. Order online with Gas Nation for discreet drop-off 10 AM–10 PM.",
  },
  {
    slug: "falls-church",
    name: "Falls Church",
    kind: "city",
    area: "Northern Virginia",
    h1: "Weed delivery in Falls Church, VA",
    title: "Weed Delivery in Falls Church, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Falls Church, VA and nearby Seven Corners. Gas Nation delivers from an online menu with cash on delivery and 21+ ID at the door.",
  },
  {
    slug: "woodbridge",
    name: "Woodbridge",
    kind: "city",
    area: "Prince William County, VA",
    h1: "Weed delivery in Woodbridge, VA",
    title: "Weed Delivery in Woodbridge, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Woodbridge, VA including Lake Ridge and nearby Prince William addresses. Flat $20 from Gas Nation, cash on delivery, 21+.",
  },
  {
    slug: "manassas",
    name: "Manassas",
    kind: "city",
    area: "Prince William County, VA",
    h1: "Weed delivery in Manassas, VA",
    title: "Weed Delivery in Manassas, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Manassas, VA and nearby Manassas Park. Order online from Gas Nation — discreet delivery, flat $20, cash only.",
  },
  {
    slug: "herndon",
    name: "Herndon",
    kind: "city",
    area: "Fairfax County, VA",
    h1: "Weed delivery in Herndon, VA",
    title: "Weed Delivery in Herndon, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Herndon, VA near downtown and the Dulles Toll Road. Gas Nation online ordering with cash on delivery and 21+ ID.",
  },
  {
    slug: "sterling",
    name: "Sterling",
    kind: "city",
    area: "Loudoun County, VA",
    h1: "Weed delivery in Sterling, VA",
    title: "Weed Delivery in Sterling, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Sterling, VA near Route 7 and Dulles Town Center. Flat $20 fee from Gas Nation; order flower, edibles, and vapes online.",
  },
  {
    slug: "leesburg",
    name: "Leesburg",
    kind: "city",
    area: "Loudoun County, VA",
    h1: "Weed delivery in Leesburg, VA",
    title: "Weed Delivery in Leesburg, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Leesburg, VA from Gas Nation’s online menu. Discreet drop-off 10 AM–10 PM, flat $20, cash on delivery, 21+.",
  },
  {
    slug: "chantilly",
    name: "Chantilly",
    kind: "city",
    area: "Fairfax County, VA",
    h1: "Weed delivery in Chantilly, VA",
    title: "Weed Delivery in Chantilly, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Chantilly, VA near Sully and Route 50. Gas Nation delivers to homes and hotels with cash on delivery and valid 21+ ID.",
  },
  {
    slug: "annandale",
    name: "Annandale",
    kind: "city",
    area: "Fairfax County, VA",
    h1: "Weed delivery in Annandale, VA",
    title: "Weed Delivery in Annandale, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Annandale, VA near Little River Turnpike. Order online from Gas Nation — flat $20, cash on delivery, 10 AM–10 PM.",
  },
  {
    slug: "centreville",
    name: "Centreville",
    kind: "city",
    area: "Fairfax County, VA",
    h1: "Weed delivery in Centreville, VA",
    title: "Weed Delivery in Centreville, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Centreville, VA along Route 28 and the Sully District. Gas Nation brings flower, edibles, and vapes to your door — flat $20, cash on delivery, 21+.",
  },
  {
    slug: "stafford",
    name: "Stafford",
    kind: "city",
    area: "Stafford County, VA",
    h1: "Weed delivery in Stafford, VA",
    title: "Weed Delivery in Stafford, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Stafford, VA along the I-95 corridor and Quantico area. Order online from Gas Nation — discreet drop-off, flat $20, cash on delivery, 21+ ID.",
  },
  {
    slug: "fredericksburg",
    name: "Fredericksburg",
    kind: "city",
    area: "Spotsylvania & Fredericksburg, VA",
    h1: "Weed delivery in Fredericksburg, VA",
    title: "Weed Delivery in Fredericksburg, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Fredericksburg, VA and nearby Spotsylvania addresses. Browse Gas Nation’s online menu for flower, edibles, and vapes — flat $20, 10 AM–10 PM.",
  },
  {
    slug: "gainesville",
    name: "Gainesville",
    kind: "city",
    area: "Prince William County, VA",
    h1: "Weed delivery in Gainesville, VA",
    title: "Weed Delivery in Gainesville, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Gainesville, VA near Route 29 and the Prince William Parkway. Gas Nation online ordering with cash on delivery and valid 21+ ID.",
  },
  {
    slug: "haymarket",
    name: "Haymarket",
    kind: "city",
    area: "Prince William County, VA",
    h1: "Weed delivery in Haymarket, VA",
    title: "Weed Delivery in Haymarket, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Haymarket, VA and western Prince William neighborhoods. Order from Gas Nation — flat $20 fee, discreet delivery, cash on delivery, 21+.",
  },
  {
    slug: "warrenton",
    name: "Warrenton",
    kind: "city",
    area: "Fauquier County, VA",
    h1: "Weed delivery in Warrenton, VA",
    title: "Weed Delivery in Warrenton, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery in Warrenton, VA and nearby Fauquier County addresses along Route 29. Gas Nation delivers flower, edibles, and vapes — flat $20, cash on delivery, 21+.",
  },
  {
    slug: "old-town-alexandria",
    name: "Old Town Alexandria",
    kind: "neighborhood",
    area: "Alexandria, VA",
    h1: "Weed delivery in Old Town Alexandria",
    title: "Weed Delivery in Old Town Alexandria | Same-Day | Gas Nation",
    blurb:
      "Discreet same-day weed delivery to Old Town Alexandria streets, waterfront stays, and nearby hotels. Gas Nation: online menu, flat $20, cash on delivery, 21+.",
  },
  {
    slug: "national-landing",
    name: "National Landing",
    kind: "neighborhood",
    area: "Arlington, VA",
    h1: "Weed delivery in National Landing",
    title: "Weed Delivery in National Landing | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery across National Landing — Crystal City and Pentagon City apartments, hotels, and offices. Order with Gas Nation online.",
  },
  {
    slug: "ballston",
    name: "Ballston",
    kind: "neighborhood",
    area: "Arlington, VA",
    h1: "Weed delivery in Ballston",
    title: "Weed Delivery in Ballston, Arlington | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery near Ballston Quarter and the Orange/Silver Line. Gas Nation drops off discreetly 10 AM–10 PM with cash on delivery.",
  },
  {
    slug: "clarendon",
    name: "Clarendon",
    kind: "neighborhood",
    area: "Arlington, VA",
    h1: "Weed delivery in Clarendon",
    title: "Weed Delivery in Clarendon, Arlington | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery along Clarendon and nearby Courthouse. Browse Gas Nation’s menu and get discreet delivery with a flat $20 fee.",
  },
  {
    slug: "rosslyn",
    name: "Rosslyn",
    kind: "neighborhood",
    area: "Arlington, VA",
    h1: "Weed delivery in Rosslyn",
    title: "Weed Delivery in Rosslyn, Arlington | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery to Rosslyn high-rises, hotels, and the Key Bridge area. Gas Nation: online order, cash on delivery, 21+ ID.",
  },
  {
    slug: "tysons",
    name: "Tysons",
    kind: "neighborhood",
    area: "Fairfax County, VA",
    h1: "Weed delivery in Tysons",
    title: "Weed Delivery in Tysons, VA | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery around Tysons Corner Center, the Galleria, and nearby offices and residences. Flat $20 from Gas Nation, cash on delivery.",
  },
  {
    slug: "mosaic-district",
    name: "Mosaic District",
    kind: "neighborhood",
    area: "Fairfax / Merrifield, VA",
    h1: "Weed delivery in the Mosaic District",
    title: "Weed Delivery in Mosaic District | Same-Day | Gas Nation",
    blurb:
      "Same-day weed delivery to Mosaic District apartments, hotels, and nearby Merrifield. Order online with Gas Nation — discreet, flat $20, 21+.",
  },
];

export type SeoClusterId =
  | "region"
  | "arlington-metro"
  | "alexandria"
  | "fairfax-county"
  | "loudoun"
  | "prince-william"
  | "stafford-fredericksburg"
  | "fauquier";

const SEO_SLUG_CLUSTER: Record<string, SeoClusterId> = {
  "northern-virginia": "region",
  virginia: "region",
  "washington-dc": "region",
  arlington: "arlington-metro",
  ballston: "arlington-metro",
  clarendon: "arlington-metro",
  rosslyn: "arlington-metro",
  "national-landing": "arlington-metro",
  alexandria: "alexandria",
  "old-town-alexandria": "alexandria",
  fairfax: "fairfax-county",
  "falls-church": "fairfax-county",
  annandale: "fairfax-county",
  springfield: "fairfax-county",
  vienna: "fairfax-county",
  mclean: "fairfax-county",
  chantilly: "fairfax-county",
  centreville: "fairfax-county",
  herndon: "fairfax-county",
  reston: "fairfax-county",
  tysons: "fairfax-county",
  "mosaic-district": "fairfax-county",
  ashburn: "loudoun",
  sterling: "loudoun",
  leesburg: "loudoun",
  manassas: "prince-william",
  woodbridge: "prince-william",
  gainesville: "prince-william",
  haymarket: "prince-william",
  stafford: "stafford-fredericksburg",
  fredericksburg: "stafford-fredericksburg",
  warrenton: "fauquier",
};

const CLUSTER_LABELS: Record<SeoClusterId, string> = {
  region: "Northern Virginia & DC",
  "arlington-metro": "Arlington & National Landing",
  alexandria: "Alexandria",
  "fairfax-county": "Fairfax County",
  loudoun: "Loudoun County",
  "prince-william": "Prince William County",
  "stafford-fredericksburg": "Stafford & Fredericksburg",
  fauquier: "Fauquier County",
};

/** Adjacent clusters shown after the primary cluster on delivery pages. */
const CLUSTER_ADJACENCY: Record<SeoClusterId, SeoClusterId[]> = {
  region: [
    "arlington-metro",
    "alexandria",
    "fairfax-county",
    "loudoun",
    "prince-william",
    "stafford-fredericksburg",
  ],
  "arlington-metro": ["alexandria", "fairfax-county", "region"],
  alexandria: ["arlington-metro", "fairfax-county", "prince-william"],
  "fairfax-county": [
    "arlington-metro",
    "alexandria",
    "loudoun",
    "prince-william",
  ],
  loudoun: ["fairfax-county", "prince-william", "fauquier"],
  "prince-william": [
    "fairfax-county",
    "stafford-fredericksburg",
    "fauquier",
    "alexandria",
  ],
  "stafford-fredericksburg": ["prince-william", "fauquier"],
  fauquier: ["prince-william", "loudoun", "stafford-fredericksburg"],
};

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
  const primaryCluster = SEO_SLUG_CLUSTER[slug] ?? "region";
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
      label: CLUSTER_LABELS[clusterId],
      locations,
    });
  };

  pushCluster(primaryCluster);
  for (const adjacent of CLUSTER_ADJACENCY[primaryCluster] ?? []) {
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
    return `Weed Delivery in ${location.name} | Same-Day | Gas Nation`;
  }
  if (location.name.includes("DC") || location.area.includes("Washington, DC")) {
    return `Weed Delivery in ${location.name} | Same-Day | Gas Nation`;
  }
  return `Weed Delivery in ${location.name}, VA | Same-Day | Gas Nation`;
}

export function locationPageDescription(location: SeoLocation): string {
  return `${location.blurb} Gas Nation online dispensary — gasnationweed.com.`;
}
