/**
 * Restore wiped body for the first official blog post.
 * Keeps coverImagePath and other fields intact.
 * Run: node scripts/restore-first-blog-body.js
 */
require("dotenv").config();

const prisma = require("../src/config/prisma");
const { resolveBodyHtml } = require("../src/modules/blog/blog-html");

const SLUG = "same-day-cannabis-delivery-northern-virginia-dc";

function p(text, marks) {
  return {
    type: "paragraph",
    content: text
      ? [{ type: "text", text, ...(marks ? { marks } : {}) }]
      : []
  };
}

function pMixed(parts) {
  return {
    type: "paragraph",
    content: parts.map((part) => {
      if (typeof part === "string") {
        return { type: "text", text: part };
      }
      return {
        type: "text",
        text: part.text,
        marks: part.marks
      };
    })
  };
}

function h2(text) {
  return {
    type: "heading",
    attrs: { level: 2 },
    content: [{ type: "text", text }]
  };
}

function ol(items) {
  return {
    type: "orderedList",
    content: items.map((itemParts) => ({
      type: "listItem",
      content: [
        {
          type: "paragraph",
          content: itemParts.map((part) =>
            typeof part === "string"
              ? { type: "text", text: part }
              : { type: "text", text: part.text, marks: part.marks }
          )
        }
      ]
    }))
  };
}

function ul(items) {
  return {
    type: "bulletList",
    content: items.map((itemParts) => ({
      type: "listItem",
      content: [
        {
          type: "paragraph",
          content: itemParts.map((part) =>
            typeof part === "string"
              ? { type: "text", text: part }
              : { type: "text", text: part.text, marks: part.marks }
          )
        }
      ]
    }))
  };
}

const bold = (text) => [{ type: "bold" }];
const italic = (text) => [{ type: "italic" }];
const link = (href) => [{ type: "link", attrs: { href } }];

const BODY_JSON = {
  type: "doc",
  content: [
    h2("Same-day cannabis delivery, without the guesswork"),
    pMixed([
      "Looking for ",
      { text: "cannabis delivery in Northern Virginia", marks: bold() },
      " or ",
      { text: "Washington, DC", marks: bold() },
      "? Wixked Nation brings premium flower, edibles, vapes, and concentrates to your door — same day, with a flat ",
      { text: "$20 delivery", marks: bold() },
      " fee and hours from ",
      { text: "10 AM to 10 PM", marks: bold() },
      " daily. This is our first official guide to how ordering works, who we serve, and what to expect."
    ]),
    h2("Who Wixked Nation delivers to"),
    p(
      "We focus on Northern Virginia and DC neighborhoods where customers want discreet, reliable delivery — including Fairfax, Arlington, Alexandria, Loudoun, Prince William, and Washington, DC. If your address is in our service area, you can browse the menu online and check out in minutes."
    ),
    pMixed([
      "Every order requires you to be ",
      { text: "21+", marks: bold() },
      " with a valid photo ID at delivery. We take that seriously so your experience stays smooth and compliant."
    ]),
    h2("How to place your first order"),
    ol([
      [
        { text: "Browse the menu", marks: bold() },
        " — flower, pre-rolls, edibles, carts, concentrates, and more."
      ],
      [
        { text: "Pick your pack size", marks: bold() },
        " — choose the SKU that matches the amount and price you want."
      ],
      [
        { text: "Add to cart", marks: bold() },
        " — adjust quantities, then head to checkout."
      ],
      [
        { text: "Confirm delivery details", marks: bold() },
        " — address in our zone, contact info, and payment method (COD)."
      ],
      [
        { text: "Meet your courier", marks: bold() },
        " — have your ID ready when they arrive."
      ]
    ]),
    pMixed([
      "New here? Start with our ",
      {
        text: "full product catalog",
        marks: link("/products")
      },
      " or jump into a category that matches your vibe."
    ]),
    h2("What “premium” means at Wixked Nation"),
    p(
      "We keep the menu curated — not endless shelves of mystery product. Expect clear strain types (Indica, Sativa, Hybrid), pack pricing you can understand before checkout, and packaging meant for discreet delivery. Whether you want a classic hybrid like Blue Dream or a heavier night-in indica, the goal is simple: quality you can count on, delivered the same day."
    ),
    h2("Delivery fee, hours, and ID"),
    ul([
      [
        { text: "Flat $20 delivery", marks: bold() },
        " across our service area"
      ],
      [
        { text: "10 AM – 10 PM", marks: bold() },
        " daily ordering window"
      ],
      [
        { text: "21+ with valid ID", marks: bold() },
        " required at the door"
      ]
    ]),
    pMixed([
      "Want the full map of cities and neighborhoods? See our ",
      {
        text: "delivery areas",
        marks: link("/delivery")
      },
      " page."
    ]),
    h2("Happy hour and deals"),
    p(
      "When a sale or happy hour is live, featured deals appear on the homepage banner with clear sale pricing. Add the deal to your cart from the banner, keep shopping, and check out when you are ready — the sale price applies while that deal is active."
    ),
    h2("Ready to order?"),
    pMixed([
      "Wixked Nation is built for Northern Virginia and DC customers who want ",
      { text: "same-day cannabis delivery", marks: italic() },
      " without the runaround. Browse the menu, pick your products, and we will bring it to you."
    ]),
    pMixed([
      {
        text: "Shop the Wixked Nation menu",
        marks: [...bold(), ...link("/products")]
      },
      " · ",
      { text: "Check delivery areas", marks: link("/delivery") },
      " · ",
      { text: "Read FAQs", marks: link("/faqs") }
    ])
  ]
};

const BODY_HTML = resolveBodyHtml({
  bodyJson: BODY_JSON,
  bodyHtml: ""
});

async function main() {
  const existing = await prisma.blogPost.findUnique({
    where: { slug: SLUG },
    select: {
      id: true,
      coverImagePath: true,
      bodyHtml: true,
      title: true
    }
  });

  if (!existing) {
    throw new Error(`Post not found: ${SLUG}`);
  }

  console.log("Restoring body for:", existing.title);
  console.log("Keeping coverImagePath:", existing.coverImagePath || "(none)");

  const updated = await prisma.blogPost.update({
    where: { slug: SLUG },
    data: {
      bodyJson: BODY_JSON,
      bodyHtml: BODY_HTML
      // intentionally do not touch coverImagePath / title / seo / tags
    },
    select: {
      id: true,
      slug: true,
      coverImagePath: true,
      bodyHtml: true
    }
  });

  console.log("Restored.");
  console.log("  bodyHtml length:", (updated.bodyHtml || "").length);
  console.log("  coverImagePath:", updated.coverImagePath || "(none)");
  console.log("  url: /blog/" + updated.slug);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
