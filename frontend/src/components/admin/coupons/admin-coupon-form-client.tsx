"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { adminCouponsQueryKey } from "@/components/admin/coupons/admin-coupons-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAdminCoupon,
  updateAdminCoupon,
  type AdminCouponBody,
} from "@/lib/api/admin/coupons.api";
import { getErrorMessage } from "@/lib/api/errors";
import type { Coupon, CouponType } from "@/lib/api/types";
import { useClaimUrl } from "@/hooks/use-storefront-origin";

type AdminCouponFormClientProps = {
  coupon?: Coupon | null;
};

function toDateInput(value?: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

export function AdminCouponFormClient({
  coupon = null,
}: AdminCouponFormClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = Boolean(coupon);

  const [name, setName] = useState(coupon?.name || "");
  const [code, setCode] = useState(coupon?.code || "");
  const [type, setType] = useState<CouponType>(
    coupon?.type || "free_delivery",
  );
  const [amount, setAmount] = useState(
    coupon?.amount != null ? String(coupon.amount) : "",
  );
  const [startsAt, setStartsAt] = useState(toDateInput(coupon?.startsAt));
  const [endsAt, setEndsAt] = useState(toDateInput(coupon?.endsAt));
  const [maxRedemptions, setMaxRedemptions] = useState(
    coupon?.maxRedemptions != null ? String(coupon.maxRedemptions) : "",
  );
  const [maxPerCustomer, setMaxPerCustomer] = useState(
    String(coupon?.maxPerCustomer ?? 1),
  );
  const [minSubtotal, setMinSubtotal] = useState(
    coupon?.minSubtotal != null ? String(coupon.minSubtotal) : "",
  );
  const [newCustomersOnly, setNewCustomersOnly] = useState(
    Boolean(coupon?.newCustomersOnly),
  );
  const [isUniqueIssue, setIsUniqueIssue] = useState(
    Boolean(coupon?.isUniqueIssue),
  );
  const [claimSlug, setClaimSlug] = useState(coupon?.claimSlug || "");

  const claimPreview = useClaimUrl(isUniqueIssue ? claimSlug : null);

  const mutation = useMutation({
    mutationFn: async () => {
      const body: AdminCouponBody = {
        name: name.trim() || code.trim() || "Coupon",
        type,
        amount:
          type === "free_delivery"
            ? null
            : amount.trim()
              ? Number(amount)
              : null,
        startsAt: startsAt || null,
        endsAt: endsAt || null,
        maxRedemptions: maxRedemptions.trim()
          ? Number.parseInt(maxRedemptions, 10)
          : null,
        maxPerCustomer: Number.parseInt(maxPerCustomer, 10) || 1,
        minSubtotal: minSubtotal.trim() ? Number(minSubtotal) : null,
        newCustomersOnly,
        isUniqueIssue,
        claimSlug: isUniqueIssue && claimSlug.trim() ? claimSlug.trim() : null,
      };

      if (!isEdit) {
        body.code = code.trim() || null;
        return createAdminCoupon(body);
      }
      return updateAdminCoupon(coupon!.id, body);
    },
    onSuccess: async (saved) => {
      toast.success(isEdit ? "Coupon updated" : "Coupon created");
      await queryClient.invalidateQueries({ queryKey: adminCouponsQueryKey });
      router.push(`/admin/coupons/${saved.id}`);
      router.refresh();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Could not save coupon"));
    },
  });

  return (
    <form
      className="mx-auto flex w-full max-w-2xl flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button
            render={<Link href="/admin/coupons" />}
            nativeButton={false}
            variant="outline"
            size="sm"
          >
            Back
          </Button>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">
            {isEdit ? "Edit coupon" : "New coupon"}
          </h2>
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save"}
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="coupon-name">Name</Label>
        <Input
          id="coupon-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Weekend free delivery"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="coupon-code">Code</Label>
        <Input
          id="coupon-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Leave blank to auto-generate"
          disabled={isEdit}
          className="font-mono"
        />
        {isEdit ? (
          <p className="text-xs text-muted-foreground">
            Codes cannot be changed after create.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="coupon-type">Type</Label>
        <select
          id="coupon-type"
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          value={type}
          disabled={isEdit}
          onChange={(e) => setType(e.target.value as CouponType)}
        >
          <option value="free_delivery">Free delivery ($20 waived)</option>
          <option value="fixed_amount">Fixed $ off products</option>
          <option value="percent_off">Percent off products</option>
        </select>
      </div>

      {type !== "free_delivery" ? (
        <div className="space-y-2">
          <Label htmlFor="coupon-amount">
            {type === "percent_off" ? "Percent" : "Amount ($)"}
          </Label>
          <Input
            id="coupon-amount"
            type="number"
            min={0}
            max={type === "percent_off" ? 100 : undefined}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Applied to product subtotal before the $20 delivery fee.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="coupon-starts">Starts (optional)</Label>
          <Input
            id="coupon-starts"
            type="date"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="coupon-ends">Ends (optional)</Label>
          <Input
            id="coupon-ends"
            type="date"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="coupon-max">Max total redemptions</Label>
          <Input
            id="coupon-max"
            type="number"
            min={1}
            value={maxRedemptions}
            onChange={(e) => setMaxRedemptions(e.target.value)}
            placeholder="Unlimited"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="coupon-per-customer">Max per customer</Label>
          <Input
            id="coupon-per-customer"
            type="number"
            min={1}
            value={maxPerCustomer}
            onChange={(e) => setMaxPerCustomer(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="coupon-min">Minimum subtotal (optional)</Label>
        <Input
          id="coupon-min"
          type="number"
          min={0}
          step="0.01"
          value={minSubtotal}
          onChange={(e) => setMinSubtotal(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={newCustomersOnly}
          onChange={(e) => setNewCustomersOnly(e.target.checked)}
        />
        New customers only (no prior delivered order)
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isUniqueIssue}
          disabled={isEdit}
          onChange={(e) => {
            setIsUniqueIssue(e.target.checked);
            if (!e.target.checked) {
              setClaimSlug("");
            }
          }}
        />
        Unique email-issued codes (claim page)
      </label>

      {isUniqueIssue ? (
        <div className="space-y-2">
          <Label htmlFor="coupon-slug">Claim slug</Label>
          <Input
            id="coupon-slug"
            value={claimSlug}
            onChange={(e) =>
              setClaimSlug(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]+/g, "-")
                  .replace(/^-+|-+$/g, ""),
              )
            }
            placeholder="weekend-free"
          />
          {claimPreview ? (
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Full claim link (copy for Instagram / ads)
              </p>
              <p className="break-all font-mono text-sm text-foreground">
                {claimPreview}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(claimPreview);
                  toast.success("Full claim URL copied");
                }}
              >
                Copy full link
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Set a slug to get a full public claim URL for social posts.
            </p>
          )}
        </div>
      ) : null}
    </form>
  );
}
