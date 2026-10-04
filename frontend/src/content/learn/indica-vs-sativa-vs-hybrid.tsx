import { Fragment, type ReactNode } from "react";

import { GuideLink } from "@/components/learn/guide-link";
import type { GuideCard } from "@/components/learn/guide-next-links";
import type { GuideFact } from "@/components/learn/guide-quick-facts";
import type { FaqItem } from "@/content/faqs";

export type StrainType = {
  name: string;
  href: string;
  shopLabel: string;
  tagline: string;
  oftenChosenFor: string;
  moments: string;
};

export const STRAIN_QUICK_FACTS: readonly GuideFact[] = [
  { label: "Indica", value: "Often chosen for evenings" },
  { label: "Sativa", value: "Often chosen for daytime" },
  { label: "Hybrid", value: "A blend of both" },
  { label: "Best first pick", value: "Hybrid, if you are unsure" },
];

export const STRAIN_TYPES: readonly StrainType[] = [
  {
    name: "Indica",
    href: "/categories/indica",
    shopLabel: "Shop indica",
    tagline: "Usually picked for winding down.",
    oftenChosenFor:
      "Relaxing and feeling it more in the body. Most people reach for indica at the end of the day.",
    moments: "A movie night, a slow Sunday, or settling in before bed.",
  },
  {
    name: "Sativa",
    href: "/categories/sativa",
    shopLabel: "Shop sativa",
    tagline: "Usually picked for daytime and plans.",
    oftenChosenFor:
      "Daytime energy and a more social, head-focused feel. People tend to pick sativa when they still have things to do.",
    moments: "Hanging out with friends, a creative project, or a walk outside.",
  },
  {
    name: "Hybrid",
    href: "/categories/hybrid",
    shopLabel: "Shop hybrid",
    tagline: "A mix of the two.",
    oftenChosenFor:
      "A blend of indica and sativa. Some hybrids lean one way, some lean the other, and many land in between.",
    moments:
      "Nights when you are not sure what you will feel like, or when you want one jar for most occasions.",
  },
];

export const STRAIN_EVENING_PICKS: readonly GuideCard[] = [
  {
    href: "/categories/indica",
    title: "Staying in and winding down",
    description: "Start with indica flower or pre-rolls.",
  },
  {
    href: "/categories/sativa",
    title: "Friends over or heading out",
    description: "Start with sativa. Most people pick it for social plans.",
  },
  {
    href: "/categories/hybrid",
    title: "A bit of both, or no plan yet",
    description: "Start with a hybrid and see where the night goes.",
  },
];

export const STRAIN_FORMAT_NOTES: readonly ReactNode[] = [
  <Fragment key="flower">
    <span className="font-medium text-foreground">Flower and pre-rolls</span>{" "}
    show the strain type most clearly. Browse{" "}
    <GuideLink href="/categories/flower">all flower</GuideLink> and pick a type
    from there.
  </Fragment>,
  <Fragment key="vapes">
    <span className="font-medium text-foreground">Vapes</span> usually list a
    strain name or type as well, so you can choose them the same way.
  </Fragment>,
  <Fragment key="edibles">
    <span className="font-medium text-foreground">Edibles</span> take longer to
    kick in and last longer than smoking or vaping. Start with a small amount
    and wait before having more.
  </Fragment>,
  <Fragment key="concentrates">
    <span className="font-medium text-foreground">Concentrates</span> like live
    resin and rosin are much stronger per hit. Most people try them after a
    few orders, not on the first one.
  </Fragment>,
];

export const STRAIN_FAQS: readonly FaqItem[] = [
  {
    question: "What is the difference between indica and sativa?",
    answer:
      "Indica flower is often chosen for evening and relaxation-oriented effects. Sativa flower is often chosen for daytime energy and focus. Hybrid flower blends both. Browse our menu by strain type to find what fits you, and ask us if you want a recommendation.",
  },
  {
    question: "Which strain type is best for a first order?",
    answer:
      "If you are unsure, start with a hybrid since it sits between the two. If you already know you want to relax at home, most people pick indica. For a social afternoon, most pick sativa.",
  },
  {
    question: "Does a higher THC number mean a better strain?",
    answer:
      "Not always. A higher THC percentage usually means a stronger effect. If you are new or it has been a while, pick a moderate strain and have less of it.",
  },
  {
    question: "Will every indica feel the same?",
    answer:
      "No. The three labels are a good starting point, but strains vary and people react differently. Use the type to narrow your choice, then try what looks good.",
  },
  {
    question: "Can I ask for a recommendation?",
    answer:
      "Yes. Contact us before you order and tell us what you have planned. We can suggest something from today's menu.",
  },
];

export const STRAIN_EXTRA_NEXT_LINKS: readonly GuideCard[] = [
  {
    href: "/categories/flower",
    title: "Shop all flower",
    description: "Every indica, sativa, and hybrid we have in stock today.",
  },
  {
    href: "/categories",
    title: "Shop by category",
    description: "Flower, edibles, vapes, and concentrates.",
  },
  {
    href: "/products",
    title: "Full menu",
    description: "Everything in stock today, delivered same-day.",
  },
];
