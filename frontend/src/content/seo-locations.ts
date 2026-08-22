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

export function nearbySeoLocations(slug: string, limit = 8): SeoLocation[] {
  const current = getSeoLocation(slug);
  if (!current) {
    return SEO_LOCATIONS.slice(0, limit);
  }
  const sameKind = SEO_LOCATIONS.filter(
    (item) => item.slug !== slug && item.kind === current.kind,
  );
  const rest = SEO_LOCATIONS.filter(
    (item) => item.slug !== slug && item.kind !== current.kind,
  );
  return [...sameKind, ...rest].slice(0, limit);
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
