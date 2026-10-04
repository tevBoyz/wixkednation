import type { Metadata } from "next";

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
  FIRST_ORDER_AMOUNT_NOTES,
  FIRST_ORDER_CHECKLIST,
  FIRST_ORDER_EXTRA_NEXT_LINKS,
  FIRST_ORDER_FAQS,
  FIRST_ORDER_FORMATS,
  FIRST_ORDER_GOALS,
  FIRST_ORDER_QUICK_FACTS,
} from "@/content/learn/first-delivery-what-to-order";

const guide = getLearnGuide("first-delivery-what-to-order");

export const metadata: Metadata = buildGuideMetadata(guide);

const EXAMPLE_BASKET = [
  { label: "Products in your cart", value: "$60" },
  { label: "Flat delivery fee", value: "$20" },
  { label: "Cash at the door", value: "$80" },
] as const;

export default function FirstDeliveryWhatToOrderPage() {
  return (
    <main className="min-w-0 overflow-x-clip">
      <GuideJsonLd
        title={guide.navLabel}
        path={learnGuidePath(guide.slug)}
        faqs={FIRST_ORDER_FAQS}
      />

      <Container className="min-w-0 py-10 sm:py-14">
        <GuideBreadcrumb title={guide.navLabel} />

        <GuideHero
          eyebrow={guide.eyebrow}
          title={guide.title}
          lead="First time ordering with Gas Nation? Pick based on your plans for the night, keep the first order small, and check what you will pay at the door before you check out."
          primary={{ label: "Shop the menu", href: "/products" }}
          secondary={{ label: "Shop by category", href: "/categories" }}
        />

        <GuideQuickFacts facts={FIRST_ORDER_QUICK_FACTS} />

        <GuideSection
          id="goals"
          title="Start with your plans"
          intro="Pick the option closest to your night and start shopping in that category."
          wide
        >
          <GuideNextLinks links={FIRST_ORDER_GOALS} />
          <p className="mt-6 max-w-3xl text-sm text-muted-foreground">
            For more on strain types, read{" "}
            <GuideLink href={learnGuidePath("indica-vs-sativa-vs-hybrid")}>
              indica vs sativa vs hybrid
            </GuideLink>
            .
          </p>
        </GuideSection>

        <GuideSection id="amount" title="How much to order the first time">
          <GuideChecklist items={FIRST_ORDER_AMOUNT_NOTES} />
        </GuideSection>

        <GuideSection
          id="formats"
          title="Pick a format"
          intro="The format changes how you use it, how fast you feel it, and how strong it is."
        >
          <GuideChecklist items={FIRST_ORDER_FORMATS} />
        </GuideSection>

        <GuideSection
          id="basket"
          title="What you will pay: an example"
          intro="Menu prices are for the products only. The flat $20 delivery fee is added at checkout, and you pay the total in cash."
        >
          <dl className="mt-6 divide-y divide-border rounded-lg border border-border bg-card/50">
            {EXAMPLE_BASKET.map((row, index) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <dt
                  className={
                    index === EXAMPLE_BASKET.length - 1
                      ? "font-semibold"
                      : "text-muted-foreground"
                  }
                >
                  {row.label}
                </dt>
                <dd
                  className={
                    index === EXAMPLE_BASKET.length - 1
                      ? "font-semibold"
                      : "font-medium"
                  }
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
          <GuideProse>
            The $60 is only an example. Your cart shows your actual subtotal.
            Tips are optional and paid in cash. The delivery fee is only waived
            with a free-delivery coupon from Gas Nation.
          </GuideProse>
          <GuideActions
            primary={{ label: "Build your order", href: "/products" }}
            secondary={{ label: "View cart", href: "/cart" }}
          />
        </GuideSection>

        <GuideSection
          id="checklist"
          title="Before the driver arrives"
          intro="Have these ready before the driver gets to you."
        >
          <GuideChecklist items={FIRST_ORDER_CHECKLIST} />
          <p className="mt-6 text-sm text-muted-foreground">
            See the full process in{" "}
            <GuideLink href={learnGuidePath("how-delivery-works")}>
              how delivery works
            </GuideLink>{" "}
            and who qualifies in{" "}
            <GuideLink href={learnGuidePath("is-weed-delivery-legal-virginia-dc")}>
              who can order
            </GuideLink>
            .
          </p>
        </GuideSection>

        <GuideSection id="faq" title="Common questions">
          <GuideFaqs faqs={FIRST_ORDER_FAQS} />
        </GuideSection>

        <GuideSection id="next" title="Keep exploring" wide>
          <GuideNextLinks
            links={buildGuideNextLinks(guide.slug, FIRST_ORDER_EXTRA_NEXT_LINKS)}
          />
        </GuideSection>

        <GuideCtaBand
          title="Ready for your first order?"
          body="Pick one or two things, check out as a guest, and have your ID and cash ready. We deliver the same day."
          primary={{ label: "Shop the menu", href: "/products" }}
          secondary={{ label: "Shop by category", href: "/categories" }}
        />
      </Container>
    </main>
  );
}
