/**
 * Wipe all blog posts permanently, then seed Wixked Nation's first official post.
 * Run: node scripts/seed-first-blog-post.js
 */
require("dotenv").config();

const crypto = require("crypto");

const prisma = require("../src/config/prisma");
const { resolveBodyHtml } = require("../src/modules/blog/blog-html");
const { seedBlogTags } = require("./seed-blog-tags");

const TAG_SLUGS = [
  "northern-virginia-cannabis-guide",
  "nova-cannabis-guide",
  "washington-dc-cannabis-guide",
  "cannabis-beginners-guide",
  "cannabis-buying-guide"
];

const BODY_HTML = `
<h2>Same-day cannabis delivery, without the guesswork</h2>
<p>Looking for <strong>cannabis delivery in Northern Virginia</strong> or <strong>Washington, DC</strong>? Wixked Nation brings premium flower, edibles, vapes, and concentrates to your door — same day, with a flat <strong>$20 delivery</strong> fee and hours from <strong>10 AM to 10 PM</strong> daily. This is our first official guide to how ordering works, who we serve, and what to expect.</p>

<h2>Who Wixked Nation delivers to</h2>
<p>We focus on Northern Virginia and DC neighborhoods where customers want discreet, reliable delivery — including Fairfax, Arlington, Alexandria, Loudoun, Prince William, and Washington, DC. If your address is in our service area, you can browse the menu online and check out in minutes.</p>
<p>Every order requires you to be <strong>21+</strong> with a valid photo ID at delivery. We take that seriously so your experience stays smooth and compliant.</p>

<h2>How to place your first order</h2>
<ol>
  <li><strong>Browse the menu</strong> — flower, pre-rolls, edibles, carts, concentrates, and more.</li>
  <li><strong>Pick your pack size</strong> — choose the SKU that matches the amount and price you want.</li>
  <li><strong>Add to cart</strong> — adjust quantities, then head to checkout.</li>
  <li><strong>Confirm delivery details</strong> — address in our zone, contact info, and payment method (COD).</li>
  <li><strong>Meet your courier</strong> — have your ID ready when they arrive.</li>
</ol>
<p>New here? Start with our <a href="/products">full product catalog</a> or jump into a category that matches your vibe.</p>

<h2>What “premium” means at Wixked Nation</h2>
<p>We keep the menu curated — not endless shelves of mystery product. Expect clear strain types (Indica, Sativa, Hybrid), pack pricing you can understand before checkout, and packaging meant for discreet delivery. Whether you want a classic hybrid like Blue Dream or a heavier night-in indica, the goal is simple: quality you can count on, delivered the same day.</p>

<h2>Delivery fee, hours, and ID</h2>
<ul>
  <li><strong>Flat $20 delivery</strong> across our service area</li>
  <li><strong>10 AM – 10 PM</strong> daily ordering window</li>
  <li><strong>21+ with valid ID</strong> required at the door</li>
</ul>
<p>Want the full map of cities and neighborhoods? See our <a href="/delivery">delivery areas</a> page.</p>

<h2>Happy hour and deals</h2>
<p>When a sale or happy hour is live, featured deals appear on the homepage banner with clear sale pricing. Add the deal to your cart from the banner, keep shopping, and check out when you are ready — the sale price applies while that deal is active.</p>

<h2>Ready to order?</h2>
<p>Wixked Nation is built for Northern Virginia and DC customers who want <em>same-day cannabis delivery</em> without the runaround. Browse the menu, pick your products, and we will bring it to you.</p>
<p><a href="/products"><strong>Shop the Wixked Nation menu</strong></a> · <a href="/delivery">Check delivery areas</a> · <a href="/faqs">Read FAQs</a></p>
`.trim();

async function main() {
  console.log("Seeding blog tag catalog (upsert)…");
  const tagSeed = await seedBlogTags();
  console.log(
    `Tags: ${tagSeed.created} created, ${tagSeed.updated} updated (${tagSeed.total} catalog).`
  );

  const existingCount = await prisma.blogPost.count();
  console.log(`Deleting ${existingCount} existing blog post(s) permanently…`);

  // Cascade removes blog_media + blog_post_tags
  const deleted = await prisma.blogPost.deleteMany({});
  console.log(`Deleted ${deleted.count} post(s).`);

  const tags = await prisma.blogTag.findMany({
    where: { slug: { in: TAG_SLUGS }, isActive: true }
  });

  if (tags.length === 0) {
    throw new Error("No matching tags found after seed. Aborting.");
  }

  const bodyHtml = resolveBodyHtml({ bodyHtml: BODY_HTML });
  const now = new Date();
  const postId = crypto.randomUUID();

  const post = await prisma.blogPost.create({
    data: {
      id: postId,
      title: "Same-Day Cannabis Delivery in Northern Virginia & DC: How Wixked Nation Works",
      slug: "same-day-cannabis-delivery-northern-virginia-dc",
      excerpt:
        "Your first guide to Wixked Nation: same-day cannabis delivery across Northern Virginia and Washington, DC. Flat $20 delivery, 10 AM–10 PM, 21+ with ID.",
      bodyJson: {},
      bodyHtml,
      status: "published",
      publishedAt: now,
      seoTitle:
        "Same-Day Cannabis Delivery Northern Virginia & DC | Wixked Nation",
      seoDescription:
        "Order same-day cannabis delivery in Northern Virginia and Washington, DC with Wixked Nation. Flat $20 delivery, 10 AM–10 PM daily, 21+ with valid ID. How ordering works.",
      authorName: "Wixked Nation",
      showOnHomepage: true,
      tags: {
        create: tags.map((tag) => ({
          tagId: tag.id
        }))
      }
    },
    include: {
      tags: { include: { tag: true } }
    }
  });

  console.log("Created first official blog post:");
  console.log(`  id:    ${post.id}`);
  console.log(`  slug:  /blog/${post.slug}`);
  console.log(`  title: ${post.title}`);
  console.log(
    `  tags:  ${post.tags.map((row) => row.tag.slug).join(", ")}`
  );
  console.log(`  status: ${post.status} @ ${post.publishedAt.toISOString()}`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
