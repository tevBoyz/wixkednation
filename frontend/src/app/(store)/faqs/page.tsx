import type { Metadata } from "next";

import { DeliveryRadiusMap } from "@/components/faqs/delivery-radius-map";
import { FaqsAccordion } from "@/components/faqs/faqs-accordion";
import { Container } from "@/components/layout/container";
import { SITE_NAME } from "@/config/brand";
import {
  BRAND_OG_IMAGE_PATH,
  getBrandOgImageMetadata,
} from "@/lib/seo/site-metadata";

export const metadata: Metadata = {
  title: "FAQ",
  description: `Answers about GasNation delivery, hours, ID requirements, fees, and more on ${SITE_NAME}.`,
  openGraph: {
    title: "FAQ",
    description: `Answers about GasNation delivery, hours, ID requirements, fees, and more on ${SITE_NAME}.`,
    images: [getBrandOgImageMetadata()],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ",
    description: `Answers about GasNation delivery, hours, ID requirements, fees, and more on ${SITE_NAME}.`,
    images: [BRAND_OG_IMAGE_PATH],
  },
};

export default function FaqsPage() {
  return (
    <main className="min-w-0 overflow-x-clip">
      <Container className="min-w-0 py-10 sm:py-14">
        <header className="max-w-2xl">
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Delivery areas, hours, ID rules, fees, and how GasNation orders
            work.
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
