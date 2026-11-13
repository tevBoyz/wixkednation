import type { GuideCard } from "@/components/learn/guide-next-links";
import type { GuideFact } from "@/components/learn/guide-quick-facts";
import type { GuideStep } from "@/components/learn/guide-steps";
import type { FaqItem } from "@/content/faqs";

export const RULES_QUICK_FACTS: readonly GuideFact[] = [
  { label: "Age", value: "21 and over" },
  { label: "ID", value: "Valid government photo ID" },
  { label: "Medical card", value: "Not required" },
  { label: "Flower limit", value: "8 oz per 30 days" },
];

export const RULES_DOOR_STEPS: readonly GuideStep[] = [
  {
    title: "The person who ordered answers the door",
    body: "Orders are handed only to the customer who placed them. A roommate, partner, or front desk cannot sign for you.",
  },
  {
    title: "The driver checks your ID",
    body: "Have a valid driver's license, state ID, or passport in hand. It must be current and show you are 21 or older.",
  },
  {
    title: "You pay in cash",
    body: "Pay the order total plus the flat $20 delivery fee in cash. If the ID check does not pass, the order cannot be completed.",
  },
];

export const RULES_ACCEPTED_IDS = [
  "Driver's license from any US state",
  "State-issued ID card",
  "Passport, which works for visitors from other countries",
  "IDs must be valid, unexpired, and match the person receiving the order",
] as const;

export const RULES_AREA_SLUGS = [
  "ohio",
  "columbus",
  "cleveland",
  "cincinnati",
  "toledo",
  "akron",
] as const;

export const RULES_FAQS: readonly FaqItem[] = [
  {
    question: "Who can order Wixked Nation delivery?",
    answer:
      "Adults 21 and over with a valid government ID, receiving the order in person at an address we serve in Ohio.",
  },
  {
    question: "Do I need a medical card?",
    answer:
      "No. A medical card is not required. A valid government ID proving you are 21 or older is all you need.",
  },
  {
    question: "I am visiting. Can I still order?",
    answer:
      "Yes. Visitors with a valid ID can place orders for delivery to addresses we serve in Ohio (including hotels), as long as they are over 21.",
  },
  {
    question: "Can someone else accept my order?",
    answer:
      "No. You must be present with a valid ID to receive your delivery. Friends or family members cannot accept an order for you.",
  },
  {
    question: "Is there a limit on how much I can order?",
    answer:
      "Customers may order up to 8 ounces of dry flower in any 30-day rolling period.",
  },
  {
    question: "Is this legal advice?",
    answer:
      "No. This page explains Wixked Nation's own ordering policies. Cannabis rules in Ohio can change, so check current local rules if you have questions about your specific situation.",
  },
];

export const RULES_EXTRA_NEXT_LINKS: readonly GuideCard[] = [
  {
    href: "/delivery",
    title: "Delivery areas",
    description: "Every incorporated city we cover in Ohio.",
  },
  {
    href: "/faqs",
    title: "Delivery FAQ",
    description: "Fees, hours, tipping, returns, and more.",
  },
  {
    href: "/products",
    title: "Full menu",
    description: "Everything in stock today, ready for same-day delivery.",
  },
];
