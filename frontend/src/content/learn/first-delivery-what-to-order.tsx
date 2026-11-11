import { Fragment, type ReactNode } from "react";

import { GuideLink } from "@/components/learn/guide-link";
import type { GuideCard } from "@/components/learn/guide-next-links";
import type { GuideFact } from "@/components/learn/guide-quick-facts";
import type { FaqItem } from "@/content/faqs";

export const FIRST_ORDER_QUICK_FACTS: readonly GuideFact[] = [
  { label: "Checkout", value: "Guest checkout, no account needed" },
  { label: "Delivery fee", value: "Flat $20 on every order" },
  { label: "Payment", value: "Cash at the door" },
  { label: "Bring", value: "21+ ID, in person" },
];

export const FIRST_ORDER_GOALS: readonly GuideCard[] = [
  {
    href: "/categories/indica",
    title: "Wind down at home",
    description:
      "Indica is the usual evening pick. Flower or a pre-roll is an easy start.",
  },
  {
    href: "/categories/sativa",
    title: "Something social",
    description:
      "Sativa is what people tend to reach for when friends are coming over.",
  },
  {
    href: "/categories/hybrid",
    title: "Balanced, or not sure yet",
    description:
      "A hybrid sits in the middle, which makes it an easy first choice.",
  },
  {
    href: "/products",
    title: "Low-key and discreet",
    description:
      "Vapes and edibles have less smell than flower. Find both on the full menu.",
  },
];

export const FIRST_ORDER_AMOUNT_NOTES: readonly ReactNode[] = [
  <Fragment key="small">
    <span className="font-medium text-foreground">Start small.</span> One item,
    or two you want to compare, is enough for a first order. You can order
    again the same day once you know what you like.
  </Fragment>,
  <Fragment key="eighth">
    <span className="font-medium text-foreground">An eighth is the usual
    starter size</span> for flower. It is enough to get a feel for a strain
    without buying a big jar.
  </Fragment>,
  <Fragment key="fee">
    <span className="font-medium text-foreground">Remember the $20 fee.</span>{" "}
    Every order pays it, so one combined order costs less than two small ones.
  </Fragment>,
  <Fragment key="limit">
    <span className="font-medium text-foreground">The limit.</span> Customers
    may order up to 8 ounces of dry flower in any 30-day rolling period.
  </Fragment>,
];

export const FIRST_ORDER_FORMATS: readonly ReactNode[] = [
  <Fragment key="flower">
    <span className="font-medium text-foreground">Flower:</span> the biggest
    selection, with the strain type on every listing. Shop{" "}
    <GuideLink href="/categories/flower">all flower</GuideLink>.
  </Fragment>,
  <Fragment key="prerolls">
    <span className="font-medium text-foreground">Pre-rolls:</span> flower
    that is already rolled. You do not need a grinder or papers.
  </Fragment>,
  <Fragment key="vapes">
    <span className="font-medium text-foreground">Vapes:</span> carts and
    disposables. Less smell than flower.
  </Fragment>,
  <Fragment key="edibles">
    <span className="font-medium text-foreground">Edibles:</span> take longer
    to kick in and last longer. Start with a small piece and wait before
    having more.
  </Fragment>,
  <Fragment key="concentrates">
    <span className="font-medium text-foreground">Concentrates:</span> live
    resin, rosin, and similar. Much stronger per hit, so most people try them
    on a later order.
  </Fragment>,
];

export const FIRST_ORDER_CHECKLIST = [
  "A valid 21+ government ID: driver's license, state ID, or passport.",
  "Cash for the order total plus the $20 delivery fee, ideally close to exact.",
  "You at the address in person. Nobody else can accept the order for you.",
  "A delivery note at checkout if the driver needs a gate code, buzzer, or room number.",
] as const;

export const FIRST_ORDER_FAQS: readonly FaqItem[] = [
  {
    question: "Do I need an account to place my first order?",
    answer:
      "No. Guest checkout works. Creating an account just saves your addresses so reorders are faster.",
  },
  {
    question: "Is the first delivery free?",
    answer:
      "No. Every order includes a flat $20 delivery fee. Free delivery applies only when you redeem a free-delivery coupon issued by Gas Nation.",
  },
  {
    question: "What should I order if I have never tried cannabis?",
    answer:
      "Start with a single pre-roll or a small amount of hybrid flower, and go slow. If you choose an edible, start with a small piece and wait before having more.",
  },
  {
    question: "How do I pay?",
    answer:
      "Gas Nation is cash only. Pay the driver when your order arrives. Tips are cash too and always appreciated.",
  },
  {
    question: "What if something is wrong with my order?",
    answer:
      "Returns are accepted within 7 days of purchase only if the product has a manufacturer defect. If you are dissatisfied for any reason, contact us and we will make things right.",
  },
];

export const FIRST_ORDER_EXTRA_NEXT_LINKS: readonly GuideCard[] = [
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
  {
    href: "/delivery",
    title: "Delivery areas",
    description: "Make sure we cover your address before you check out.",
  },
];
