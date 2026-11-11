"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  notificationsUnreadQueryKey,
  useNotificationMutations,
  useNotificationsInbox,
} from "@/hooks/use-notifications";
import { useAuthConfig } from "@/hooks/use-auth-config";
import { getErrorMessage } from "@/lib/api/errors";
import type { Notification } from "@/lib/api/types";

function formatNotificationDate(value?: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return format(date, "MMM d, yyyy · h:mm a");
}

function isDeliveredOrderNotification(notification: Notification): boolean {
  if (notification.type && notification.type !== "order_status") {
    return false;
  }
  const message = (notification.message || "").toLowerCase();
  return message.includes("is now delivered");
}

function NotificationRow({
  notification,
  onOpen,
  googleReviewUrl,
}: {
  notification: Notification;
  onOpen: (id: string) => void;
  googleReviewUrl?: string | null;
}) {
  const showReview =
    Boolean(googleReviewUrl) && isDeliveredOrderNotification(notification);

  const body = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">{notification.title || "Notification"}</p>
        {!notification.isRead ? <Badge variant="outline">Unread</Badge> : null}
      </div>
      {notification.message ? (
        <p className="text-sm text-muted-foreground">{notification.message}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {formatNotificationDate(notification.createdAt)}
      </p>
    </>
  );

  const rowClassName = `flex flex-col gap-3 rounded-lg border p-4 ${
    notification.isRead
      ? "border-border bg-background"
      : "border-primary/30 bg-accent/40"
  }`;

  return (
    <li className={rowClassName}>
      <div className="min-w-0 flex-1">
        {notification.orderId ? (
          <Link
            href={`/account/orders/${notification.orderId}`}
            className="block space-y-1 rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              if (!notification.isRead) {
                onOpen(notification.id);
              }
            }}
          >
            {body}
          </Link>
        ) : (
          <button
            type="button"
            className="block w-full space-y-1 rounded-sm text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              if (!notification.isRead) {
                onOpen(notification.id);
              }
            }}
          >
            {body}
          </button>
        )}
      </div>
      {showReview && googleReviewUrl ? (
        <div className="flex flex-wrap gap-2">
          <Button
            render={
              <a
                href={googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            nativeButton={false}
            size="sm"
            className="w-fit"
            onClick={() => {
              if (!notification.isRead) {
                onOpen(notification.id);
              }
            }}
          >
            Leave a Google review
          </Button>
        </div>
      ) : null}
    </li>
  );
}

export function NotificationsListClient() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const autoMarkedIds = useRef(new Set<string>());
  const { data: authConfig } = useAuthConfig();

  const { data, isLoading, isError, error, refetch } = useNotificationsInbox(page);
  const { markRead, markAllRead } = useNotificationMutations();

  useEffect(() => {
    void queryClient.invalidateQueries({
      queryKey: notificationsUnreadQueryKey,
    });
  }, [queryClient]);

  const handleOpenNotification = useCallback(
    (notificationId: string) => {
      if (autoMarkedIds.current.has(notificationId)) {
        return;
      }
      autoMarkedIds.current.add(notificationId);
      markRead.mutate(notificationId);
    },
    [markRead],
  );

  async function onMarkAllRead() {
    try {
      await markAllRead.mutateAsync();
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not mark all as read"));
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading notifications…</p>;
  }

  if (isError || !data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">
          {getErrorMessage(error, "Could not load notifications")}
        </p>
        <Button type="button" variant="outline" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const { notifications, unreadCount, pagination } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {unreadCount === 0
            ? "No unread notifications"
            : `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
        </p>
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={markAllRead.isPending}
            onClick={() => void onMarkAllRead()}
          >
            {markAllRead.isPending ? "Marking…" : "Mark all read"}
          </Button>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onOpen={handleOpenNotification}
              googleReviewUrl={authConfig?.googleReviewUrl}
            />
          ))}
        </ul>
      )}

      {pagination.totalPages > 1 ? (
        <nav
          className="flex flex-wrap items-center justify-between gap-3"
          aria-label="Notifications pagination"
        >
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              render={
                <Link
                  href={
                    pagination.page > 1
                      ? `/account/notifications?page=${pagination.page - 1}`
                      : "/account/notifications"
                  }
                  aria-disabled={pagination.page <= 1}
                  tabIndex={pagination.page <= 1 ? -1 : undefined}
                />
              }
              nativeButton={false}
              variant="outline"
              disabled={pagination.page <= 1}
              className={
                pagination.page <= 1 ? "pointer-events-none opacity-50" : undefined
              }
            >
              Previous
            </Button>
            <Button
              render={
                <Link
                  href={`/account/notifications?page=${pagination.page + 1}`}
                  aria-disabled={pagination.page >= pagination.totalPages}
                  tabIndex={
                    pagination.page >= pagination.totalPages ? -1 : undefined
                  }
                />
              }
              nativeButton={false}
              variant="outline"
              disabled={pagination.page >= pagination.totalPages}
              className={
                pagination.page >= pagination.totalPages
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
            >
              Next
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
