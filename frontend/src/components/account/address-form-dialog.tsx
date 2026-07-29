"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import type { Address } from "@/lib/api/types";
import type { AddressBody } from "@/lib/api/addresses.api";
import { isValidEthiopianPhone, normalizePhone } from "@/lib/phone";

const addressSchema = z.object({
  label: z.string().max(80, "Label is too long"),
  fullName: z.string().trim().min(1, "Full name is required").max(120),
  phone: z
    .string()
    .min(1, "Phone is required")
    .refine((value) => isValidEthiopianPhone(value), {
      message: "Enter a valid Ethiopian mobile (+2519… or +2517…)",
    }),
  addressLine1: z.string().trim().min(1, "Address is required").max(200),
  addressLine2: z.string().max(200),
  city: z.string().trim().min(1, "City is required").max(120),
  state: z.string().max(120),
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
  country: "Ethiopia",
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
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 ?? "",
        city: address.city,
        state: address.state ?? "",
        country: address.country || "Ethiopia",
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
      phone: normalizePhone(values.phone),
      addressLine1: values.addressLine1.trim(),
      addressLine2: values.addressLine2.trim() || null,
      city: values.city.trim(),
      state: values.state.trim() || null,
      country: values.country.trim() || "Ethiopia",
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
            <Input
              id="address-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+251911000000"
              aria-invalid={Boolean(errors.phone)}
              disabled={submitting}
              {...register("phone")}
            />
            {errors.phone ? (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address-line1">Address line 1</Label>
            <Input
              id="address-line1"
              autoComplete="address-line1"
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
              <Label htmlFor="address-state">State / region (optional)</Label>
              <Input
                id="address-state"
                autoComplete="address-level1"
                disabled={submitting}
                {...register("state")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address-country">Country</Label>
            <Input
              id="address-country"
              autoComplete="country-name"
              aria-invalid={Boolean(errors.country)}
              disabled={submitting}
              {...register("country")}
            />
            {errors.country ? (
              <p className="text-sm text-destructive">
                {errors.country.message}
              </p>
            ) : null}
          </div>

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
