import { GuideLink } from "@/components/learn/guide-link";
import type { GuideCard } from "@/components/learn/guide-next-links";
import type { GuideFact } from "@/components/learn/guide-quick-facts";
import type { GuideStep } from "@/components/learn/guide-steps";
import type { FaqItem } from "@/content/faqs";

export const DELIVERY_QUICK_FACTS: readonly GuideFact[] = [
  { label: "Hours", value: "10 AM to 10 PM, seven days" },
  { label: "Delivery fee", value: "Flat $20 on every order" },
  { label: "Payment", value: "Cash on delivery" },
  { label: "ID", value: "21+ government ID, no medical card" },
];

export const DELIVERY_ORDER_STEPS: readonly GuideStep[] = [
  {
    title: "Browse the menu",
    body: (
      <>
        Start with the <GuideLink href="/products">full menu</GuideLink> or
        narrow it down by <GuideLink href="/categories">category</GuideLink>:
        flower, pre-rolls, edibles, vapes, and concentrates. Stock changes as
        new drops come in, so the menu shows what we have today.
      </>
    ),
  },
  {
    title: "Add to cart and check out",
    body: (
      <>
        You can check out as a guest. If you sign in, we save your addresses
        for next time. Review your <GuideLink href="/cart">cart</GuideLink>,
        enter your delivery address, and confirm. Your total is the product
        subtotal plus the flat $20 delivery fee.
      </>
    ),
  },
  {
    title: "We confirm the order",
    body: "Our team confirms your order and you get text updates as it moves along.",
  },
  {
    title: "A driver heads your way",
    body: "Deliveries run same-day while we are open. Drivers use plain cars and wear plain clothes with no branding.",
  },
  {
    title: "Pay cash and show ID at the door",
    body: (
      <>
        Meet the driver in person, show a valid 21+ ID, and pay in cash. The
        person who placed the order has to be the one who receives it. There
        is more detail in the <GuideLink href="/faqs">delivery FAQ</GuideLink>.
      </>
    ),
  },
];

export const DELIVERY_PREP_ITEMS = [
  "A valid 21+ government ID: driver's license, state ID, or passport. No medical card needed.",
  "Cash for your order plus the $20 delivery fee. Tips are paid in cash too.",
  "You, in person, at the address. Friends and family cannot accept the order for you.",
  "An address in our service area. Homes, hotels, and temporary stays all work.",
] as const;

export const DELIVERY_FEATURED_AREA_SLUGS = [
  "northern-virginia",
  "washington-dc",
  "arlington",
  "alexandria",
  "fairfax",
  "mclean",
  "reston",
  "vienna",
] as const;

export const DELIVERY_FAQS: readonly FaqItem[] = [
  {
    question: "Do I need a medical card to order?",
    answer:
      "No. Gas Nation delivery in Northern Virginia and Washington, DC is for adults 21+ with a valid government ID. You do not need a medical card.",
  },
  {
    question: "What ID do you accept at the door?",
    answer:
      "A valid government ID showing you are over 21. That can be a driver's license, a state-issued ID, or a passport. We make no exceptions to the ID policy.",
  },
  {
    question: "Is payment really cash only?",
    answer:
      "Yes. Gas Nation is cash only, and you pay the driver when your order arrives. Every order has a flat $20 delivery fee. Delivery is only free when you redeem a free-delivery coupon from Gas Nation.",
  },
  {
    question: "Do I have to be there to receive the order?",
    answer:
      "Yes. You must be there with a valid ID to receive your delivery. Friends or family members cannot accept an order for you.",
  },
  {
    question: "Is the delivery discreet?",
    answer:
      "Yes. Drivers use plain cars and wear plain clothes. You can add delivery notes at checkout if you need anything specific.",
  },
  {
    question: "How much can I order at once?",
    answer:
      "Customers may order up to 8 ounces of dry flower in any 30-day rolling period.",
  },
];

export const DELIVERY_EXTRA_NEXT_LINKS: readonly GuideCard[] = [
  {
    href: "/delivery",
    title: "Delivery areas",
    description: "Every city and neighborhood we cover in NoVA and DC.",
  },
  {
    href: "/faqs",
    title: "Delivery FAQ",
    description: "ID rules, fees, hours, tipping, returns, and visitor orders.",
  },
  {
    href: "/categories",
    title: "Shop by category",
    description: "Flower, edibles, vapes, and concentrates.",
  },
];
