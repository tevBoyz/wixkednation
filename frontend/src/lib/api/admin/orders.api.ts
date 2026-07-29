import { apiData } from "@/lib/api/client";
import type {
  AdminOrder,
  AdminOrdersListResult,
  AdminOrderStatusUpdateResult,
  OrderStatus,
} from "@/lib/api/types";
import { toQuery } from "@/lib/api/types";

export type AdminOrdersQuery = {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function listAdminOrders(
  params?: AdminOrdersQuery,
): Promise<AdminOrdersListResult> {
  return apiData<AdminOrdersListResult>(`/api/admin/orders${toQuery(params)}`);
}

export async function getAdminOrder(orderId: string): Promise<AdminOrder> {
  const data = await apiData<{ order: AdminOrder }>(
    `/api/admin/orders/${orderId}`,
  );
  return data.order;
}

export async function updateAdminOrderStatus(
  orderId: string,
  body: { status: OrderStatus; note?: string },
): Promise<AdminOrderStatusUpdateResult> {
  return apiData<AdminOrderStatusUpdateResult>(
    `/api/admin/orders/${orderId}/status`,
    {
      method: "PATCH",
      body,
    },
  );
}
