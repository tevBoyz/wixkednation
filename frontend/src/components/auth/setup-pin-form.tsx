"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState, useSyncExternalStore } from "react";
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
import { setPin } from "@/lib/api/auth.api";
import { getErrorMessage } from "@/lib/api/errors";
import { pinConfirmSchema } from "@/lib/auth/pin";
import { clearAuthRedirect, POST_AUTH_HOME } from "@/lib/auth/redirect";
import {
  clearSetupToken,
  getSetupToken,
} from "@/lib/auth/setup-token-storage";

type SetupPinFormValues = z.infer<typeof pinConfirmSchema>;

function subscribeSetupToken() {
  return () => {};
}

function SetupPinForm() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const hasToken = useSyncExternalStore(
    subscribeSetupToken,
    () => Boolean(getSetupToken()),
    () => false,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupPinFormValues>({
    resolver: zodResolver(pinConfirmSchema),
    defaultValues: { pin: "", confirmPin: "" },
  });

  async function onSubmit(values: SetupPinFormValues) {
    const setupToken = getSetupToken();
    if (!setupToken) {
      toast.error("Your setup session expired. Start again.");
      router.replace("/login");
      return;
    }

    setSubmitting(true);
    try {
      const result = await setPin(setupToken, {
        pin: values.pin,
        confirmPin: values.confirmPin,
      });
      clearSetupToken();
      setSession({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      toast.success("PIN saved. You are signed in.");
      clearAuthRedirect();
      router.replace(POST_AUTH_HOME);
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save PIN"));
      setSubmitting(false);
    }
  }

  if (!hasToken) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup session expired</CardTitle>
          <CardDescription>
            Verify your phone or Google account again, then set a PIN within 15
            minutes.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-wrap gap-2">
          <Button render={<Link href="/register" />} nativeButton={false}>
            Create account
          </Button>
          <Button
            render={<Link href="/forgot-pin" />}
            nativeButton={false}
            variant="outline"
          >
            Forgot PIN
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set your PIN</CardTitle>
        <CardDescription>
          Choose a numeric PIN (4-6 digits). You will use it to sign in next
          time.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              placeholder="4-6 digits"
              maxLength={6}
              aria-invalid={Boolean(errors.pin)}
              disabled={submitting}
              className="tracking-widest"
              {...register("pin")}
            />
            {errors.pin ? (
              <p className="text-sm text-destructive">{errors.pin.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirm PIN</Label>
            <Input
              id="confirmPin"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              placeholder="Repeat PIN"
              maxLength={6}
              aria-invalid={Boolean(errors.confirmPin)}
              disabled={submitting}
              className="tracking-widest"
              {...register("confirmPin")}
            />
            {errors.confirmPin ? (
              <p className="text-sm text-destructive">
                {errors.confirmPin.message}
              </p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving…" : "Save PIN and continue"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function SetupPinPageClient() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
    >
      <SetupPinForm />
    </Suspense>
  );
}
