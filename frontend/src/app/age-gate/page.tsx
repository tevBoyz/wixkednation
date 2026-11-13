"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";

import { WixkedNationLogo } from "@/components/brand/wixkednation-logo";
import { Button } from "@/components/ui/button";
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
      router.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/");
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
    <div className="grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
      {/* Lockup */}
      <div className="relative flex justify-center">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 size-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(110,255,60,0.12),transparent_62%)]"
        />
        <WixkedNationLogo
          variant="stacked"
          size="lg"
          priority
          className="relative w-44 sm:w-56 lg:w-80"
        />
      </div>

      {/* Door-check ticket */}
      <section
        aria-labelledby="age-gate-heading"
        className="overflow-hidden rounded-2xl border border-white/12 bg-[#0b0e0c]"
      >
        <div className="wn-rule" aria-hidden />
        <div className="px-6 pt-7 pb-6 sm:px-9 sm:pt-9">
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-foreground">
              21+
            </span>
          </div>
          <h1
            id="age-gate-heading"
            className="mt-5 text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl"
          >
            Are you 21 or older?
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            You must confirm you are over 21 to enter this store. Our drivers
            check a valid government ID at the door.
          </p>
        </div>

        <div className="relative px-6 sm:px-9" aria-hidden>
          <span className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full bg-background" />
          <span className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full bg-background" />
          <div className="border-t border-dashed border-white/20" />
        </div>

        <div className="flex flex-col gap-3 px-6 pt-6 pb-7 sm:px-9 sm:pb-9">
          <Button
            type="button"
            size="lg"
            className="h-13 w-full justify-between px-6 text-base font-semibold"
            disabled={pending !== null}
            onClick={() => void onYes()}
          >
            <span>{pending === "yes" ? "Checking…" : "Yes, I am 21+"}</span>
            <span aria-hidden>→</span>
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-13 w-full justify-between px-6 text-base"
            disabled={pending !== null}
            onClick={() => void onNo()}
          >
            <span>{pending === "no" ? "Please wait…" : "No, I am under 21"}</span>
            <span aria-hidden className="text-muted-foreground">
              ×
            </span>
          </Button>
          <p className="mt-2 text-center text-xs leading-5 text-muted-foreground">
            Same-day delivery across Ohio ·{" "}
            <span className="whitespace-nowrap">10:00 AM – 10:00 PM</span>
          </p>
        </div>
      </section>
    </div>
  );
}

export default function AgeGatePage() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-background px-4 py-10 sm:px-8">
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
