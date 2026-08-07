"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useAuth } from "@/components/providers/auth-provider";
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
import {
  isAuthTokensPayload,
  isPinSetupPayload,
  sendOtp,
  verifyOtp,
  type OtpPurpose,
} from "@/lib/api/auth.api";
import { getErrorMessage } from "@/lib/api/errors";
import { clearAuthRedirect, POST_AUTH_HOME } from "@/lib/auth/redirect";
import { setSetupToken } from "@/lib/auth/setup-token-storage";
import { isValidAccessPhone, normalizePhone } from "@/lib/phone";

const RESEND_COOLDOWN_SECONDS = 60;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

type OtpFormValues = z.infer<typeof otpSchema>;

function parsePurpose(value: string | null): OtpPurpose {
  return value === "forgot_pin" ? "forgot_pin" : "register";
}

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();

  const rawPhone = searchParams.get("phone") || "";
  const phone = normalizePhone(rawPhone);
  const email = (searchParams.get("email") || "").trim().toLowerCase();
  const channelParam = searchParams.get("channel");
  const purpose = parsePurpose(searchParams.get("purpose"));
  const channel =
    channelParam === "sms" || (phone && isValidAccessPhone(phone) && !email)
      ? "sms"
      : channelParam === "email" || EMAIL_REGEX.test(email)
        ? "email"
        : phone && isValidAccessPhone(phone)
          ? "sms"
          : "email";

  const hasEmail = EMAIL_REGEX.test(email);
  const hasPhone = Boolean(phone && isValidAccessPhone(phone));
  const isValidTarget =
    channel === "email" ? hasEmail : hasPhone;

  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const id = window.setInterval(() => {
      setCooldown((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, [cooldown]);

  if (!isValidTarget) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Missing contact details</CardTitle>
          <CardDescription>
            Start again so we know where to send the code.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            render={
              <Link
                href={purpose === "forgot_pin" ? "/forgot-pin" : "/register"}
              />
            }
            nativeButton={false}
          >
            Go back
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const destinationLabel = channel === "email" ? email : phone;

  async function onSubmit(values: OtpFormValues) {
    setSubmitting(true);
    try {
      const result =
        channel === "email"
          ? await verifyOtp({ email, otp: values.otp, purpose })
          : await verifyOtp({
              phone,
              email: hasEmail ? email : undefined,
              otp: values.otp,
              purpose,
            });

      if (isPinSetupPayload(result)) {
        setSetupToken(result.setupToken);
        clearAuthRedirect();
        toast.success("Verified. Set your PIN to continue.");
        router.replace("/setup-pin");
        return;
      }

      if (isAuthTokensPayload(result)) {
        setSession({
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        });
        toast.success("Signed in successfully");
        clearAuthRedirect();
        router.replace(POST_AUTH_HOME);
        router.refresh();
        return;
      }

      toast.error("Unexpected response from the server.");
      setSubmitting(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Invalid or expired code"));
      setSubmitting(false);
    }
  }

  async function onResend() {
    if (cooldown > 0 || resending) {
      return;
    }

    setResending(true);
    try {
      if (channel === "email") {
        await sendOtp({ email, purpose });
      } else {
        await sendOtp({
          phone,
          ...(hasEmail ? { email } : {}),
          purpose,
        });
      }
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success("A new code was sent if the details are valid.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not resend code"));
    } finally {
      setResending(false);
    }
  }

  const backHref = purpose === "forgot_pin" ? "/forgot-pin" : "/register";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Enter verification code</CardTitle>
        <CardDescription>
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{destinationLabel}</span>
          {purpose === "forgot_pin" ? " to reset your PIN." : "."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">One-time code</Label>
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={6}
              aria-invalid={Boolean(errors.otp)}
              disabled={submitting}
              {...register("otp")}
            />
            {errors.otp ? (
              <p className="text-sm text-destructive">{errors.otp.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                In development, read the code from the backend console{" "}
                <code className="rounded bg-muted px-1">[otp-dev]</code>.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Verifying…" : "Verify"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={cooldown > 0 || resending}
            onClick={() => void onResend()}
          >
            {resending
              ? "Sending…"
              : cooldown > 0
                ? `Resend code in ${cooldown}s`
                : "Resend code"}
          </Button>
          <Button
            render={<Link href={backHref} />}
            nativeButton={false}
            variant="ghost"
          >
            {channel === "email" ? "Change email" : "Change number"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function VerifyOtpPageClient() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
