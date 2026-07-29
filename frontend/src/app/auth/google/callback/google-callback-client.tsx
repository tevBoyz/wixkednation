"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  exchangeAuthCode,
  isAuthTokensPayload,
  isPinSetupPayload,
} from "@/lib/api/auth.api";
import { getErrorMessage } from "@/lib/api/errors";
import { clearAuthRedirect, POST_AUTH_HOME } from "@/lib/auth/redirect";
import { setSetupToken } from "@/lib/auth/setup-token-storage";
import { cn } from "@/lib/utils";

const HANDLED_KEY = "google_oauth_code_handled";

function GoogleCallbackInner() {
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const ranRef = useRef(false);

  const [status, setStatus] = useState<"working" | "error">("working");
  const [message, setMessage] = useState("Finishing Google sign-in…");

  useEffect(() => {
    if (ranRef.current) {
      return;
    }
    ranRef.current = true;

    const error = searchParams.get("error");
    const code = searchParams.get("code");
    clearAuthRedirect();

    async function finish() {
      if (error) {
        setStatus("error");
        setMessage(
          error === "access_denied"
            ? "Google sign-in was cancelled."
            : error,
        );
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("Missing Google handoff code. Please try signing in again.");
        return;
      }

      // Prevent React Strict Mode / remount from exchanging a single-use code twice
      try {
        const already = sessionStorage.getItem(HANDLED_KEY);
        if (already === code) {
          window.location.replace(POST_AUTH_HOME);
          return;
        }
        sessionStorage.setItem(HANDLED_KEY, code);
      } catch {
        // ignore storage failures
      }

      try {
        const result = await exchangeAuthCode(code);

        try {
          sessionStorage.removeItem(HANDLED_KEY);
        } catch {
          // ignore
        }

        if (isPinSetupPayload(result)) {
          setSetupToken(result.setupToken);
          clearAuthRedirect();
          window.location.replace("/setup-pin");
          return;
        }

        if (isAuthTokensPayload(result)) {
          setSession({
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          });
          window.location.replace(POST_AUTH_HOME);
          return;
        }

        setStatus("error");
        setMessage("Unexpected response from Google sign-in.");
      } catch (err) {
        try {
          sessionStorage.removeItem(HANDLED_KEY);
        } catch {
          // ignore
        }
        setStatus("error");
        setMessage(getErrorMessage(err, "Could not complete Google sign-in"));
      }
    }

    void finish();
  }, [searchParams, setSession]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Google sign-in</CardTitle>
        <CardDescription>
          {status === "working"
            ? "Exchanging a one-time code for your session. Tokens are never placed in the URL."
            : "Something went wrong"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
      {status === "error" ? (
        <CardFooter className="relative z-10 flex flex-wrap gap-2">
          <Link href="/login" className={cn(buttonVariants())}>
            Back to sign in
          </Link>
          <Link
            href="/register"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Create account
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            Home
          </Link>
        </CardFooter>
      ) : null}
    </Card>
  );
}

export function GoogleCallbackClient() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
    >
      <GoogleCallbackInner />
    </Suspense>
  );
}
