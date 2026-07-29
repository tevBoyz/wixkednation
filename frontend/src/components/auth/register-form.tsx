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
import { isValidEthiopianPhone, normalizePhone } from "@/lib/phone";

const registerSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine((value) => isValidEthiopianPhone(value), {
      message: "Enter a valid Ethiopian mobile (+2519… or +2517…)",
    }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { phone: "" },
  });

  useEffect(() => {
    const raw = searchParams.get("phone") || "";
    const phone = normalizePhone(raw);
    if (phone && isValidEthiopianPhone(phone)) {
      setValue("phone", phone, { shouldValidate: true });
    }
  }, [searchParams, setValue]);

  function continueWithGoogle() {
    clearAuthRedirect();
    const { apiUrl } = getPublicEnv();
    window.location.assign(getGoogleStartUrl(apiUrl));
  }

  async function onSubmit(values: RegisterFormValues) {
    const phone = normalizePhone(values.phone);
    setSubmitting(true);

    try {
      await sendOtp(phone, "register");
      toast.success("If that number is valid, a code was sent.");

      const params = new URLSearchParams({
        phone,
        purpose: "register",
      });
      clearAuthRedirect();
      router.push(`/verify-otp?${params.toString()}`);
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Could not start registration. If you already have a PIN, sign in instead.",
        ),
      );
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Verify your phone with a one-time code, or continue with Google, then
          set a PIN for daily sign-in.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
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
            ) : (
              <p className="text-xs text-muted-foreground">
                Formats like 0911…, 911…, or +251911… are accepted.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Sending code…" : "Send code"}
          </Button>
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
          <p className="text-center text-sm text-muted-foreground">
            Already have a PIN?{" "}
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

export function RegisterPageClient() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
    >
      <RegisterForm />
    </Suspense>
  );
}
