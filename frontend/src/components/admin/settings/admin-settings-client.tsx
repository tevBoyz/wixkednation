"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AdminSettingsNav } from "@/components/admin/settings/admin-settings-nav";
import {
  addAdminPhone,
  getAdminSettings,
  removeAdminPhone,
  updateAdminPhoneBanner,
  updateAdminSettings,
  updateSmsSettings,
} from "@/lib/api/admin/settings.api";
import { storeConfigQueryKey } from "@/lib/api/store-config.api";
import { getErrorMessage } from "@/lib/api/errors";
import type { AdminSettings } from "@/lib/api/types";
import {
  ALLOWED_CURRENCIES,
  CURRENCY_LABELS,
  DEFAULT_CURRENCY,
} from "@/lib/catalog/currency";
import { isValidUsPhone, normalizePhone } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const MEASUREMENT_UNITS = [
  "kg",
  "g",
  "L",
  "ml",
  "oz",
  "pcs",
  "pack",
  "bottle",
] as const;

const selectClassName =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50";

const generalSchema = z.object({
  defaultMeasurementUnit: z.string().trim().min(1, "Required"),
  defaultCurrency: z.string().trim().min(1, "Required"),
});

const smsSchema = z.object({
  provider: z.enum(["mock", "twilio"], {
    message: "Select mock or twilio",
  }),
});

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .refine((value) => isValidUsPhone(value), {
      message: "Enter a valid US mobile (e.g. +17035551234)",
    }),
  showOnBanner: z.boolean(),
});

export const adminSettingsQueryKey = ["admin", "settings"] as const;

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function AdminSettingsClient() {
  const queryClient = useQueryClient();
  const [removingPhoneId, setRemovingPhoneId] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: adminSettingsQueryKey,
    queryFn: getAdminSettings,
  });

  const generalForm = useForm<z.infer<typeof generalSchema>>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      defaultMeasurementUnit: "pcs",
      defaultCurrency: DEFAULT_CURRENCY,
    },
  });

  const smsForm = useForm<z.infer<typeof smsSchema>>({
    resolver: zodResolver(smsSchema),
    defaultValues: { provider: "mock" },
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "", showOnBanner: false },
  });

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }

    generalForm.reset({
      defaultMeasurementUnit:
        settingsQuery.data.defaultMeasurementUnit || "pcs",
      defaultCurrency: settingsQuery.data.defaultCurrency || DEFAULT_CURRENCY,
    });

    smsForm.reset({
      provider:
        settingsQuery.data.smsProviderConfig?.provider === "twilio"
          ? "twilio"
          : "mock",
    });
  }, [settingsQuery.data, generalForm, smsForm]);

  const saveGeneralMutation = useMutation({
    mutationFn: updateAdminSettings,
    onSuccess: async (settings) => {
      await queryClient.invalidateQueries({ queryKey: adminSettingsQueryKey });
      await queryClient.invalidateQueries({ queryKey: storeConfigQueryKey });
      generalForm.reset({
        defaultMeasurementUnit: settings.defaultMeasurementUnit || "pcs",
        defaultCurrency: settings.defaultCurrency || DEFAULT_CURRENCY,
      });
      toast.success("General settings saved");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not save settings"));
    },
  });

  const saveSmsMutation = useMutation({
    mutationFn: updateSmsSettings,
    onSuccess: async (settings) => {
      await queryClient.invalidateQueries({ queryKey: adminSettingsQueryKey });
      smsForm.reset({
        provider:
          settings.smsProviderConfig?.provider === "twilio" ? "twilio" : "mock",
      });
      toast.success("SMS settings saved");
      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not save SMS settings"));
    },
  });

  const addPhoneMutation = useMutation({
    mutationFn: ({
      phone,
      showOnBanner,
    }: {
      phone: string;
      showOnBanner: boolean;
    }) => addAdminPhone(phone, { showOnBanner }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminSettingsQueryKey });
      await queryClient.invalidateQueries({ queryKey: storeConfigQueryKey });
      phoneForm.reset({ phone: "", showOnBanner: false });
      toast.success("Admin phone added");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not add phone"));
    },
  });

  const bannerPhoneMutation = useMutation({
    mutationFn: ({
      phoneId,
      showOnBanner,
    }: {
      phoneId: string;
      showOnBanner: boolean;
    }) => updateAdminPhoneBanner(phoneId, showOnBanner),
    onMutate: async ({ phoneId, showOnBanner }) => {
      await queryClient.cancelQueries({ queryKey: adminSettingsQueryKey });
      const previous = queryClient.getQueryData<AdminSettings>(
        adminSettingsQueryKey,
      );
      if (previous?.adminPhoneNumbers) {
        queryClient.setQueryData<AdminSettings>(adminSettingsQueryKey, {
          ...previous,
          adminPhoneNumbers: previous.adminPhoneNumbers.map((entry) =>
            entry.id === phoneId ? { ...entry, showOnBanner } : entry,
          ),
        });
      }
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(adminSettingsQueryKey, context.previous);
      }
      toast.error(getErrorMessage(error, "Could not update banner phone"));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminSettingsQueryKey });
      await queryClient.invalidateQueries({ queryKey: storeConfigQueryKey });
    },
  });

  const removePhoneMutation = useMutation({
    mutationFn: removeAdminPhone,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminSettingsQueryKey });
      await queryClient.invalidateQueries({ queryKey: storeConfigQueryKey });
      setRemovingPhoneId(null);
      toast.success("Admin phone removed");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not remove phone"));
      setRemovingPhoneId(null);
    },
  });

  if (settingsQuery.isLoading) {
    return <SettingsSkeleton />;
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">
          {getErrorMessage(settingsQuery.error, "Could not load settings")}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void settingsQuery.refetch()}
        >
          Try again
        </Button>
      </div>
    );
  }

  const adminPhones = settingsQuery.data.adminPhoneNumbers ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <p className="text-sm text-muted-foreground">Configuration</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Store defaults and alert phone numbers. API secrets stay on the server
          only.
        </p>
      </div>

      <AdminSettingsNav />

      <section className="space-y-4 rounded-lg border border-border p-4">
        <div>
          <h3 className="text-lg font-medium">General</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Store defaults for new products and price display across the
            storefront.
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={generalForm.handleSubmit((values) => {
            saveGeneralMutation.mutate({
              defaultMeasurementUnit: values.defaultMeasurementUnit,
              defaultCurrency: values.defaultCurrency,
            });
          })}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default-measurement-unit">
                Default measurement unit
              </Label>
              <select
                id="default-measurement-unit"
                className={selectClassName}
                disabled={saveGeneralMutation.isPending}
                {...generalForm.register("defaultMeasurementUnit")}
              >
                {MEASUREMENT_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              {generalForm.formState.errors.defaultMeasurementUnit ? (
                <p className="text-sm text-destructive">
                  {generalForm.formState.errors.defaultMeasurementUnit.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-currency">Default currency</Label>
              <select
                id="default-currency"
                className={selectClassName}
                disabled={saveGeneralMutation.isPending}
                {...generalForm.register("defaultCurrency")}
              >
                {ALLOWED_CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {CURRENCY_LABELS[currency]}
                  </option>
                ))}
              </select>
              {generalForm.formState.errors.defaultCurrency ? (
                <p className="text-sm text-destructive">
                  {generalForm.formState.errors.defaultCurrency.message}
                </p>
              ) : null}
            </div>
          </div>

          <Button type="submit" disabled={saveGeneralMutation.isPending}>
            {saveGeneralMutation.isPending ? "Saving…" : "Save general settings"}
          </Button>
        </form>
      </section>

      <section className="space-y-4 rounded-lg border border-border p-4">
        <div>
          <h3 className="text-lg font-medium">Admin alert phones</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Numbers that receive new-order SMS alerts. Enable{" "}
            <span className="font-medium text-foreground">Show on store banner</span>{" "}
            to list a number under the nav for Call / Telegram orders.
          </p>
        </div>

        {adminPhones.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No admin phones configured yet.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {adminPhones.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-2">
                  <span className="font-medium">{entry.phone}</span>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-input"
                      checked={Boolean(entry.showOnBanner)}
                      disabled={bannerPhoneMutation.isPending}
                      onChange={(event) => {
                        bannerPhoneMutation.mutate({
                          phoneId: entry.id,
                          showOnBanner: event.target.checked,
                        });
                      }}
                    />
                    Show on store banner
                  </label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={removePhoneMutation.isPending}
                  onClick={() => {
                    setRemovingPhoneId(entry.id);
                    removePhoneMutation.mutate(entry.id);
                  }}
                >
                  {removingPhoneId === entry.id && removePhoneMutation.isPending
                    ? "Removing…"
                    : "Remove"}
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form
          className="flex flex-col gap-3"
          onSubmit={phoneForm.handleSubmit((values) => {
            addPhoneMutation.mutate({
              phone: normalizePhone(values.phone),
              showOnBanner: values.showOnBanner,
            });
          })}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="admin-alert-phone">Add phone</Label>
              <Input
                id="admin-alert-phone"
                type="tel"
                placeholder="+14696571013"
                disabled={addPhoneMutation.isPending}
                aria-invalid={Boolean(phoneForm.formState.errors.phone)}
                className={cn(
                  phoneForm.formState.errors.phone &&
                    "border-destructive ring-destructive/20",
                )}
                {...phoneForm.register("phone")}
              />
              {phoneForm.formState.errors.phone ? (
                <p className="text-sm text-destructive">
                  {phoneForm.formState.errors.phone.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" disabled={addPhoneMutation.isPending}>
              {addPhoneMutation.isPending ? "Adding…" : "Add phone"}
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="size-4 rounded border-input"
              disabled={addPhoneMutation.isPending}
              {...phoneForm.register("showOnBanner")}
            />
            Show on store banner
          </label>
        </form>
      </section>

      <section className="space-y-4 rounded-lg border border-border p-4">
        <div>
          <h3 className="text-lg font-medium">SMS provider</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Switch between Mock (dev / fallback) and Twilio. Account SID, auth
            token, and from-number stay in backend environment variables.
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={smsForm.handleSubmit((values) => {
            saveSmsMutation.mutate({
              provider: values.provider,
            });
          })}
        >
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="sms-provider">Active provider</Label>
            <select
              id="sms-provider"
              disabled={saveSmsMutation.isPending}
              aria-invalid={Boolean(smsForm.formState.errors.provider)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              {...smsForm.register("provider")}
            >
              <option value="mock">Mock</option>
              <option value="twilio">Twilio</option>
            </select>
            {smsForm.formState.errors.provider ? (
              <p className="text-sm text-destructive">
                {smsForm.formState.errors.provider.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" disabled={saveSmsMutation.isPending}>
            {saveSmsMutation.isPending ? "Saving…" : "Save SMS settings"}
          </Button>
        </form>
      </section>
    </div>
  );
}
