import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export default function ForbiddenPage() {
  return (
    <Container
      as="main"
      className="flex flex-1 flex-col items-start justify-center gap-4 py-16"
    >
      <p className="text-sm font-medium text-muted-foreground">403</p>
      <h1>Access denied</h1>
      <p className="max-w-md text-muted-foreground">
        You do not have permission to view this page. If you believe this is a
        mistake, sign in with an admin account.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button render={<Link href="/" />} nativeButton={false}>
          Back to store
        </Button>
        <Button
          render={<Link href="/account" />}
          nativeButton={false}
          variant="outline"
        >
          My account
        </Button>
      </div>
    </Container>
  );
}
