"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { GasNationLogo } from "@/components/brand/gasnation-logo";
import { Container } from "@/components/layout/container";
import { useAuth } from "@/components/providers/auth-provider";
import { SITE_NAME } from "@/config/brand";

const linkClassName =
  "text-sm text-muted-foreground transition-colors hover:text-foreground";

const FOOTER_GROUPS = [
  {
    title: "Shop",
    links: [
      { href: "/products", label: "Menu" },
      { href: "/categories", label: "Categories" },
      { href: "/cart", label: "Cart" },
    ],
  },
  {
    title: "Delivery",
    links: [
      { href: "/delivery", label: "Delivery areas" },
      { href: "/delivery/virginia", label: "Virginia delivery" },
      { href: "/delivery/northern-virginia", label: "North Virginia delivery" },
      { href: "/delivery/washington-dc", label: "DC weed delivery" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/learn", label: "Guides" },
      { href: "/blog", label: "Blog" },
      { href: "/faqs", label: "FAQ" },
      { href: "/about", label: "About" },
    ],
  },
] as const;

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
      <Container className="py-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="col-span-2 max-w-sm lg:col-span-1">
            <GasNationLogo asLink variant="mark" size="md" markClassName="size-12" />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Premium cannabis delivery across north Virginia, Northern Virginia,
              and Washington, DC. 21+ only.
            </p>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {group.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClassName}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                {group.title === "Shop" ? (
                  <li>
                    {isAuthenticated ? (
                      <button
                        type="button"
                        onClick={() => void onLogout()}
                        className={linkClassName}
                      >
                        Log out
                      </button>
                    ) : (
                      <Link href="/login" className={linkClassName}>
                        Sign in
                      </Link>
                    )}
                  </li>
                ) : null}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {SITE_NAME}. Adults 21+ only.
        </div>
      </Container>
    </footer>
  );
}
