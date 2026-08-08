"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";

import { GasNationLogo } from "@/components/brand/gasnation-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { blockAgeGate, verifyAgeGate } from "@/lib/api/age-gate";
import { getErrorMessage } from "@/lib/api/errors";
import { persistAgeGateToken } from "@/lib/age-gate/storage";
import { trackPageView } from "@/lib/analytics/track";

function AgeGateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState<"yes" | "no" | null>(null);

  useEffect(() => {
    void trackPageView({ path: "/age-gate" });
  }, []);

  async function onYes() {
    setPending("yes");
    try {
      const data = await verifyAgeGate();
      persistAgeGateToken(data.ageGateToken);
      const next = searchParams.get("next") || "/";
      router.replace(next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Age verification failed"));
      setPending(null);
    }
  }

  async function onNo() {
    setPending("no");
    try {
      await blockAgeGate();
      router.replace("/blocked");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not continue"));
      setPending(null);
    }
  }

  return (
    <Card className="w-full max-w-xl shadow-lg ring-1 ring-foreground/10 sm:max-w-2xl">
      <CardHeader className="items-center gap-4 px-6 pt-8 text-center sm:px-10 sm:pt-10">
        <GasNationLogo
          variant="mark"
          size="lg"
          className="mx-auto"
          markClassName="size-20 sm:size-24"
        />
        <div className="space-y-2">
          <CardTitle className="text-2xl sm:text-3xl">Age verification</CardTitle>
          <CardDescription className="text-base text-balance sm:text-lg">
            You must confirm you are over 21 to enter this store.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-2 text-center sm:px-10">
        <p className="text-xl font-semibold tracking-tight sm:text-2xl">
          Are you over 21?
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 px-6 py-8 sm:flex-row sm:justify-center sm:gap-4 sm:px-10 sm:pb-10">
        <Button
          type="button"
          size="lg"
          className="h-12 w-full min-w-[10rem] text-base sm:w-auto"
          disabled={pending !== null}
          onClick={() => void onYes()}
        >
          {pending === "yes" ? "Checking…" : "Yes, I am 21+"}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 w-full min-w-[10rem] text-base sm:w-auto"
          disabled={pending !== null}
          onClick={() => void onNo()}
        >
          {pending === "no" ? "Please wait…" : "No"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function AgeGatePage() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-background px-4 py-10 sm:px-6">
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading…</p>
        }
      >
        <AgeGateForm />
      </Suspense>
    </div>
  );
}
