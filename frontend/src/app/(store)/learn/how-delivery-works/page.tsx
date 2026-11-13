import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { GuideActions } from "@/components/learn/guide-actions";
import { GuideAreaLinks } from "@/components/learn/guide-area-links";
import { GuideBreadcrumb } from "@/components/learn/guide-breadcrumb";
import { GuideChecklist } from "@/components/learn/guide-checklist";
import { GuideChipLinks } from "@/components/learn/guide-chip-links";
import { GuideCtaBand } from "@/components/learn/guide-cta-band";
import { GuideFaqs } from "@/components/learn/guide-faqs";
import { GuideHero } from "@/components/learn/guide-hero";
import { GuideJsonLd } from "@/components/learn/guide-json-ld";
import { GuideLink } from "@/components/learn/guide-link";
import { GuideNextLinks } from "@/components/learn/guide-next-links";
import { GuideQuickFacts } from "@/components/learn/guide-quick-facts";
import { GuideProse, GuideSection } from "@/components/learn/guide-section";
import { GuideSteps } from "@/components/learn/guide-steps";
import {
  DELIVERY_EXTRA_NEXT_LINKS,
  DELIVERY_FAQS,
  DELIVERY_FEATURED_AREA_SLUGS,
  DELIVERY_ORDER_STEPS,
  DELIVERY_PREP_ITEMS,
  DELIVERY_QUICK_FACTS,
} from "@/content/learn/how-delivery-works";
import {
  buildGuideMetadata,
  buildGuideNextLinks,
  getLearnGuide,
  learnGuidePath,
} from "@/content/learn";
import { PRODUCT_SEO_LINKS } from "@/content/seo-locations";

const guide = getLearnGuide("how-delivery-works");

export const metadata: Metadata = buildGuideMetadata(guide);

export default function HowDeliveryWorksPage() {
  return (
    <main className="min-w-0 overflow-x-clip">
      <GuideJsonLd
        title={guide.navLabel}
        path={learnGuidePath(guide.slug)}
        faqs={DELIVERY_FAQS}
      />

      <Container className="min-w-0 py-10 sm:py-14">
        <GuideBreadcrumb title={guide.navLabel} />

        <GuideHero
          title={guide.title}
          lead={
            <>
              Order from our <GuideLink href="/products">online menu</GuideLink>,
              meet the driver at your door, and pay in cash. This page covers{" "}
              <GuideLink href="/">Wixked Nation</GuideLink> hours,{" "}
              <GuideLink href={learnGuidePath("is-weed-delivery-legal-ohio")}>
                ID rules
              </GuideLink>
              , the flat $20 delivery fee, and how drop-offs work across{" "}
              <GuideLink href="/delivery/ohio">Ohio</GuideLink>.
            </>
          }
          primary={{ label: "Shop the menu", href: "/products" }}
          secondary={{ label: "See delivery areas", href: "/delivery" }}
        />

        <GuideQuickFacts facts={DELIVERY_QUICK_FACTS} />

        <GuideSection id="steps" title="The order, step by step">
          <GuideSteps steps={DELIVERY_ORDER_STEPS} />
        </GuideSection>

        <GuideSection
          id="prep"
          title="What to have ready"
          intro="The driver needs all four of these to complete your delivery."
        >
          <GuideChecklist items={DELIVERY_PREP_ITEMS} />
          <p className="mt-6 text-sm text-muted-foreground">
            Who can order, visitors, and limits are covered in{" "}
            <GuideLink href={learnGuidePath("is-weed-delivery-legal-ohio")}>
              who can order and the rules
            </GuideLink>
            .
          </p>
        </GuideSection>

        <GuideSection id="fees" title="Fees, hours, and timing">
          <GuideProse>
            Delivery is a flat $20 on every order, whichever city you are in.
            It is shown at checkout and does not change with distance. The fee
            is only waived with a free-delivery coupon from us. First orders pay
            the same $20.
          </GuideProse>
          <GuideProse>
            We are open 10 AM to 10 PM, seven days a week, and deliver same-day
            during those hours. Evenings get busy, so ordering earlier usually
            means a shorter wait. Tips are paid in cash and are always
            appreciated.
          </GuideProse>
        </GuideSection>

        <GuideSection id="discreet" title="Discreet drop-offs">
          <GuideProse>
            Our drivers use plain cars and wear plain clothes, with no logos or
            signs. They deliver to apartment buildings, gated communities,
            offices, and hotels every day.
          </GuideProse>
          <GuideProse>
            Need a gate code used, a text instead of a knock, or a lobby
            meetup? Add a delivery note at checkout and the driver will follow
            it.
          </GuideProse>
          <GuideActions primary={{ label: "Start an order", href: "/products" }} />
        </GuideSection>

        <GuideSection
          id="areas"
          title="Where we deliver"
          intro={
            <>
              Same-day coverage in every incorporated city in Ohio. The full
              list is on{" "}
              <GuideLink href="/delivery">delivery areas</GuideLink>.
            </>
          }
        >
          <GuideAreaLinks slugs={DELIVERY_FEATURED_AREA_SLUGS} />
        </GuideSection>

        <GuideSection
          id="order"
          title="What you can order"
          intro={
            <>
              Premium <GuideLink href="/categories/flower">flower</GuideLink> by
              strain type, pre-rolls, edibles, vape carts, disposables, and
              concentrates like live resin and rosin. Browse them all by{" "}
              <GuideLink href="/categories">category</GuideLink>.
            </>
          }
        >
          <GuideChipLinks links={PRODUCT_SEO_LINKS} />
          <p className="mt-6 text-sm text-muted-foreground">
            Not sure where to start? Read{" "}
            <GuideLink href={learnGuidePath("first-delivery-what-to-order")}>
              what to order on your first delivery
            </GuideLink>{" "}
            or{" "}
            <GuideLink href={learnGuidePath("indica-vs-sativa-vs-hybrid")}>
              indica vs sativa vs hybrid
            </GuideLink>
            .
          </p>
        </GuideSection>

        <GuideSection id="reorder" title="Ordered with us before?">
          <GuideProse>
            Reorders work the same way: same hours, same flat $20, same ID check
            at the door. The menu changes often, so take a look before you
            repeat your last order.
          </GuideProse>
          <GuideActions
            primary={{ label: "See what is in stock", href: "/products" }}
            secondary={{ label: "Go to cart", href: "/cart" }}
          />
        </GuideSection>

        <GuideSection id="faq" title="Common questions">
          <GuideFaqs faqs={DELIVERY_FAQS} />
        </GuideSection>

        <GuideSection id="next" title="Keep exploring" wide>
          <GuideNextLinks
            links={buildGuideNextLinks(guide.slug, DELIVERY_EXTRA_NEXT_LINKS)}
          />
        </GuideSection>

        <GuideCtaBand
          title="Ready to order?"
          body="Browse the menu, check out, and have cash and your ID ready when the driver arrives."
          primary={{ label: "Shop the menu", href: "/products" }}
          secondary={{ label: "Delivery FAQ", href: "/faqs" }}
        />
      </Container>
    </main>
  );
}
