"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  pickNotifications,
} from "@/lib/api/notifications.api";

export const notificationsUnreadQueryKey = ["notifications", "unread"] as const;

export function notificationsInboxQueryKey(page: number) {
  return ["notifications", "inbox", page] as const;
}

const POLL_MS = 25_000;

function pollIntervalMs(): number | false {
  if (typeof document === "undefined" || document.hidden) {
    return false;
  }
  return POLL_MS;
}

/** Poll unread count + recent unread items for header badge (Stage 30). */
export function useNotificationPolling() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: notificationsUnreadQueryKey,
    queryFn: () => getNotifications({ isRead: false, limit: 20 }),
    enabled: isAuthenticated,
    staleTime: 10_000,
    refetchInterval: pollIntervalMs,
    refetchOnWindowFocus: true,
  });
}

export function useNotificationsInbox(page: number) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: notificationsInboxQueryKey(page),
    queryFn: () => getNotifications({ page, limit: 20 }),
    enabled: isAuthenticated,
    select: (payload) => ({
      notifications: pickNotifications(payload),
      unreadCount: payload.unreadCount ?? 0,
      pagination: payload.pagination ?? {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    }),
  });
}

export function useNotificationMutations() {
  const queryClient = useQueryClient();

  async function invalidateNotifications() {
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  const markRead = useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationRead(notificationId),
    onSuccess: invalidateNotifications,
  });

  const markAllRead = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: invalidateNotifications,
  });

  return { markRead, markAllRead };
}
