import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { buildBreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "About the House | Wixked Nation",
  description:
    "Wixked Nation (wixkednation.com) is an Ohio weed delivery service. Same-day online orders, flat $20, cash on delivery, 21+ with ID.",
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
        <section className="wn-page-head">
          <div className="relative z-[1] max-w-3xl">
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              About the house
            </h1>
          </div>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,1.1fr)] lg:items-start lg:gap-10">
          <section className="min-w-0 space-y-6">
            <div className="wn-plate p-6 sm:p-7">
              <div className="space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                <p>
                  Welcome to Wixked Nation. We make it easy to get premium flower
                  and related cannabis products delivered with the same ease as
                  ordering a pizza. From Columbus, Cleveland, and Cincinnati to
                  Toledo, Akron, and Dayton, we bring quality product to your
                  door with clear communication and discreet delivery.
                </p>
                <p>
                  Find us at wixkednation.com. Wixked Nation weed delivery for
                  Ohio. Same-day drop-off 10 AM-10 PM. 21+ with valid ID. No
                  medical card required.
                </p>
                <p>
                  We are focused on cannabis only. That is our lane. You will
                  not find mushrooms or psychedelic products in our menu.
                </p>
              </div>
            </div>

            <div className="wn-plate p-6 sm:p-7">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Where we deliver
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Same-day delivery to every incorporated city in Ohio. Check the
                full list of cities we serve.
              </p>
              <Button
                className="mt-4"
                render={<Link href="/delivery" />}
                nativeButton={false}
              >
                View delivery areas
              </Button>
            </div>

            <div className="wn-plate p-5 sm:p-6">
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Need to reach us? Use Call or Text from the site banner, or leave
                a note at checkout. We look forward to hearing from you.
              </p>
            </div>
          </section>

          <aside className="min-w-0 lg:sticky lg:top-28">
            <section className="wn-stage p-6 sm:p-8">
              <div className="relative z-[1]">
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Premium cannabis lifestyle
                </h2>
                <div className="mt-5 space-y-4 text-base leading-relaxed text-foreground/80 sm:text-lg">
                  <p>
                    Wixked Nation is built around a premium cannabis lifestyle:
                    a clear menu, same-day delivery, and discreet drop-off for
                    adults 21 and older across Ohio.
                  </p>
                  <p className="border-l-4 border-primary/50 pl-4 font-medium text-foreground">
                    Flower, edibles, vapes, and concentrates. Cannabis only.
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
            className="text-center text-2xl font-semibold tracking-tight text-foreground"
          >
            Hours &amp; basics
          </h2>
          <ul className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {BASICS.map((item) => (
              <li
                key={item.label}
                className="wn-plate flex flex-col border-0 px-5 py-5 sm:px-6 sm:py-6"
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
