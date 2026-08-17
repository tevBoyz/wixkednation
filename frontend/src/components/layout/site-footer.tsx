"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { GasNationLogo } from "@/components/brand/gasnation-logo";
import { Container } from "@/components/layout/container";
import { useAuth } from "@/components/providers/auth-provider";

export function SiteFooter() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  async function onLogout() {
    await logout();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <Container className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <GasNationLogo asLink variant="mark" size="md" markClassName="size-12" />
          <p className="mt-2 text-sm text-muted-foreground">
            Premium cannabis delivery across Northern Virginia and Washington,
            DC. 21+ only.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-4 text-sm">
            <li>
              <Link
                href="/products"
                className="text-muted-foreground hover:text-foreground"
              >
                Menu
              </Link>
            </li>
            <li>
              <Link
                href="/delivery"
                className="text-muted-foreground hover:text-foreground"
              >
                Delivery areas
              </Link>
            </li>
            <li>
              <Link
                href="/delivery/virginia"
                className="text-muted-foreground hover:text-foreground"
              >
                Virginia delivery
              </Link>
            </li>
            <li>
              <Link
                href="/delivery/northern-virginia"
                className="text-muted-foreground hover:text-foreground"
              >
                NoVA delivery
              </Link>
            </li>
            <li>
              <Link
                href="/delivery/washington-dc"
                className="text-muted-foreground hover:text-foreground"
              >
                DC weed delivery
              </Link>
            </li>
            <li>
              <Link
                href="/categories"
                className="text-muted-foreground hover:text-foreground"
              >
                Categories
              </Link>
            </li>
            <li>
              <Link
                href="/faqs"
                className="text-muted-foreground hover:text-foreground"
              >
                FAQ
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="text-muted-foreground hover:text-foreground"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/cart"
                className="text-muted-foreground hover:text-foreground"
              >
                Cart
              </Link>
            </li>
            <li>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => void onLogout()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Log out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Sign in
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
