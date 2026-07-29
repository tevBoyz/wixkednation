import Link from "next/link";
import type { Metadata } from "next";

import { RegisterPageClient } from "@/components/auth/register-form";
import { Container } from "@/components/layout/container";
import { NO_INDEX_METADATA } from "@/lib/seo/site-metadata";

export const metadata: Metadata = {
  ...NO_INDEX_METADATA,
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <Container
      as="main"
      className="flex flex-1 flex-col items-center justify-center gap-6 py-16"
    >
      <RegisterPageClient />
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="underline-offset-4 hover:underline">
          Back to store
        </Link>
      </p>
    </Container>
  );
}
