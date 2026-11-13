import type { Metadata } from "next";

import type { GuideCard } from "@/components/learn/guide-next-links";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export type LearnGuide = {
  slug: string;
  /** H1 on the guide page. */
  title: string;
  /** Short label for breadcrumbs and cards. */
  navLabel: string;
  metaTitle: string;
  metaDescription: string;
  /** One-line pitch used on the hub and sibling cards. */
  summary: string;
};

export const LEARN_GUIDES: readonly LearnGuide[] = [
  {
    slug: "how-delivery-works",
    title: "How a Wixked Nation run gets to your door",
    navLabel: "How a run works",
    metaTitle: "How a Wixked Nation Run Gets to Your Door",
    metaDescription:
      "Order online from 10 AM to 10 PM. Flat $20 delivery, cash at the door, 21+ ID, no medical card. How Wixked Nation delivery works in Ohio.",
    summary:
      "Hours, the flat $20 fee, cash at the door, ID rules, and what happens from checkout to doorstep.",
  },
  {
    slug: "first-delivery-what-to-order",
    title: "What to put on your first Wixked Nation order",
    navLabel: "Your first order",
    metaTitle: "What to Put on Your First Wixked Nation Order",
    metaDescription:
      "New to Wixked Nation? Pick indica, sativa, or hybrid based on your plans, see how much to buy, and work out your cash total with the $20 delivery fee.",
    summary:
      "Picking by your plans for the night, how much to buy, and a sample first order with the cash total.",
  },
  {
    slug: "indica-vs-sativa-vs-hybrid",
    title: "Indica, sativa, or hybrid for tonight",
    navLabel: "Indica, sativa, or hybrid",
    metaTitle: "Indica, Sativa, or Hybrid for Tonight | Wixked Nation",
    metaDescription:
      "What indica, sativa, and hybrid strains are usually chosen for, how to pick one for your evening, and where to find each on the Wixked Nation menu.",
    summary:
      "What each strain type is usually chosen for and how to match one to your evening.",
  },
  {
    slug: "is-weed-delivery-legal-ohio",
    title: "Who can order from Wixked Nation in Ohio",
    navLabel: "Who can order",
    metaTitle: "Who Can Order from Wixked Nation in Ohio",
    metaDescription:
      "Who can order Wixked Nation delivery in Ohio: 21+ with valid ID, no medical card, visitors welcome, 8 oz per 30 days, and you must be there in person.",
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
