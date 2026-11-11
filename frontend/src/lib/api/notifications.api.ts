import { apiData, apiRequest, type ApiEnvelope } from "@/lib/api/client";
import type { Notification, NotificationsPayload } from "@/lib/api/types";
import { toQuery } from "@/lib/api/types";

export async function getNotifications(params?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
}) {
  return apiData<NotificationsPayload>(
    `/api/notifications${toQuery({
      ...params,
      isRead:
        params?.isRead === undefined ? undefined : params.isRead ? "true" : "false",
    })}`,
  );
}

export async function markNotificationRead(notificationId: string) {
  return apiRequest<ApiEnvelope<unknown>>(
    `/api/notifications/${notificationId}/read`,
    { method: "PATCH" },
  );
}

export async function markAllNotificationsRead() {
  return apiRequest<ApiEnvelope<unknown>>("/api/notifications/read-all", {
    method: "PATCH",
  });
}

export function pickNotifications(
  payload: NotificationsPayload,
): Notification[] {
  return payload.notifications ?? payload.items ?? [];
}
