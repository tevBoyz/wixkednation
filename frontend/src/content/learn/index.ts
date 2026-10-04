import type { Metadata } from "next";

import type { GuideCard } from "@/components/learn/guide-next-links";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export type LearnGuide = {
  slug: string;
  /** H1 on the guide page. */
  title: string;
  /** Short label for breadcrumbs and cards. */
  navLabel: string;
  eyebrow: string;
  metaTitle: string;
  metaDescription: string;
  /** One-line pitch used on the hub and sibling cards. */
  summary: string;
};

export const LEARN_GUIDES: readonly LearnGuide[] = [
  {
    slug: "how-delivery-works",
    title: "How same-day weed delivery works with Gas Nation",
    navLabel: "How delivery works",
    eyebrow: "Guide · Same-day delivery",
    metaTitle: "How Same-Day Weed Delivery Works in NoVA & DC | Gas Nation",
    metaDescription:
      "Order online from 10 AM to 10 PM. Flat $20 delivery, cash at the door, 21+ ID, no medical card. How Gas Nation delivery works in Northern Virginia and DC.",
    summary:
      "Hours, the flat $20 fee, cash at the door, ID rules, and what happens from checkout to doorstep.",
  },
  {
    slug: "first-delivery-what-to-order",
    title: "Your first weed delivery: what to order and how much",
    navLabel: "What to order first",
    eyebrow: "Guide · First order",
    metaTitle: "First Weed Delivery? What to Order & How Much | Gas Nation",
    metaDescription:
      "New to Gas Nation? Pick indica, sativa, or hybrid based on your plans, see how much to buy, and work out your cash total with the $20 delivery fee.",
    summary:
      "Picking by your plans for the night, how much to buy, and a sample first order with the cash total.",
  },
  {
    slug: "indica-vs-sativa-vs-hybrid",
    title: "Indica vs sativa vs hybrid: how to choose",
    navLabel: "Indica vs sativa vs hybrid",
    eyebrow: "Guide · Strain types",
    metaTitle: "Indica vs Sativa vs Hybrid: Which to Order | Gas Nation",
    metaDescription:
      "What indica, sativa, and hybrid strains are usually chosen for, how to pick one for your evening, and where to find each on the Gas Nation menu.",
    summary:
      "What each strain type is usually chosen for and how to match one to your evening.",
  },
  {
    slug: "is-weed-delivery-legal-virginia-dc",
    title: "Weed delivery in Virginia and DC: who can order and the rules",
    navLabel: "Who can order",
    eyebrow: "Guide · Ordering rules",
    metaTitle: "Weed Delivery in Virginia & DC: Who Can Order | Gas Nation",
    metaDescription:
      "Who can order Gas Nation delivery in Northern Virginia and DC: 21+ with valid ID, no medical card, visitors welcome, 8 oz per 30 days, and you must be there in person.",
    summary:
      "Age and ID requirements, visitors and hotels, order limits, and receiving the order in person.",
  },
];

export function learnGuidePath(slug: string) {
  return `/learn/${slug}`;
}

export function getLearnGuide(slug: string): LearnGuide {
  const guide = LEARN_GUIDES.find((item) => item.slug === slug);
  if (!guide) {
    throw new Error(`Unknown learn guide: ${slug}`);
  }
  return guide;
}

export function getSiblingGuides(slug: string): LearnGuide[] {
  return LEARN_GUIDES.filter((item) => item.slug !== slug);
}

export function buildGuideMetadata(guide: LearnGuide): Metadata {
  return buildPageMetadata({
    title: guide.metaTitle,
    description: guide.metaDescription,
    path: learnGuidePath(guide.slug),
    absoluteTitle: true,
  });
}

/** Sibling guides first, then page-specific money/next links. */
export function buildGuideNextLinks(
  slug: string,
  extra: readonly GuideCard[],
): GuideCard[] {
  return [
    ...getSiblingGuides(slug).map((guide) => ({
      href: learnGuidePath(guide.slug),
      title: guide.navLabel,
      description: guide.summary,
    })),
    ...extra,
  ];
}
