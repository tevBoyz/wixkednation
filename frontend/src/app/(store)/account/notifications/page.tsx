import { Suspense } from "react";

import { NotificationsListClient } from "@/components/notifications/notifications-list-client";

export default function AccountNotificationsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Notifications</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Order updates and account alerts.
        </p>
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading notifications…</p>
        }
      >
        <NotificationsListClient />
      </Suspense>
    </section>
  );
}
