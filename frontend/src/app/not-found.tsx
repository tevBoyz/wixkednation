import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col items-start justify-center gap-4 px-6 py-24">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1>Page not found</h1>
      <p className="text-muted-foreground">
        The page you requested does not exist or was moved.
      </p>
      <Button render={<Link href="/" />} nativeButton={false}>
        Back to home
      </Button>
    </div>
  );
}
