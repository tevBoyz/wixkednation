import type { Metadata } from "next";

import { DeliveryRadiusMap } from "@/components/faqs/delivery-radius-map";
import { FaqsAccordion } from "@/components/faqs/faqs-accordion";
import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { FAQ_ITEMS } from "@/content/faqs";
import { buildBreadcrumbJsonLd, buildFaqPageJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Cannabis Delivery FAQ | Hours, Areas, ID & Fees",
  description:
    "Answers about GasNation cannabis delivery near you: Northern Virginia and DC service areas, 10 AM–10 PM hours, $20 delivery fee, 21+ ID rules, and how online ordering works.",
  path: "/faqs",
});

export default function FaqsPage() {
  return (
    <main className="min-w-0 overflow-x-clip">
      <JsonLd data={buildFaqPageJsonLd(FAQ_ITEMS)} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faqs" },
        ])}
      />
      <Container className="min-w-0 py-10 sm:py-14">
        <header className="max-w-2xl">
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Delivery areas, hours, ID rules, fees, and how GasNation cannabis
            delivery works across Northern Virginia and Washington, DC.
          </p>
        </header>

        <div className="mt-8 grid items-start gap-8 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)]">
          <div className="min-w-0">
            <FaqsAccordion />
          </div>
          <DeliveryRadiusMap />
        </div>
      </Container>
    </main>
  );
}
