import { OrderContactBanner } from "@/components/layout/order-contact-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { NavigationTrail } from "@/components/layout/navigation-trail";
import { SkipLink } from "@/components/layout/skip-link";
import { AnalyticsBeacon } from "@/components/analytics/analytics-beacon";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-clip bg-transparent lg:overflow-x-visible">
      <AnalyticsBeacon />
      <SkipLink />
      <NavigationTrail />
      <div className="sticky top-0 z-40">
        <SiteHeader />
        <OrderContactBanner />
      </div>
      <div
        id="main-content"
        tabIndex={-1}
        className="flex min-w-0 flex-1 flex-col outline-none"
      >
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
