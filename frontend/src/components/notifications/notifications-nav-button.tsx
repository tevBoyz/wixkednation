"use client";

import Link from "next/link";
import { BellIcon } from "lucide-react";

import { useNotificationPolling } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";

export function NotificationsNavButton() {
  const { data } = useNotificationPolling();
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <Button
      render={<Link href="/account/notifications" />}
      nativeButton={false}
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
    >
      <BellIcon className="size-4" />
      {unreadCount > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Button>
  );
}
