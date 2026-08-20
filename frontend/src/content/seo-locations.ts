export type SeoLocationKind = "region" | "city" | "neighborhood";

export type SeoLocation = {
  slug: string;
  name: string;
  kind: SeoLocationKind;
  area: string;
  blurb: string;
  h1?: string;
  title?: string;
};

/** Local landing pages for cannabis / weed delivery keywords. */
export const SEO_LOCATIONS: SeoLocation[] = [
  {
    slug: "virginia",
    name: "Virginia",
    kind: "region",
    area: "Virginia and the DMV",
    h1: "Weed delivery in Virginia",
    title: "Weed Delivery Virginia | Cannabis & Marijuana Delivery | Gas Nation",
    blurb:
      "Weed delivery in Virginia from Gas Nation. Same-day cannabis delivery and marijuana delivery across Northern Virginia, with service into Washington, DC. Order online, 21+, no medical card required.",
  },
  {
    slug: "northern-virginia",
    name: "Northern Virginia",
    kind: "region",
    area: "NoVA and the DC metro",
    h1: "Weed delivery in north Virginia",
    title: "Weed Delivery in North Virginia | Northern Virginia & NoVA | Gas Nation",
    blurb:
      "Looking for weed delivery in north Virginia? Gas Nation offers same-day cannabis delivery and marijuana delivery across Northern Virginia (NoVA) — from Arlington and Alexandria through Fairfax, Loudoun, and Prince William. Order weed online with discreet drop-off 10 AM–10 PM. No medical card required.",
  },
  {
    slug: "washington-dc",
    name: "Washington, DC",
    kind: "region",
    area: "Washington, DC",
    h1: "DC weed delivery",
    title: "DC Weed Delivery | Weed Delivery DC | Same-Day Cannabis | Gas Nation",
    blurb:
      "DC weed delivery and weed delivery DC from Gas Nation. Same-day cannabis delivery and marijuana delivery to Washington, DC addresses. Flat $20 fee, cash on delivery, 21+ ID at the door.",
  },
  {
    slug: "mclean",
    name: "McLean",
    kind: "city",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Cannabis delivery in McLean, VA near Tysons and the GW Parkway. Discreet same-day weed delivery to McLean homes and offices.",
  },
  {
    slug: "reston",
    name: "Reston",
    kind: "city",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Weed delivery in Reston, including Reston Town Center. Same-day cannabis delivery across Reston with flower, edibles, and vapes on the menu.",
  },
  {
    slug: "ashburn",
    name: "Ashburn",
    kind: "city",
    area: "Loudoun County, Northern Virginia",
    blurb:
      "Cannabis delivery in Ashburn and nearby Loudoun neighborhoods. Order online for same-day weed delivery in Ashburn, VA.",
  },
  {
    slug: "sterling",
    name: "Sterling",
    kind: "city",
    area: "Loudoun County, Northern Virginia",
    blurb:
      "Weed delivery in Sterling, VA. Same-day cannabis delivery near Route 7 and Dulles Town Center with a flat $20 fee.",
  },
  {
    slug: "leesburg",
    name: "Leesburg",
    kind: "city",
    area: "Loudoun County, Northern Virginia",
    blurb:
      "Cannabis delivery in Leesburg, VA. Same-day discreet weed delivery to Leesburg addresses from our online dispensary menu.",
  },
  {
    slug: "chantilly",
    name: "Chantilly",
    kind: "city",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Weed delivery in Chantilly near Sully and Route 50. Same-day cannabis delivery for Chantilly, VA homes and hotels.",
  },
  {
    slug: "herndon",
    name: "Herndon",
    kind: "city",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Cannabis delivery in Herndon, VA. Same-day weed delivery near downtown Herndon and the Dulles Toll Road corridor.",
  },
  {
    slug: "centreville",
    name: "Centreville",
    kind: "city",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Weed delivery in Centreville, VA. Order flower, edibles, and carts online for same-day cannabis delivery in Centreville.",
  },
  {
    slug: "fairfax",
    name: "Fairfax",
    kind: "city",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Cannabis delivery in Fairfax, VA — City of Fairfax and nearby Fairfax County. Same-day weed delivery from GasNation.",
  },
  {
    slug: "burke",
    name: "Burke",
    kind: "city",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Weed delivery in Burke, VA. Same-day cannabis delivery to Burke and neighboring Springfield / Fairfax addresses.",
  },
  {
    slug: "springfield",
    name: "Springfield",
    kind: "city",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Cannabis delivery in Springfield, VA including West Springfield. Same-day discreet weed delivery along the Beltway and Franconia corridor.",
  },
  {
    slug: "alexandria",
    name: "Alexandria",
    kind: "city",
    area: "Northern Virginia",
    blurb:
      "Weed delivery in Alexandria, VA. Same-day cannabis delivery to Alexandria, including areas near Old Town, Kingstowne, and the Eisenhower Valley.",
  },
  {
    slug: "annandale",
    name: "Annandale",
    kind: "city",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Cannabis delivery in Annandale, VA. Same-day weed delivery near Little River Turnpike and the Annandale commercial corridor.",
  },
  {
    slug: "arlington",
    name: "Arlington",
    kind: "city",
    area: "Arlington County, Northern Virginia",
    blurb:
      "Cannabis delivery in Arlington, VA. Same-day weed delivery across Arlington, including Clarendon, Ballston, Rosslyn, and Crystal City.",
  },
  {
    slug: "lorton",
    name: "Lorton",
    kind: "city",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Weed delivery in Lorton, VA. Same-day cannabis delivery near Lorton Station and the I-95 corridor.",
  },
  {
    slug: "woodbridge",
    name: "Woodbridge",
    kind: "city",
    area: "Prince William County, Northern Virginia",
    blurb:
      "Cannabis delivery in Woodbridge, VA. Same-day weed delivery to Woodbridge, Lake Ridge, and nearby Prince William addresses.",
  },
  {
    slug: "dumfries",
    name: "Dumfries",
    kind: "city",
    area: "Prince William County, Northern Virginia",
    blurb:
      "Weed delivery in Dumfries, VA. Same-day cannabis delivery along the Quantico / I-95 stretch of Prince William County.",
  },
  {
    slug: "stafford",
    name: "Stafford",
    kind: "city",
    area: "Stafford County, Northern Virginia",
    blurb:
      "Cannabis delivery in Stafford, VA. Same-day weed delivery across Stafford County from our online menu.",
  },
  {
    slug: "fredericksburg",
    name: "Fredericksburg",
    kind: "city",
    area: "Northern Virginia",
    blurb:
      "Weed delivery in Fredericksburg, VA. Same-day cannabis delivery when your address is in our Fredericksburg / Spotsylvania service area.",
  },
  {
    slug: "haymarket",
    name: "Haymarket",
    kind: "city",
    area: "Prince William County, Northern Virginia",
    blurb:
      "Cannabis delivery in Haymarket, VA. Same-day discreet weed delivery near I-66 and the Haymarket / Gainesville area.",
  },
  {
    slug: "gainesville",
    name: "Gainesville",
    kind: "city",
    area: "Prince William County, Northern Virginia",
    blurb:
      "Weed delivery in Gainesville, VA. Same-day cannabis delivery to Gainesville and neighboring Haymarket and Bristow.",
  },
  {
    slug: "clifton",
    name: "Clifton",
    kind: "city",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Cannabis delivery in Clifton, VA. Same-day weed delivery to Clifton and nearby Centreville / Fairfax addresses.",
  },
  {
    slug: "manassas",
    name: "Manassas",
    kind: "city",
    area: "Prince William County, Northern Virginia",
    blurb:
      "Weed delivery in Manassas, VA. Same-day cannabis delivery in Manassas and nearby Manassas Park / Yorkshire.",
  },
  {
    slug: "vienna",
    name: "Vienna",
    kind: "city",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Weed delivery in Vienna, VA. Same-day cannabis delivery to Vienna homes and offices near Tysons, Maple Avenue, and the Metro.",
  },
  {
    slug: "oakton",
    name: "Oakton",
    kind: "city",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Cannabis delivery in Oakton, VA. Same-day weed delivery between Vienna, Fairfax, and Reston.",
  },
  {
    slug: "great-falls",
    name: "Great Falls",
    kind: "city",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Weed delivery in Great Falls, VA. Discreet same-day cannabis delivery to Great Falls and nearby McLean.",
  },
  {
    slug: "aldie",
    name: "Aldie",
    kind: "city",
    area: "Loudoun County, Northern Virginia",
    blurb:
      "Cannabis delivery in Aldie, VA. Same-day weed delivery near South Riding, Chantilly, and the Route 50 corridor.",
  },
  {
    slug: "old-town-alexandria",
    name: "Old Town Alexandria",
    kind: "neighborhood",
    area: "Alexandria, Northern Virginia",
    blurb:
      "Cannabis delivery in Old Town Alexandria. Discreet same-day weed delivery to Old Town streets, waterfront stays, and nearby hotels.",
  },
  {
    slug: "crystal-city",
    name: "Crystal City",
    kind: "neighborhood",
    area: "Arlington, Northern Virginia",
    blurb:
      "Weed delivery in Crystal City / National Landing. Same-day cannabis delivery to Crystal City apartments, hotels, and offices.",
  },
  {
    slug: "ballston",
    name: "Ballston",
    kind: "neighborhood",
    area: "Arlington, Northern Virginia",
    blurb:
      "Cannabis delivery in Ballston. Same-day weed delivery near Ballston Quarter and the Orange/Silver Line corridor.",
  },
  {
    slug: "rosslyn",
    name: "Rosslyn",
    kind: "neighborhood",
    area: "Arlington, Northern Virginia",
    blurb:
      "Weed delivery in Rosslyn. Same-day cannabis delivery to Rosslyn high-rises, hotels, and the Key Bridge area.",
  },
  {
    slug: "clarendon",
    name: "Clarendon",
    kind: "neighborhood",
    area: "Arlington, Northern Virginia",
    blurb:
      "Cannabis delivery in Clarendon. Same-day discreet weed delivery along Clarendon and nearby Courthouse.",
  },
  {
    slug: "tysons",
    name: "Tysons",
    kind: "neighborhood",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Cannabis delivery in Tysons. Same-day weed delivery around Tysons, including offices, residences, and hotels off the Beltway.",
  },
  {
    slug: "tysons-corner",
    name: "Tysons Corner",
    kind: "neighborhood",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Weed delivery in Tysons Corner. Same-day cannabis delivery near Tysons Corner Center, Tysons Galleria, and the Silver Line.",
  },
  {
    slug: "mosaic-district",
    name: "Mosaic District",
    kind: "neighborhood",
    area: "Fairfax, Northern Virginia",
    blurb:
      "Cannabis delivery in the Mosaic District. Same-day weed delivery to Mosaic apartments, hotels, and nearby Merrifield.",
  },
  {
    slug: "kingstowne",
    name: "Kingstowne",
    kind: "neighborhood",
    area: "Alexandria / Fairfax County",
    blurb:
      "Weed delivery in Kingstowne. Same-day cannabis delivery to Kingstowne and nearby Franconia / Alexandria addresses.",
  },
  {
    slug: "south-riding",
    name: "South Riding",
    kind: "neighborhood",
    area: "Loudoun County, Northern Virginia",
    blurb:
      "Cannabis delivery in South Riding. Same-day weed delivery across South Riding and nearby Chantilly / Aldie.",
  },
  {
    slug: "broadlands",
    name: "Broadlands",
    kind: "neighborhood",
    area: "Loudoun County, Northern Virginia",
    blurb:
      "Weed delivery in Broadlands. Same-day cannabis delivery to Broadlands and nearby Ashburn addresses.",
  },
  {
    slug: "bristow",
    name: "Bristow",
    kind: "neighborhood",
    area: "Prince William County, Northern Virginia",
    blurb:
      "Cannabis delivery in Bristow. Same-day weed delivery near Bristow and the Gainesville / Manassas corridor.",
  },
  {
    slug: "lake-ridge",
    name: "Lake Ridge",
    kind: "neighborhood",
    area: "Prince William County, Northern Virginia",
    blurb:
      "Weed delivery in Lake Ridge. Same-day cannabis delivery to Lake Ridge and nearby Woodbridge.",
  },
  {
    slug: "occoquan",
    name: "Occoquan",
    kind: "neighborhood",
    area: "Prince William County, Northern Virginia",
    blurb:
      "Cannabis delivery in Occoquan. Same-day discreet weed delivery to Occoquan and the surrounding waterfront area.",
  },
  {
    slug: "dale-city",
    name: "Dale City",
    kind: "neighborhood",
    area: "Prince William County, Northern Virginia",
    blurb:
      "Weed delivery in Dale City. Same-day cannabis delivery across Dale City and nearby Woodbridge.",
  },
  {
    slug: "fair-lakes",
    name: "Fair Lakes",
    kind: "neighborhood",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Cannabis delivery in Fair Lakes. Same-day weed delivery near Fair Lakes and the I-66 / West Ox area.",
  },
  {
    slug: "seven-corners",
    name: "Seven Corners",
    kind: "neighborhood",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Weed delivery in Seven Corners. Same-day cannabis delivery near Seven Corners, Falls Church, and Bailey’s Crossroads.",
  },
  {
    slug: "falls-church",
    name: "Falls Church",
    kind: "neighborhood",
    area: "Northern Virginia",
    blurb:
      "Cannabis delivery in Falls Church, VA. Same-day weed delivery to Falls Church and nearby Seven Corners / Arlington edges.",
  },
  {
    slug: "baileys-crossroads",
    name: "Baileys Crossroads",
    kind: "neighborhood",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Weed delivery in Bailey’s Crossroads. Same-day cannabis delivery near Columbia Pike and Route 7.",
  },
  {
    slug: "west-springfield",
    name: "West Springfield",
    kind: "neighborhood",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Cannabis delivery in West Springfield. Same-day weed delivery to West Springfield and nearby Burke / Springfield.",
  },
  {
    slug: "pentagon-city",
    name: "Pentagon City",
    kind: "neighborhood",
    area: "Arlington, Northern Virginia",
    blurb:
      "Weed delivery in Pentagon City. Same-day cannabis delivery to Pentagon City apartments, hotels, and the Fashion Centre area.",
  },
  {
    slug: "national-landing",
    name: "National Landing",
    kind: "neighborhood",
    area: "Arlington, Northern Virginia",
    blurb:
      "Cannabis delivery in National Landing. Same-day weed delivery across National Landing, including Crystal City and Pentagon City.",
  },
  {
    slug: "del-ray",
    name: "Del Ray",
    kind: "neighborhood",
    area: "Alexandria, Northern Virginia",
    blurb:
      "Weed delivery in Del Ray, Alexandria. Same-day cannabis delivery along Mount Vernon Avenue and nearby Old Town.",
  },
  {
    slug: "merrifield",
    name: "Merrifield",
    kind: "neighborhood",
    area: "Fairfax County, Northern Virginia",
    blurb:
      "Cannabis delivery in Merrifield, VA. Same-day weed delivery near the Mosaic District, Dunn Loring, and I-66.",
  },
];

export const PRODUCT_SEO_LINKS = [
  { label: "Buy flower online", href: "/categories/flower" },
  { label: "Indica flower delivery", href: "/categories/indica" },
  { label: "Sativa flower delivery", href: "/categories/sativa" },
  { label: "Hybrid flower delivery", href: "/categories/hybrid" },
  { label: "Premium flower", href: "/categories/flower" },
  { label: "Pre-rolls", href: "/products" },
  { label: "Edibles delivery", href: "/products" },
  { label: "THC gummies delivery", href: "/products" },
  { label: "Vape cartridge delivery", href: "/products" },
  { label: "Disposable vape delivery", href: "/products" },
  { label: "Concentrates", href: "/products" },
  { label: "Live resin delivery", href: "/products" },
  { label: "Rosin delivery", href: "/products" },
  { label: "Accessories", href: "/products" },
] as const;

export function getSeoLocation(slug: string): SeoLocation | undefined {
  return SEO_LOCATIONS.find((item) => item.slug === slug);
}

export function locationHrefByName(name: string): string | undefined {
  const normalized = name.trim().toLowerCase();
  const match = SEO_LOCATIONS.find((item) => item.name.toLowerCase() === normalized);
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

export function locationPageTitle(location: SeoLocation): string {
  if (location.title) {
    return location.title;
  }
  if (location.kind === "region") {
    return `Cannabis Delivery in ${location.name} | Same-Day Weed Delivery`;
  }
  return `Cannabis Delivery in ${location.name} | Weed Delivery ${location.name}`;
}

export function locationPageDescription(location: SeoLocation): string {
  return `${location.blurb} Flat $20 delivery, 10 AM–10 PM daily, cash on delivery. 21+ with valid ID. Gas Nation online dispensary.`;
}
