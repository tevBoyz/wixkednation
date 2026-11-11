import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { GuideActions } from "@/components/learn/guide-actions";
import { GuideAreaLinks } from "@/components/learn/guide-area-links";
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
import { GuideSteps } from "@/components/learn/guide-steps";
import {
  buildGuideMetadata,
  buildGuideNextLinks,
  getLearnGuide,
  learnGuidePath,
} from "@/content/learn";
import {
  RULES_ACCEPTED_IDS,
  RULES_AREA_SLUGS,
  RULES_DOOR_STEPS,
  RULES_EXTRA_NEXT_LINKS,
  RULES_FAQS,
  RULES_QUICK_FACTS,
} from "@/content/learn/is-weed-delivery-legal-virginia-dc";

const guide = getLearnGuide("is-weed-delivery-legal-virginia-dc");

export const metadata: Metadata = buildGuideMetadata(guide);

export default function WhoCanOrderPage() {
  return (
    <main className="min-w-0 overflow-x-clip">
      <GuideJsonLd
        title={guide.navLabel}
        path={learnGuidePath(guide.slug)}
        faqs={RULES_FAQS}
      />

      <Container className="min-w-0 py-10 sm:py-14">
        <GuideBreadcrumb title={guide.navLabel} />

        <GuideHero
          eyebrow={guide.eyebrow}
          title={guide.title}
          lead={
            <>
              If you are 21 or older with a valid ID and you are at an{" "}
              <GuideLink href="/delivery">address we serve</GuideLink> in{" "}
              <GuideLink href="/delivery/northern-virginia">
                Northern Virginia
              </GuideLink>{" "}
              or{" "}
              <GuideLink href="/delivery/washington-dc">Washington, DC</GuideLink>
              , you can order from <GuideLink href="/">Gas Nation</GuideLink>.
              Below is what we check at the door, who is eligible, and the limits
              on every order.
            </>
          }
          primary={{ label: "Shop the menu", href: "/products" }}
          secondary={{ label: "Check delivery areas", href: "/delivery" }}
        />

        <GuideQuickFacts facts={RULES_QUICK_FACTS} />

        <GuideSection id="policy" title="Our policy">
          <GuideProse>
            Gas Nation delivers to adults 21 and over across Northern Virginia
            and Washington, DC. You do not need a medical card. You do need a
            valid government ID, and you need to be the one who receives the
            order.
          </GuideProse>
          <p className="mt-4 rounded-lg border border-border bg-card/50 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            This page describes Gas Nation&apos;s ordering policies and is not
            legal advice. Cannabis rules differ between Virginia and DC and can
            change, so check current local law if you have questions about your
            situation.
          </p>
        </GuideSection>

        <GuideSection
          id="ids"
          title="Which IDs we accept"
          intro={
            <>
              We check ID on every order and make no exceptions. See the{" "}
              <GuideLink href="/faqs">delivery FAQ</GuideLink> for more.
            </>
          }
        >
          <GuideChecklist items={RULES_ACCEPTED_IDS} />
        </GuideSection>

        <GuideSection id="door" title="What happens at the door">
          <GuideSteps steps={RULES_DOOR_STEPS} />
          <p className="mt-6 text-sm text-muted-foreground">
            For the whole process from checkout to drop-off, see{" "}
            <GuideLink href={learnGuidePath("how-delivery-works")}>
              how delivery works
            </GuideLink>
            .
          </p>
        </GuideSection>

        <GuideSection id="visitors" title="Visitors, hotels, and temporary stays">
          <GuideProse>
            Visiting from another city, state, or country? You can still order.
            If you are over 21 with a valid ID (a passport works), we deliver to
            hotels, short-term rentals, and friends&apos; places inside our
            service area.
          </GuideProse>
          <GuideProse>
            Add a delivery note at checkout with your room number, lobby
            instructions, or gate code so the driver can find you quickly.
            Drivers use plain cars and wear plain clothes.
          </GuideProse>
        </GuideSection>

        <GuideSection id="limits" title="How much you can order">
          <GuideProse>
            Customers may order up to 8 ounces of dry flower in any 30-day
            rolling period. Most orders are far below that. If you are planning
            a larger order, contact us first.
          </GuideProse>
          <GuideProse>
            Not sure how much to get? See{" "}
            <GuideLink href={learnGuidePath("first-delivery-what-to-order")}>
              what to order on your first delivery
            </GuideLink>
            .
          </GuideProse>
        </GuideSection>

        <GuideSection
          id="areas"
          title="Where you can order to"
          intro={
            <>
              Same-day delivery across Northern Virginia and into Washington, DC.
              Homes, apartments, hotels, and temporary stays all work.{" "}
              <GuideLink href={learnGuidePath("how-delivery-works")}>
                See how delivery works
              </GuideLink>
              .
            </>
          }
        >
          <GuideAreaLinks slugs={RULES_AREA_SLUGS} />
        </GuideSection>

        <GuideSection id="ready" title="Meet the requirements?">
          <GuideProse>
            Pick something from the menu, check out as a guest or with an
            account, and have your ID and cash ready when the driver arrives.
          </GuideProse>
          <GuideActions
            primary={{ label: "Start an order", href: "/products" }}
            secondary={{
              label: "Indica vs sativa vs hybrid",
              href: learnGuidePath("indica-vs-sativa-vs-hybrid"),
            }}
          />
        </GuideSection>

        <GuideSection id="faq" title="Common questions">
          <GuideFaqs faqs={RULES_FAQS} />
        </GuideSection>

        <GuideSection id="next" title="Keep exploring" wide>
          <GuideNextLinks
            links={buildGuideNextLinks(guide.slug, RULES_EXTRA_NEXT_LINKS)}
          />
        </GuideSection>

        <GuideCtaBand
          title="21+ with your ID handy?"
          body="Browse today's menu and get it delivered same-day. Flat $20 delivery, cash at the door."
          primary={{ label: "Shop the menu", href: "/products" }}
          secondary={{ label: "Delivery FAQ", href: "/faqs" }}
        />
      </Container>
    </main>
  );
}
