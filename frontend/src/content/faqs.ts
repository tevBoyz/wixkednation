import { DELIVERY_CITIES } from "@/content/delivery-areas";

export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Where do you deliver?",
    answer: `We deliver to every incorporated city in Ohio: ${DELIVERY_CITIES.join(", ")}.`,
  },
  {
    question: "Where can I buy cannabis near me?",
    answer:
      "Order from Wixked Nation’s online menu and get same-day delivery to your door across Ohio (10 AM–10 PM).",
  },
  {
    question: "What are your hours? Are you open now?",
    answer:
      "We deliver seven days a week from 10 AM to 10 PM. Same-day and evening delivery is available while we are open.",
  },
  {
    question: "How old do I have to be?",
    answer: "You must be 21 or older to order from Wixked Nation.",
  },
  {
    question: "Do I need a medical card?",
    answer:
      "No. Wixked Nation delivery in Ohio is for adults 21+ with a valid government ID. A medical card is not required.",
  },
  {
    question: "Do you deliver in Ohio?",
    answer:
      "Yes. Same-day delivery to every incorporated city in the state, including Columbus, Cleveland, Cincinnati, Toledo, Akron, and Dayton. Flat $20 fee, cash on delivery, 21+ with valid ID.",
  },
  {
    question: "Is there a delivery fee?",
    answer:
      "Yes. Every order includes a flat $20 delivery fee. Free delivery only applies when you redeem a free-delivery coupon issued by Wixked Nation.",
  },
  {
    question: "How does delivery work?",
    answer:
      "Browse the online menu, add products to your cart, check out, and we deliver to your address in our service area. You must be present with a valid 21+ ID when the driver arrives. Payment is cash only.",
  },
  {
    question: "How can I pay?",
    answer: "We are a cash only business.",
  },
  {
    question: "Do I have to tip the driver?",
    answer:
      "Tips are greatly encouraged. Think of it like tipping your server at a restaurant. Our drivers go the distance for you.",
  },
  {
    question: "Do I need to receive my order in person?",
    answer:
      "Yes. You must be present with a valid ID to receive your delivery. Friends or family members are not allowed to accept an order on your behalf.\n\nWhen you place an order, you will need a valid government ID proving you are over 21. A valid ID can be a driver's license, state-issued ID, or passport.",
  },
  {
    question: "Is the delivery discreet?",
    answer:
      "Yes. Delivery is always discreet — plain cars and plain clothes. Add special delivery notes at checkout if you need them.",
  },
  {
    question: "What is a valid ID?",
    answer:
      "A valid ID is required for all purchases. A valid ID can be a driver's license, state-issued ID, or passport. There are no exceptions. Our ID checking policy is strict.",
  },
  {
    question: "How much cannabis can I buy?",
    answer:
      "Customers may order up to 8 ounces of dry flower in any 30-day rolling period.",
  },
  {
    question: "What is the difference between indica and sativa?",
    answer:
      "Indica flower is often chosen for evening and relaxation-oriented effects. Sativa flower is often chosen for daytime energy and focus. Hybrid flower blends both. Browse our menu by strain type to find what fits you, and ask us if you want a recommendation.",
  },
  {
    question: "What is live resin? How is it different from rosin?",
    answer:
      "Live resin is a concentrate made from fresh-frozen cannabis that preserves rich terpene flavor. Rosin is typically solventless and pressed with heat and pressure. Both are available when stocked on our concentrates menu.",
  },
  {
    question: "What is your return policy?",
    answer:
      "Returns are accepted within 7 days of purchase only if the product has a manufacturer defect. If you are dissatisfied for any reason, contact us and we will make things right.",
  },
  {
    question:
      "I'm visiting from another city/state/country. Can I place an order?",
    answer:
      "Yes. Visitors with a valid ID can place orders for delivery to addresses we serve in Ohio (including hotels), as long as they are over 21.",
  },
  {
    question: "Do I need a specific type of address?",
    answer:
      "No. We deliver to homes, hotels, and temporary stays in any incorporated Ohio city we list. If you are unsure whether we cover your spot, check the city list.",
  },
  {
    question: "Is payment cash on delivery?",
    answer:
      "Yes. Wixked Nation is cash only. Pay the driver in cash when your order arrives. There is a flat $20 delivery fee on every order.",
  },
];
