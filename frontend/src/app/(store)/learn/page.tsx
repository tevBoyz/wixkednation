import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { GuideBreadcrumb } from "@/components/learn/guide-breadcrumb";
import { GuideCtaBand } from "@/components/learn/guide-cta-band";
import { GuideHero } from "@/components/learn/guide-hero";
import { GuideLink } from "@/components/learn/guide-link";
import { GuideNextLinks } from "@/components/learn/guide-next-links";
import { GuideSection } from "@/components/learn/guide-section";
import { JsonLd } from "@/components/seo/json-ld";
import { LEARN_GUIDES, learnGuidePath } from "@/content/learn";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
} from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

const PATH = "/learn";
const TITLE = "Ordering guides from Wixked Nation";
const DESCRIPTION =
  "Guides to ordering weed delivery in Ohio: how delivery works, what to order first, indica vs sativa vs hybrid, and who can order.";

export const metadata: Metadata = buildPageMetadata({
  title: "Ordering Guides | Wixked Nation",
  description: DESCRIPTION,
  path: PATH,
});

const NEXT_STEPS = [
  {
    href: "/products",
    title: "Shop the full menu",
    description: "Everything in stock today, ready for same-day delivery.",
  },
  {
    href: "/categories",
    title: "Shop by category",
    description: "Flower, edibles, vapes, and concentrates.",
  },
  {
    href: "/delivery",
    title: "Delivery areas",
    description: "Every incorporated city we cover in Ohio.",
  },
  {
    href: "/faqs",
    title: "Delivery FAQ",
    description: "ID rules, fees, hours, tipping, returns, and visitor orders.",
  },
] as const;

export default function LearnHubPage() {
  return (
    <main className="min-w-0 overflow-x-clip">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: PATH },
        ])}
      />
      <JsonLd
        data={buildCollectionPageJsonLd({
          name: TITLE,
          description: DESCRIPTION,
          path: PATH,
          items: LEARN_GUIDES.map((guide) => ({
            name: guide.title,
            path: learnGuidePath(guide.slug),
          })),
        })}
      />

      <Container className="min-w-0 py-10 sm:py-14">
        <GuideBreadcrumb />

        <GuideHero
          title={TITLE}
          lead={
            <>
              Short guides for new and returning{" "}
              <GuideLink href="/">Wixked Nation</GuideLink> customers. Learn{" "}
              <GuideLink href={learnGuidePath("how-delivery-works")}>
                how same-day delivery works
              </GuideLink>
              ,{" "}
              <GuideLink href={learnGuidePath("first-delivery-what-to-order")}>
                what to order
              </GuideLink>
              ,{" "}
              <GuideLink href={learnGuidePath("indica-vs-sativa-vs-hybrid")}>
                how strain types differ
              </GuideLink>
              , and{" "}
              <GuideLink href={learnGuidePath("is-weed-delivery-legal-ohio")}>
                who can order
              </GuideLink>
              .
            </>
          }
          primary={{ label: "Shop the menu", href: "/products" }}
          secondary={{
            label: "Start with how delivery works",
            href: learnGuidePath("how-delivery-works"),
          }}
        />

        <GuideSection id="guides" title="All guides" wide>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {LEARN_GUIDES.map((guide) => (
              <li key={guide.slug}>
                <Link
                  href={learnGuidePath(guide.slug)}
                  className="flex h-full flex-col rounded-lg border border-border bg-card/50 p-5 transition-colors hover:border-primary/40"
                >
                  <span className="text-lg font-semibold tracking-tight">
                    {guide.title}
                  </span>
                  <span className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {guide.summary}
                  </span>
                  <span className="mt-4 text-sm font-medium text-primary">
                    Read the guide
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </GuideSection>

        <GuideSection id="next" title="Popular next steps" wide>
          <GuideNextLinks links={NEXT_STEPS} />
        </GuideSection>

        <GuideCtaBand
          title="Already know what you want?"
          body="Browse today's menu and get it delivered the same day. Flat $20 delivery, cash at the door, 21+ ID."
          primary={{ label: "Shop the menu", href: "/products" }}
          secondary={{ label: "Delivery FAQ", href: "/faqs" }}
        />
      </Container>
    </main>
  );
}
