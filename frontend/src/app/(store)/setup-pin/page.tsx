import Link from "next/link";
import type { Metadata } from "next";

import { SetupPinPageClient } from "@/components/auth/setup-pin-form";
import { Container } from "@/components/layout/container";
import { NO_INDEX_METADATA } from "@/lib/seo/site-metadata";

export const metadata: Metadata = {
  ...NO_INDEX_METADATA,
  title: "Set PIN",
};

export default function SetupPinPage() {
  return (
    <Container
      as="main"
      className="flex flex-1 flex-col items-center justify-center gap-6 py-16"
    >
      <SetupPinPageClient />
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </Container>
  );
}
