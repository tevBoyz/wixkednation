import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import type { FaqItem } from "@/content/faqs";
import { getSeoLocation, PRODUCT_SEO_LINKS } from "@/content/seo-locations";
import {
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildLocalBusinessJsonLd,
} from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

const PATH = "/learn/how-delivery-works";

export const metadata: Metadata = buildPageMetadata({
  title: "How Same-Day Weed Delivery Works in NoVA & DC | Gas Nation",
  description:
    "Order online 10 AM–10 PM, flat $20 delivery, cash on delivery, 21+ ID, no medical card. See exactly how Gas Nation delivery works in Northern Virginia and DC — then shop the menu.",
  path: PATH,
});

const QUICK_FACTS = [
  { label: "Hours", value: "10 AM – 10 PM, seven days" },
  { label: "Delivery fee", value: "Flat $20 on every order" },
  { label: "Payment", value: "Cash on delivery" },
  { label: "ID", value: "21+ government ID, no medical card" },
] as const;

const ORDER_STEPS = [
  {
    title: "Browse the menu",
    body: (
      <>
        Start with the{" "}
        <Link
          href="/products"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          full menu
        </Link>{" "}
        or narrow things down by{" "}
        <Link
          href="/categories"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          category
        </Link>{" "}
        — flower, pre-rolls, edibles, vapes, and concentrates. Stock moves as
        drops land, so what you see is what we have today.
      </>
    ),
  },
  {
    title: "Add to cart and check out",
    body: (
      <>
        Guest checkout works — no account needed. Signing in saves your
        addresses so reorders take seconds. Review your{" "}
        <Link
          href="/cart"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          cart
        </Link>
        , enter your delivery address, and confirm. Your total is the product
        subtotal plus the flat $20 delivery fee.
      </>
    ),
  },
  {
    title: "We confirm the order",
    body: "Your order lands with our team and moves to Confirmed. You get text updates as it progresses, so you are not guessing about timing.",
  },
  {
    title: "A driver heads your way",
    body: "Deliveries run same-day while we are open. Plain car, plain clothes, no branding — your neighbors see a normal visitor, not a dispensary run.",
  },
  {
    title: "Pay cash and show ID at the door",
    body: (
      <>
        Meet the driver in person, show a valid 21+ ID, and pay in cash. The
        person who placed the order has to be the one receiving it — more detail
        in the{" "}
        <Link
          href="/faqs"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          delivery FAQ
        </Link>
        .
      </>
    ),
  },
] as const;

const PREP_ITEMS = [
  "A valid 21+ government ID — driver's license, state ID, or passport. No exceptions, no medical card required.",
  "Cash for your order plus the $20 delivery fee. Tips are cash too, and always appreciated.",
  "You, in person, at the address. Friends and family cannot accept an order on your behalf.",
  "An address inside our service area. Homes, hotels, and temporary stays all work.",
] as const;

const FEATURED_AREA_SLUGS = [
  "northern-virginia",
  "washington-dc",
  "arlington",
  "alexandria",
  "fairfax",
  "mclean",
  "reston",
  "vienna",
] as const;

const LEARN_FAQS: FaqItem[] = [
  {
    question: "Do I need a medical card to order?",
    answer:
      "No. Gas Nation delivery in Northern Virginia and Washington, DC is for adults 21+ with a valid government ID. A medical card is not required.",
  },
  {
    question: "What ID do you accept at the door?",
    answer:
      "A valid government ID proving you are over 21 — a driver's license, state-issued ID, or passport. Our ID policy is strict and there are no exceptions.",
  },
  {
    question: "Is payment really cash only?",
    answer:
      "Yes. Gas Nation is cash only. Pay the driver when your order arrives. Every order includes a flat $20 delivery fee, and free delivery applies only when you redeem a free-delivery coupon issued by Gas Nation.",
  },
  {
    question: "Do I have to be there to receive the order?",
    answer:
      "Yes. You must be present with a valid ID to receive your delivery. Friends or family members cannot accept an order for you.",
  },
  {
    question: "Is the delivery discreet?",
    answer:
      "Yes. Delivery is always discreet — plain cars and plain clothes. Add special delivery notes at checkout if you need them.",
  },
  {
    question: "How much can I order at once?",
    answer:
      "Customers may order up to 8 ounces of dry flower in any 30-day rolling period.",
  },
];

const NEXT_LINKS = [
  {
    href: "/delivery",
    title: "Delivery areas",
    description:
      "Check every city and neighborhood we cover across NoVA and DC.",
  },
  {
    href: "/faqs",
    title: "Delivery FAQ",
    description: "ID rules, fees, hours, tipping, returns, and visitor orders.",
  },
  {
    href: "/categories",
    title: "Shop by category",
    description: "Flower, edibles, vapes, and concentrates in one place.",
  },
  {
    href: "/blog",
    title: "Guides and updates",
    description: "Strain notes, new arrivals, and how-to reads from our team.",
  },
] as const;

export default function HowDeliveryWorksPage() {
  const areas = FEATURED_AREA_SLUGS.map((slug) => getSeoLocation(slug)).filter(
    (location): location is NonNullable<typeof location> => Boolean(location),
  );

  return (
    <main className="min-w-0 overflow-x-clip">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "How delivery works", path: PATH },
        ])}
      />
      <JsonLd data={buildFaqPageJsonLd(LEARN_FAQS)} />
      <JsonLd data={buildLocalBusinessJsonLd()} />

      <Container className="min-w-0 py-10 sm:py-14">
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span aria-hidden> / </span>
          <span className="text-foreground">How delivery works</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <p className="text-sm font-medium text-primary">
            Guide · Same-day delivery
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            How same-day weed delivery works with Gas Nation
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Order from our online menu, meet the driver at your door, and pay in
            cash. This is exactly what happens from tap to doorstep across
            Northern Virginia and Washington, DC — hours, ID rules, the flat $20
            delivery fee, and how we keep it discreet.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button render={<Link href="/products" />} nativeButton={false}>
              Shop the menu
            </Button>
            <Button
              render={<Link href="/delivery" />}
              nativeButton={false}
              variant="outline"
            >
              See delivery areas
            </Button>
          </div>
        </header>

        <dl className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_FACTS.map((fact) => (
            <div
              key={fact.label}
              className="rounded-lg border border-border bg-card/50 px-4 py-3"
            >
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {fact.label}
              </dt>
              <dd className="mt-1 text-sm font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-14 max-w-3xl" aria-labelledby="steps-heading">
          <h2
            id="steps-heading"
            className="text-xl font-semibold tracking-tight sm:text-2xl"
          >
            The order, step by step
          </h2>
          <ol className="mt-6 space-y-6">
            {ORDER_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden
                  className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14 max-w-3xl" aria-labelledby="prep-heading">
          <h2
            id="prep-heading"
            className="text-xl font-semibold tracking-tight sm:text-2xl"
          >
            What to have ready
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Four things keep a delivery smooth. Miss one and the driver cannot
            complete the drop.
          </p>
          <ul className="mt-6 space-y-3">
            {PREP_ITEMS.map((item) => (
              <li key={item} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                />
                <span className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {item}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            Every rule in one place:{" "}
            <Link
              href="/faqs"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              read the delivery FAQ
            </Link>
            .
          </p>
        </section>

        <section className="mt-14 max-w-3xl" aria-labelledby="fees-heading">
          <h2
            id="fees-heading"
            className="text-xl font-semibold tracking-tight sm:text-2xl"
          >
            Fees, hours, and timing
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Delivery is a flat $20 on every order, no matter which city you are
            in. We do not hide it in product prices, and we do not scale it by
            distance. The only way it comes off is a free-delivery coupon issued
            by us — there is no automatic free first order.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            We run 10 AM to 10 PM, seven days a week, and deliveries are
            same-day while we are open. Evenings are our busiest stretch, so
            ordering earlier in the night usually means a tighter window. Tips
            are cash and genuinely encouraged — think of it like tipping a
            server.
          </p>
        </section>

        <section className="mt-14 max-w-3xl" aria-labelledby="discreet-heading">
          <h2
            id="discreet-heading"
            className="text-xl font-semibold tracking-tight sm:text-2xl"
          >
            Discreet by default
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Plain cars, plain clothes, no logos, no signage. Drivers are not
            advertising what they are carrying, and they are used to apartment
            buildings, gated communities, offices, and hotels.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            If you need something specific — a gate code, a text instead of a
            knock, meeting in the lobby — add it as a delivery note at checkout
            and the driver will follow it.
          </p>
          <Button
            className="mt-6"
            render={<Link href="/products" />}
            nativeButton={false}
          >
            Start an order
          </Button>
        </section>

        <section className="mt-14 max-w-3xl" aria-labelledby="areas-heading">
          <h2
            id="areas-heading"
            className="text-xl font-semibold tracking-tight sm:text-2xl"
          >
            Where we deliver
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Same-day coverage across Northern Virginia and into Washington, DC.
            If your city is nearby but not listed, ask — we probably cover it.
          </p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {areas.map((location) => (
              <li key={location.slug}>
                <Link
                  href={`/delivery/${location.slug}`}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Weed delivery in {location.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            <Link
              href="/delivery"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              See every delivery area
            </Link>
          </p>
        </section>

        <section className="mt-14 max-w-3xl" aria-labelledby="order-heading">
          <h2
            id="order-heading"
            className="text-xl font-semibold tracking-tight sm:text-2xl"
          >
            What you can order
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Premium flower by strain type, pre-rolls, edibles, vape carts,
            disposables, and concentrates like live resin and rosin.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {PRODUCT_SEO_LINKS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-medium hover:border-primary/40 hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 max-w-3xl" aria-labelledby="reorder-heading">
          <h2
            id="reorder-heading"
            className="text-xl font-semibold tracking-tight sm:text-2xl"
          >
            Ordered with us before?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Nothing changes on a reorder — same hours, same flat $20, same ID
            check at the door. The menu is what moves, so it is worth a look
            before you repeat your last order.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button render={<Link href="/products" />} nativeButton={false}>
              See what is in stock
            </Button>
            <Button
              render={<Link href="/cart" />}
              nativeButton={false}
              variant="outline"
            >
              Go to cart
            </Button>
          </div>
        </section>

        <section className="mt-14 max-w-3xl" aria-labelledby="faq-heading">
          <h2
            id="faq-heading"
            className="text-xl font-semibold tracking-tight sm:text-2xl"
          >
            Common questions
          </h2>
          <dl className="mt-6 space-y-6">
            {LEARN_FAQS.map((faq) => (
              <div key={faq.question}>
                <dt className="font-medium">{faq.question}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-muted-foreground">
            More answers in the{" "}
            <Link
              href="/faqs"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              full delivery FAQ
            </Link>
            .
          </p>
        </section>

        <section className="mt-14" aria-labelledby="next-heading">
          <h2
            id="next-heading"
            className="text-xl font-semibold tracking-tight sm:text-2xl"
          >
            Keep exploring
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {NEXT_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex h-full flex-col rounded-lg border border-border bg-card/50 p-4 transition-colors hover:border-primary/40"
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 max-w-3xl rounded-lg border border-border bg-card/50 p-6">
          <h2 className="text-lg font-semibold tracking-tight">
            Ready to order?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse the menu, check out in a couple of minutes, and have cash and
            your ID ready at the door.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button render={<Link href="/products" />} nativeButton={false}>
              Shop the menu
            </Button>
            <Button
              render={<Link href="/faqs" />}
              nativeButton={false}
              variant="outline"
            >
              Delivery FAQ
            </Button>
          </div>
        </section>
      </Container>
    </main>
  );
}
