"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
  UsPhoneInput,
} from "@/components/ui/us-phone-input";
import { pinLogin } from "@/lib/api/auth.api";
import { ApiError, getErrorMessage } from "@/lib/api/errors";
import { pinSchema } from "@/lib/auth/pin";
import { clearAuthRedirect, POST_AUTH_HOME } from "@/lib/auth/redirect";
import { useAuthConfig } from "@/hooks/use-auth-config";
import { isValidUsPhone, normalizePhone, toUsE164, usLocalFromE164 } from "@/lib/phone";
import { cn } from "@/lib/utils";

const loginSchema = z
  .object({
    mode: z.enum(["phone", "email"]),
    phone: z.string(),
    email: z.string(),
    pin: pinSchema,
  })
  .superRefine((values, ctx) => {
    if (values.mode === "phone") {
      if (!values.phone.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["phone"],
          message: "Phone number is required",
        });
      } else if (!isValidUsPhone(toUsE164(values.phone))) {
        ctx.addIssue({
          code: "custom",
          path: ["phone"],
          message: "Enter a valid 10-digit US phone number",
        });
      }
      return;
    }

    const email = values.email.trim();
    if (!email) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Email is required",
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Enter a valid email",
      });
    }
  });

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const { data: authConfig } = useAuthConfig();
  const smsEnabled = Boolean(authConfig?.smsOtpEnabled);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"phone" | "email">("email");

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      mode: "email",
      phone: "",
      email: "",
      pin: "",
    },
  });

  useEffect(() => {
    if (!smsEnabled && mode === "phone") {
      setMode("email");
      setValue("mode", "email");
    }
  }, [smsEnabled, mode, setValue]);

  useEffect(() => {
    const raw = searchParams.get("phone") || "";
    const phone = normalizePhone(raw);
    if (phone && isValidUsPhone(phone) && smsEnabled) {
      setMode("phone");
      setValue("mode", "phone");
      setValue("phone", usLocalFromE164(phone), { shouldValidate: true });
    }
  }, [searchParams, setValue, smsEnabled]);

  function selectMode(next: "phone" | "email") {
    if (next === "phone" && !smsEnabled) {
      return;
    }
    setMode(next);
    setValue("mode", next, { shouldValidate: true });
  }

  async function onSubmit(values: LoginFormValues) {
    setSubmitting(true);
    try {
      const result =
        values.mode === "phone"
          ? await pinLogin({
              phone: normalizePhone(toUsE164(values.phone)),
              pin: values.pin,
            })
          : await pinLogin({
              email: values.email.trim().toLowerCase(),
              pin: values.pin,
            });

      setSession({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      toast.success("Signed in");
      clearAuthRedirect();
      router.replace(POST_AUTH_HOME);
      router.refresh();
    } catch (error) {
      const fallback =
        error instanceof ApiError && error.status === 423
          ? "Too many failed attempts. Try again in about 15 minutes."
          : error instanceof ApiError && error.status === 401
            ? "Incorrect PIN or account details."
            : "Could not sign in";
      toast.error(getErrorMessage(error, fallback));
      setSubmitting(false);
    }
  }

  function buildAuthHref(path: string) {
    return path;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Log in with your email and PIN
          {smsEnabled ? " (phone login available when SMS is enabled)" : ""}.
          New accounts use email verification or Google first.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate autoComplete="off">
        <CardContent className="space-y-4">
          {smsEnabled ? (
            <div className="flex gap-2" role="group" aria-label="Sign in with">
              <Button
                type="button"
                variant={mode === "email" ? "default" : "outline"}
                className="flex-1"
                disabled={submitting}
                onClick={() => selectMode("email")}
              >
                Email
              </Button>
              <Button
                type="button"
                variant={mode === "phone" ? "default" : "outline"}
                className="flex-1"
                disabled={submitting}
                onClick={() => selectMode("phone")}
              >
                Phone
              </Button>
            </div>
          ) : null}

          {mode === "phone" && smsEnabled ? (
            <div className="space-y-2">
              <Label htmlFor="login-phone">Phone number</Label>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <UsPhoneInput
                    id="login-phone"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(errors.phone)}
                    disabled={submitting}
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    autoComplete="off"
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
          ) : (
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                disabled={submitting}
                {...register("email")}
                autoComplete="username"
              />
              {errors.email ? (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              ) : null}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="login-pin">PIN</Label>
            <Input
              id="login-pin"
              type="password"
              inputMode="numeric"
              placeholder="4-6 digits"
              maxLength={6}
              aria-invalid={Boolean(errors.pin)}
              disabled={submitting}
              className={cn("tracking-widest")}
              {...register("pin")}
              // Avoid pairing with username autofill (would dump email into phone)
              autoComplete="one-time-code"
            />
            {errors.pin ? (
              <p className="text-sm text-destructive">{errors.pin.message}</p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Log in"}
          </Button>
          <div className="flex w-full flex-wrap items-center justify-between gap-2 text-sm">
            <Link
              href={buildAuthHref("/forgot-pin")}
              className="text-muted-foreground underline-offset-4 hover:underline"
            >
              Forgot PIN?
            </Link>
            <Link
              href={buildAuthHref("/register")}
              className="font-medium underline-offset-4 hover:underline"
            >
              New here?
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

export function LoginPageClient() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
    >
      <LoginForm />
    </Suspense>
  );
}
