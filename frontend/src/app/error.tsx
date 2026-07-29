"use client";

import { useEffect } from "react";

import { getErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};


export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col items-start justify-center gap-4 px-6 py-24">
      <p className="text-sm font-medium text-muted-foreground">Error</p>
      <h1>Something went wrong</h1>
      <p className="text-muted-foreground">
        {getErrorMessage(error, "An unexpected error occurred. You can try again.")}
      </p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
