import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { GuideActions } from "@/components/learn/guide-actions";
import { GuideBreadcrumb } from "@/components/learn/guide-breadcrumb";
import { GuideChecklist } from "@/components/learn/guide-checklist";
import { GuideCtaBand } from "@/components/learn/guide-cta-band";
import { GuideFaqs } from "@/components/learn/guide-faqs";
import { GuideHero } from "@/components/learn/guide-hero";
import { GuideJsonLd } from "@/components/learn/guide-json-ld";
import { GuideLink } from "@/components/learn/guide-link";
import { GuideNextLinks } from "@/components/learn/guide-next-links";
import { GuideQuickFacts } from "@/components/learn/guide-quick-facts";
import { GuideProse, GuideSection } from "@/components/learn/guide-section";
import {
  buildGuideMetadata,
  buildGuideNextLinks,
  getLearnGuide,
  learnGuidePath,
} from "@/content/learn";
import {
  STRAIN_EVENING_PICKS,
  STRAIN_EXTRA_NEXT_LINKS,
  STRAIN_FAQS,
  STRAIN_FORMAT_NOTES,
  STRAIN_QUICK_FACTS,
  STRAIN_TYPES,
} from "@/content/learn/indica-vs-sativa-vs-hybrid";

const guide = getLearnGuide("indica-vs-sativa-vs-hybrid");

export const metadata: Metadata = buildGuideMetadata(guide);

export default function IndicaVsSativaVsHybridPage() {
  return (
    <main className="min-w-0 overflow-x-clip">
      <GuideJsonLd
        title={guide.navLabel}
        path={learnGuidePath(guide.slug)}
        faqs={STRAIN_FAQS}
      />

      <Container className="min-w-0 py-10 sm:py-14">
        <GuideBreadcrumb title={guide.navLabel} />

        <GuideHero
          eyebrow={guide.eyebrow}
          title={guide.title}
          lead="Almost every jar of flower is labeled indica, sativa, or hybrid. This guide covers what each is usually chosen for, how to pick one for your evening, and where to find each on our menu."
          primary={{ label: "Shop flower", href: "/categories/flower" }}
          secondary={{ label: "Browse the full menu", href: "/products" }}
        />

        <GuideQuickFacts facts={STRAIN_QUICK_FACTS} />

        <GuideSection
          id="compare"
          title="The three types at a glance"
          intro="Strains within each type vary, but the label tells you which way a strain usually leans."
          wide
        >
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {STRAIN_TYPES.map((type) => (
              <li
                key={type.name}
                className="flex flex-col rounded-lg border border-border bg-card/50 p-5"
              >
                <h3 className="text-lg font-semibold tracking-tight">
                  {type.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-primary">
                  {type.tagline}
                </p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Often chosen for
                    </dt>
                    <dd className="mt-1 leading-relaxed text-muted-foreground">
                      {type.oftenChosenFor}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Typical moments
                    </dt>
                    <dd className="mt-1 leading-relaxed text-muted-foreground">
                      {type.moments}
                    </dd>
                  </div>
                </dl>
                <Link
                  href={type.href}
                  className="mt-5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {type.shopLabel}
                </Link>
              </li>
            ))}
          </ul>
        </GuideSection>

        <GuideSection
          id="evening"
          title="Pick by what you have planned"
          intro="Think about the next few hours, then start in the matching category."
          wide
        >
          <GuideNextLinks links={STRAIN_EVENING_PICKS} />
        </GuideSection>

        <GuideSection id="format" title="Format and amount">
          <GuideProse>
            How you consume it and how much you have make a big difference too,
            especially if you are new or it has been a while.
          </GuideProse>
          <GuideChecklist items={STRAIN_FORMAT_NOTES} />
          <p className="mt-6 text-sm text-muted-foreground">
            Building your first order? See{" "}
            <GuideLink href={learnGuidePath("first-delivery-what-to-order")}>
              what to order and how much
            </GuideLink>
            .
          </p>
        </GuideSection>

        <GuideSection id="labels" title="Reading the menu">
          <GuideProse>
            Our flower is sorted by strain type, so you can go straight to{" "}
            <GuideLink href="/categories/indica">indica</GuideLink>,{" "}
            <GuideLink href="/categories/sativa">sativa</GuideLink>, or{" "}
            <GuideLink href="/categories/hybrid">hybrid</GuideLink> and compare
            what is in stock. Each product page shows the price before you add
            it to your cart.
          </GuideProse>
          <GuideProse>
            Stock changes as new drops come in. If a strain you liked is sold
            out, try another one of the same type, or ask us for a similar
            pick.
          </GuideProse>
          <GuideActions
            primary={{ label: "Shop flower by type", href: "/categories/flower" }}
            secondary={{ label: "How delivery works", href: learnGuidePath("how-delivery-works") }}
          />
        </GuideSection>

        <GuideSection id="faq" title="Common questions">
          <GuideFaqs faqs={STRAIN_FAQS} />
        </GuideSection>

        <GuideSection id="next" title="Keep exploring" wide>
          <GuideNextLinks
            links={buildGuideNextLinks(guide.slug, STRAIN_EXTRA_NEXT_LINKS)}
          />
        </GuideSection>

        <GuideCtaBand
          title="Know what you are in the mood for?"
          body="Pick a type, add it to your cart, and we deliver it the same day. Flat $20 delivery, cash at the door, 21+ ID."
          primary={{ label: "Shop the menu", href: "/products" }}
          secondary={{ label: "Shop flower", href: "/categories/flower" }}
        />
      </Container>
    </main>
  );
}
