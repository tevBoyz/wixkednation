import type { Metadata } from "next";

import { NO_INDEX_METADATA } from "@/lib/seo/site-metadata";

export const metadata: Metadata = {
  ...NO_INDEX_METADATA,
  title: "Age verification",
  description: "Confirm you are 21 or older to enter Wixked Nation.",
};

export default function AgeGateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
