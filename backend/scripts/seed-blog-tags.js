/**
 * SEO blog tag catalog (seed / upsert).
 * Run: node scripts/seed-blog-tags.js
 */
require("dotenv").config();

const crypto = require("crypto");

const prisma = require("../src/config/prisma");

/** @type {Array<{ name: string, slug: string }>} */
const BLOG_TAGS = [
  { name: "Live Rosin", slug: "live-rosin" },
  { name: "Cannabis Concentrates Near Me", slug: "cannabis-concentrates-near-me" },
  { name: "Blue Dream", slug: "blue-dream" },
  { name: "OG Kush", slug: "og-kush" },
  { name: "Gelato", slug: "gelato" },
  { name: "Runtz", slug: "runtz" },
  { name: "Wedding Cake", slug: "wedding-cake" },
  { name: "Granddaddy Purple", slug: "granddaddy-purple" },
  { name: "Girl Scout Cookies / GSC", slug: "gsc" },
  { name: "Sour Diesel", slug: "sour-diesel" },
  { name: "Gorilla Glue / GG4", slug: "gg4" },
  { name: "Zkittlez", slug: "zkittlez" },
  { name: "Gelato 41", slug: "gelato-41" },
  { name: "Northern Lights", slug: "northern-lights" },
  { name: "Jack Herer", slug: "jack-herer" },
  { name: "Pineapple Express", slug: "pineapple-express" },
  { name: "Durban Poison", slug: "durban-poison" },
  { name: "White Widow", slug: "white-widow" },
  { name: "AK-47", slug: "ak-47" },
  { name: "Purple Haze", slug: "purple-haze" },
  { name: "Amnesia Haze", slug: "amnesia-haze" },
  { name: "Green Crack", slug: "green-crack" },
  { name: "Strawberry Cough", slug: "strawberry-cough" },
  { name: "Biscotti", slug: "biscotti" },
  { name: "Animal Cookies", slug: "animal-cookies" },
  { name: "Ice Cream Cake", slug: "ice-cream-cake" },
  { name: "Do-Si-Dos", slug: "do-si-dos" },
  { name: "MAC 1", slug: "mac-1" },
  { name: "GMO", slug: "gmo" },
  { name: "Sunset Sherbet", slug: "sunset-sherbet" },
  { name: "Purple Punch", slug: "purple-punch" },
  { name: "Mimosa", slug: "mimosa" },
  { name: "Lemon Haze", slug: "lemon-haze" },
  { name: "Super Lemon Haze", slug: "super-lemon-haze" },
  { name: "Best Cannabis Strains", slug: "best-cannabis-strains" },
  { name: "Indica vs Sativa", slug: "indica-vs-sativa" },
  { name: "Indica vs Sativa vs Hybrid", slug: "indica-vs-sativa-vs-hybrid" },
  { name: "Best Indica Strains", slug: "best-indica-strains" },
  { name: "Best Sativa Strains", slug: "best-sativa-strains" },
  { name: "Best Hybrid Strains", slug: "best-hybrid-strains" },
  { name: "THC vs CBD", slug: "thc-vs-cbd" },
  { name: "What Is THC?", slug: "what-is-thc" },
  { name: "What Is CBD?", slug: "what-is-cbd" },
  { name: "Cannabis Terpenes Explained", slug: "cannabis-terpenes-explained" },
  { name: "Cannabis Potency & THC Percentage", slug: "cannabis-potency" },
  { name: "Cannabis Buying Guide", slug: "cannabis-buying-guide" },
  { name: "Cannabis Beginners Guide", slug: "cannabis-beginners-guide" },
  { name: "Cannabis Flower Guide", slug: "cannabis-flower-guide" },
  { name: "THC Gummies Guide", slug: "thc-gummies-guide" },
  { name: "Cannabis Edibles Guide", slug: "cannabis-edibles-guide" },
  { name: "Cannabis Vape Guide", slug: "cannabis-vape-guide" },
  { name: "Cannabis Concentrates Guide", slug: "cannabis-concentrates-guide" },
  { name: "Live Resin vs Live Rosin", slug: "live-resin-vs-live-rosin" },
  { name: "Cannabis Strain Effects", slug: "cannabis-strain-effects" },
  { name: "How to Choose a Cannabis Strain", slug: "how-to-choose-a-cannabis-strain" },
  { name: "How to Choose Cannabis Flower", slug: "how-to-choose-cannabis-flower" },
  { name: "Cannabis Reviews", slug: "cannabis-reviews" },
  { name: "Cannabis Product Reviews", slug: "cannabis-product-reviews" },
  { name: "Strain Reviews", slug: "strain-reviews" },
  { name: "Cannabis Deals Northern Virginia", slug: "cannabis-deals-northern-virginia" },
  { name: "Dispensary Deals Northern Virginia", slug: "dispensary-deals-northern-virginia" },
  { name: "DC Cannabis Deals", slug: "dc-cannabis-deals" },
  { name: "DC Dispensary Deals", slug: "dc-dispensary-deals" },
  { name: "Virginia Cannabis Laws", slug: "virginia-cannabis-laws" },
  { name: "Northern Virginia Cannabis Laws", slug: "northern-virginia-cannabis-laws" },
  { name: "DC Cannabis Laws", slug: "dc-cannabis-laws" },
  { name: "DC Medical Cannabis Guide", slug: "dc-medical-cannabis-guide" },
  { name: "Virginia Cannabis 2027", slug: "virginia-cannabis-2027" },
  { name: "Virginia Cannabis Market", slug: "virginia-cannabis-market" },
  { name: "Northern Virginia Cannabis Guide", slug: "northern-virginia-cannabis-guide" },
  { name: "NOVA Cannabis Guide", slug: "nova-cannabis-guide" },
  { name: "Washington DC Cannabis Guide", slug: "washington-dc-cannabis-guide" }
];

function defaultCopy(name) {
  return {
    description: `Explore Wixked Nation guides and posts about ${name}. Same-day cannabis delivery across Northern Virginia and Washington, DC. 21+.`,
    seoTitle: `${name} | Wixked Nation Blog`,
    seoDescription: `Learn about ${name} with Wixked Nation — cannabis delivery guides for Northern Virginia and DC. 21+ with valid ID.`
  };
}

async function seedBlogTags() {
  let created = 0;
  let updated = 0;

  for (const item of BLOG_TAGS) {
    const copy = defaultCopy(item.name);
    const existing = await prisma.blogTag.findUnique({
      where: { slug: item.slug }
    });

    if (existing) {
      await prisma.blogTag.update({
        where: { slug: item.slug },
        data: {
          name: item.name,
          isActive: true,
          description: existing.description || copy.description,
          seoTitle: existing.seoTitle || copy.seoTitle,
          seoDescription: existing.seoDescription || copy.seoDescription
        }
      });
      updated += 1;
    } else {
      await prisma.blogTag.create({
        data: {
          id: crypto.randomUUID(),
          name: item.name,
          slug: item.slug,
          description: copy.description,
          seoTitle: copy.seoTitle,
          seoDescription: copy.seoDescription,
          isActive: true
        }
      });
      created += 1;
    }
  }

  return { created, updated, total: BLOG_TAGS.length };
}

module.exports = {
  BLOG_TAGS,
  seedBlogTags
};

if (require.main === module) {
  seedBlogTags()
    .then((result) => {
      console.log(
        `Blog tags seed complete: ${result.created} created, ${result.updated} updated (${result.total} catalog).`
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
