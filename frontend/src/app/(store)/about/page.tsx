import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "About GasNation | Premium Cannabis Delivery",
  description:
    "Premium cannabis delivered across Northern Virginia and Washington, DC. Clear communication, discreet same-day delivery, and a curated online dispensary menu. 21+.",
  path: "/about",
});

const BASICS = [
  { label: "Delivery hours", value: "10 AM to 10 PM, seven days a week" },
  { label: "Age", value: "21+ with valid ID required at delivery" },
  { label: "Payment", value: "cash only" },
  { label: "Delivery fee", value: "$20 on every order" },
] as const;

export default function AboutPage() {
  return (
    <main className="min-w-0 overflow-x-clip">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <Container className="min-w-0 py-10 sm:py-14">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[color-mix(in_srgb,#148547_14%,transparent)] via-background to-background px-6 py-8 shadow-sm sm:px-8 sm:py-10">
          <div
            className="pointer-events-none absolute -top-16 right-0 size-40 rounded-full bg-[color-mix(in_srgb,#148547_12%,transparent)] blur-3xl"
            aria-hidden
          />
          <div className="relative max-w-3xl">
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              About GasNation
            </h1>
          </div>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,1.1fr)] lg:items-start lg:gap-10">
          <section className="min-w-0 space-y-6">
            <div className="rounded-2xl border border-border/70 bg-background/80 p-6 shadow-sm backdrop-blur-sm sm:p-7">
              <div className="space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                <p>
                  Welcome to GasNation. We make it easy to get premium flower
                  and related cannabis products delivered with the same ease as
                  ordering a pizza. From McLean, Reston, and Fairfax to
                  Arlington, Alexandria, and DC, we bring quality product to
                  your door with clear communication and discreet delivery.
                </p>
                <p>
                  We are focused on cannabis only. That is our lane. You will
                  not find mushrooms or psychedelic products in our menu.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 p-5 shadow-sm backdrop-blur-sm sm:p-6">
              <p className="text-sm font-medium tracking-wide text-primary uppercase">
                Contact
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Need to reach us? Use Call or Text from the site banner, or leave
                a note at checkout. We look forward to hearing from you.
              </p>
            </div>
          </section>

          <aside className="min-w-0 lg:sticky lg:top-28">
            <section className="relative overflow-hidden rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-[color-mix(in_srgb,#148547_16%,transparent)] via-[color-mix(in_srgb,#148547_8%,transparent)] to-background p-6 shadow-md sm:p-8">
              <div
                className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-primary/10 blur-2xl"
                aria-hidden
              />
              <div className="relative">
                <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                  Did you know?
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Why &ldquo;Gas&rdquo;?
                </h2>
                <div className="mt-5 space-y-4 text-base leading-relaxed text-foreground/80 sm:text-lg">
                  <p>
                    In cannabis culture, &ldquo;gas&rdquo; is slang for very
                    high-quality, potent cannabis, especially flower with a
                    strong, pungent aroma. The term comes from the strong,
                    fuel-like smell that some cannabis strains have, similar to
                    gasoline or diesel. Strains descended from varieties like
                    Sour Diesel, Chemdawg, or OG Kush are often associated with
                    that &ldquo;gassy&rdquo; aroma.
                  </p>
                  <p className="border-l-4 border-primary/50 pl-4 font-medium text-foreground">
                    That is the standard we aim for: product that lives up to the
                    name GasNation.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <section
          className="mt-10 border-t border-border pt-10"
          aria-labelledby="basics-heading"
        >
          <h2
            id="basics-heading"
            className="text-center text-sm font-medium tracking-wide text-muted-foreground uppercase"
          >
            Hours &amp; basics
          </h2>
          <ul className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {BASICS.map((item) => (
              <li
                key={item.label}
                className="flex flex-col bg-background px-5 py-5 sm:px-6 sm:py-6"
              >
                <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                  {item.label}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground sm:text-base">
                  {item.value}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </main>
  );
}
