"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { getPublicEnv } from "@/config/env";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGoogleStartUrl, sendOtp } from "@/lib/api/auth.api";
import { getErrorMessage } from "@/lib/api/errors";
import { clearAuthRedirect } from "@/lib/auth/redirect";
import { useAuthConfig } from "@/hooks/use-auth-config";
import { isValidAccessPhone, normalizePhone } from "@/lib/phone";

const emailSchema = z.object({
  mode: z.literal("email"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().optional(),
});

const phoneSchema = z.object({
  mode: z.literal("phone"),
  email: z.string().optional(),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine((value) => isValidAccessPhone(value), {
      message: "Enter a valid US mobile (+1…) or test Ethiopian (+2519… / +2517…)",
    }),
});

const forgotSchema = z.discriminatedUnion("mode", [emailSchema, phoneSchema]);

type ForgotFormValues = z.infer<typeof forgotSchema>;

function ForgotPinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: authConfig } = useAuthConfig();
  const smsEnabled = Boolean(authConfig?.smsOtpEnabled);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"email" | "phone">("email");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { mode: "email", email: "", phone: "" },
  });

  useEffect(() => {
    setValue("mode", mode);
  }, [mode, setValue]);

  useEffect(() => {
    if (!smsEnabled && mode === "phone") {
      setMode("email");
    }
  }, [smsEnabled, mode]);

  useEffect(() => {
    const raw = searchParams.get("phone") || "";
    const phone = normalizePhone(raw);
    if (phone && isValidAccessPhone(phone) && smsEnabled) {
      setMode("phone");
      setValue("phone", phone, { shouldValidate: true });
    }
  }, [searchParams, setValue, smsEnabled]);

  function continueWithGoogle() {
    clearAuthRedirect();
    const { apiUrl } = getPublicEnv();
    window.location.assign(getGoogleStartUrl(apiUrl));
  }

  async function onSubmit(values: ForgotFormValues) {
    setSubmitting(true);

    try {
      if (values.mode === "email") {
        const email = values.email.trim().toLowerCase();
        await sendOtp({ email, purpose: "forgot_pin" });
        toast.success("If that email is registered, a code was sent.");
        const params = new URLSearchParams({
          email,
          purpose: "forgot_pin",
          channel: "email",
        });
        clearAuthRedirect();
        router.push(`/verify-otp?${params.toString()}`);
        return;
      }

      const phone = normalizePhone(values.phone);
      await sendOtp({ phone, purpose: "forgot_pin" });
      toast.success("If that number is registered, a code was sent.");
      const params = new URLSearchParams({
        phone,
        purpose: "forgot_pin",
        channel: "sms",
      });
      clearAuthRedirect();
      router.push(`/verify-otp?${params.toString()}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not send reset code"));
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Forgot PIN</CardTitle>
        <CardDescription>
          Verify your email with a one-time code, or continue with Google, then
          set a new PIN.
          {smsEnabled ? " Phone SMS reset is also available." : ""}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {smsEnabled ? (
            <div className="flex gap-2" role="group" aria-label="Reset with">
              <Button
                type="button"
                variant={mode === "email" ? "default" : "outline"}
                className="flex-1"
                disabled={submitting}
                onClick={() => setMode("email")}
              >
                Email
              </Button>
              <Button
                type="button"
                variant={mode === "phone" ? "default" : "outline"}
                className="flex-1"
                disabled={submitting}
                onClick={() => setMode("phone")}
              >
                Phone
              </Button>
            </div>
          ) : null}

          {mode === "email" ? (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                disabled={submitting}
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+17035551234"
                aria-invalid={Boolean(
                  "phone" in errors ? errors.phone : false,
                )}
                disabled={submitting}
                {...register("phone")}
              />
              {"phone" in errors && errors.phone ? (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              ) : null}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Sending code…" : "Send reset code"}
          </Button>
          {authConfig?.googleEnabled !== false ? (
            <>
              <div className="relative flex w-full items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={submitting}
                onClick={continueWithGoogle}
              >
                Continue with Google
              </Button>
            </>
          ) : null}
          <p className="text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export function ForgotPinPageClient() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
    >
      <ForgotPinForm />
    </Suspense>
  );
}
