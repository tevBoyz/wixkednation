"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePin } from "@/lib/api/auth.api";
import { getErrorMessage } from "@/lib/api/errors";
import { pinSchema } from "@/lib/auth/pin";

const changePinSchema = z
  .object({
    currentPin: pinSchema,
    newPin: pinSchema,
    confirmPin: z.string().trim(),
  })
  .refine((values) => values.newPin === values.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  })
  .refine((values) => values.currentPin !== values.newPin, {
    message: "New PIN must be different from current PIN",
    path: ["newPin"],
  });

type ChangePinFormValues = z.infer<typeof changePinSchema>;

export function ChangePinForm() {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePinFormValues>({
    resolver: zodResolver(changePinSchema),
    defaultValues: {
      currentPin: "",
      newPin: "",
      confirmPin: "",
    },
  });

  async function onSubmit(values: ChangePinFormValues) {
    setSubmitting(true);
    try {
      await changePin({
        currentPin: values.currentPin,
        newPin: values.newPin,
        confirmPin: values.confirmPin,
      });
      reset();
      toast.success("PIN updated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not change PIN"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="max-w-md space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="currentPin">Current PIN</Label>
        <Input
          id="currentPin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={6}
          className="tracking-widest"
          aria-invalid={Boolean(errors.currentPin)}
          disabled={submitting}
          {...register("currentPin")}
        />
        {errors.currentPin ? (
          <p className="text-sm text-destructive">{errors.currentPin.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPin">New PIN</Label>
        <Input
          id="newPin"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={6}
          className="tracking-widest"
          aria-invalid={Boolean(errors.newPin)}
          disabled={submitting}
          {...register("newPin")}
        />
        {errors.newPin ? (
          <p className="text-sm text-destructive">{errors.newPin.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPin">Confirm new PIN</Label>
        <Input
          id="confirmPin"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={6}
          className="tracking-widest"
          aria-invalid={Boolean(errors.confirmPin)}
          disabled={submitting}
          {...register("confirmPin")}
        />
        {errors.confirmPin ? (
          <p className="text-sm text-destructive">{errors.confirmPin.message}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Updating…" : "Update PIN"}
      </Button>
    </form>
  );
}
