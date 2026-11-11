"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  claimCampaignCoupon,
  fetchClaimCampaign,
} from "@/lib/api/store-coupons.api";
import { getErrorMessage } from "@/lib/api/errors";

export function ClaimCampaignClient() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const source = searchParams.get("src") || undefined;

  const [email, setEmail] = useState("");
  const [doneEmail, setDoneEmail] = useState<string | null>(null);

  const campaignQuery = useQuery({
    queryKey: ["claim-campaign", slug],
    queryFn: () => fetchClaimCampaign(slug),
    enabled: Boolean(slug),
    retry: false,
  });

  const claimMutation = useMutation({
    mutationFn: () =>
      claimCampaignCoupon(slug, {
        email: email.trim(),
        source,
      }),
    onSuccess: (data) => {
      setDoneEmail(data.email);
      toast.success(
        data.resent
          ? "Code resent — check your inbox"
          : "Code sent — check your inbox",
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not claim coupon"));
    },
  });

  if (campaignQuery.isLoading) {
    return (
      <Container as="main" className="py-14">
        <p className="text-sm text-muted-foreground">Loading offer…</p>
      </Container>
    );
  }

  if (campaignQuery.isError || !campaignQuery.data) {
    return (
      <Container as="main" className="py-14">
        <h1 className="text-2xl font-semibold tracking-tight">
          Offer not available
        </h1>
        <p className="mt-2 text-muted-foreground">
          This claim link is inactive or does not exist.
        </p>
        <Button
          className="mt-6"
          render={<Link href="/products" />}
          nativeButton={false}
        >
          Shop the menu
        </Button>
      </Container>
    );
  }

  const campaign = campaignQuery.data;

  if (doneEmail) {
    return (
      <Container as="main" className="py-14">
        <div className="mx-auto max-w-lg space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Check your inbox
          </h1>
          <p className="text-muted-foreground">
            We sent your coupon code for <strong>{campaign.name}</strong> to{" "}
            <strong>{doneEmail}</strong>. Enter it at checkout.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button render={<Link href="/products" />} nativeButton={false}>
              Shop the menu
            </Button>
            <Button
              render={<Link href="/checkout" />}
              nativeButton={false}
              variant="outline"
            >
              Go to checkout
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container as="main" className="py-14">
      <div className="mx-auto max-w-lg space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-primary">Gas Nation offer</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {campaign.name}
          </h1>
          <p className="text-muted-foreground">
            {campaign.description ||
              "Enter your email to receive a coupon code for checkout."}
          </p>
          <p className="text-xs text-muted-foreground">
            21+ with valid ID. One code per email. Delivery is $20 unless your
            coupon waives it.
          </p>
        </header>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            claimMutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="claim-email">Email</Label>
            <Input
              id="claim-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              disabled={claimMutation.isPending}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={claimMutation.isPending}
          >
            {claimMutation.isPending ? "Sending…" : "Email me my code"}
          </Button>
        </form>
      </div>
    </Container>
  );
}
