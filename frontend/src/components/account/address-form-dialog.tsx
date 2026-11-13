"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UsPhoneInput,
  usPhoneLocalSchema,
} from "@/components/ui/us-phone-input";
import type { Address } from "@/lib/api/types";
import type { AddressBody } from "@/lib/api/addresses.api";
import { zipCodeSchema } from "@/lib/delivery/zip-codes";
import { normalizePhone, toUsE164, usLocalFromE164 } from "@/lib/phone";

const addressSchema = z.object({
  label: z.string().max(80, "Label is too long"),
  fullName: z.string().trim().min(1, "Full name is required").max(120),
  phone: usPhoneLocalSchema(),
  addressLine1: z.string().trim().min(1, "Address is required").max(200),
  addressLine2: z.string().max(200),
  city: z.string().trim().min(1, "City is required").max(120),
  state: z.string().max(120),
  postalCode: zipCodeSchema(),
  country: z.string().trim().min(1, "Country is required").max(120),
  isDefault: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

type AddressFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: Address | null;
  submitting?: boolean;
  onSubmit: (body: AddressBody) => void | Promise<void>;
};

const emptyValues: AddressFormValues = {
  label: "",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
  isDefault: false,
};

export function AddressFormDialog({
  open,
  onOpenChange,
  address,
  submitting = false,
  onSubmit,
}: AddressFormDialogProps) {
  const isEdit = Boolean(address);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (address) {
      reset({
        label: address.label ?? "",
        fullName: address.fullName,
        phone: usLocalFromE164(address.phone),
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 ?? "",
        city: address.city,
        state: address.state ?? "",
        postalCode: address.postalCode ?? "",
        country: address.country || "United States",
        isDefault: Boolean(address.isDefault),
      });
      return;
    }

    reset(emptyValues);
  }, [open, address, reset]);

  async function submit(values: AddressFormValues) {
    const body: AddressBody = {
      label: values.label.trim() || null,
      fullName: values.fullName.trim(),
      phone: normalizePhone(toUsE164(values.phone)),
      addressLine1: values.addressLine1.trim(),
      addressLine2: values.addressLine2.trim() || null,
      city: values.city.trim(),
      state: values.state.trim() || null,
      postalCode: values.postalCode.trim(),
      country: values.country.trim() || "United States",
      isDefault: values.isDefault,
    };
    await onSubmit(body);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!submitting}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit address" : "Add address"}</DialogTitle>
          <DialogDescription>
            Delivery details for Cash on Delivery orders.
          </DialogDescription>
        </DialogHeader>

        <form
          id="address-form"
          className="grid max-h-[min(60vh,28rem)] gap-3 overflow-y-auto pr-1"
          onSubmit={handleSubmit((values) => void submit(values))}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="address-label">Label (optional)</Label>
            <Input
              id="address-label"
              placeholder="Home, Office…"
              disabled={submitting}
              {...register("label")}
            />
            {errors.label ? (
              <p className="text-sm text-destructive">{errors.label.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address-fullName">Full name</Label>
            <Input
              id="address-fullName"
              autoComplete="name"
              aria-invalid={Boolean(errors.fullName)}
              disabled={submitting}
              {...register("fullName")}
            />
            {errors.fullName ? (
              <p className="text-sm text-destructive">
                {errors.fullName.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address-phone">Phone</Label>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <UsPhoneInput
                  id="address-phone"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={Boolean(errors.phone)}
                  disabled={submitting}
                />
              )}
            />
            {errors.phone ? (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Enter your 10-digit US mobile number.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address-line1">Address line 1</Label>
            <Input
              id="address-line1"
              autoComplete="street-address"
              aria-invalid={Boolean(errors.addressLine1)}
              disabled={submitting}
              {...register("addressLine1")}
            />
            {errors.addressLine1 ? (
              <p className="text-sm text-destructive">
                {errors.addressLine1.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address-line2">Address line 2 (optional)</Label>
            <Input
              id="address-line2"
              autoComplete="address-line2"
              disabled={submitting}
              {...register("addressLine2")}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="address-city">City</Label>
              <Input
                id="address-city"
                autoComplete="address-level2"
                aria-invalid={Boolean(errors.city)}
                disabled={submitting}
                {...register("city")}
              />
              {errors.city ? (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address-state">State (optional)</Label>
              <Input
                id="address-state"
                autoComplete="address-level1"
                disabled={submitting}
                {...register("state")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address-postalCode">ZIP code</Label>
            <Input
              id="address-postalCode"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="43215"
              maxLength={10}
              aria-invalid={Boolean(errors.postalCode)}
              disabled={submitting}
              {...register("postalCode")}
            />
            {errors.postalCode ? (
              <p className="text-sm text-destructive">
                {errors.postalCode.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                We deliver to every incorporated city in Ohio.
              </p>
            )}
          </div>

          <input type="hidden" {...register("country")} />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-input"
              disabled={submitting}
              {...register("isDefault")}
            />
            Set as default delivery address
          </label>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="address-form" disabled={submitting}>
            {submitting
              ? isEdit
                ? "Saving…"
                : "Adding…"
              : isEdit
                ? "Save address"
                : "Add address"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
