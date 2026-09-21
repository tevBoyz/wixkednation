import type { Metadata } from "next";
import { Suspense } from "react";

import { ClaimCampaignClient } from "@/components/claim/claim-campaign-client";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return buildPageMetadata({
    title: "Claim your Gas Nation coupon",
    description:
      "Enter your email to receive a Gas Nation coupon code for same-day cannabis delivery in Northern Virginia and DC.",
    path: `/claim/${slug}`,
  });
}

export default function ClaimCampaignPage() {
  return (
    <Suspense
      fallback={
        <main className="px-4 py-14 text-sm text-muted-foreground">
          Loading…
        </main>
      }
    >
      <ClaimCampaignClient />
    </Suspense>
  );
}
