import { apiData } from "@/lib/api/client";
import { toQuery } from "@/lib/api/types";
import type { OrderStatus } from "@/lib/api/types";

export type SmsDashboardStatus = {
  activeProvider: "mock" | "twilio" | string;
  twilio: {
    configured: boolean;
    reachable: boolean | null;
    accountStatus: string | null;
    error: string | null;
  };
};

export type DashboardStats = {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  outForDeliveryOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalProducts: number;
  visibleProducts: number;
  hiddenProducts: number;
  totalCustomers: number;
  sms?: SmsDashboardStatus;
};

export type AdminDashboardOrder = {
  id: string;
  orderNumber?: string;
  status: OrderStatus;
  totalAmount?: number | string;
  createdAt?: string;
  user?: {
    id?: string;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  };
};

export type AdminRecentOrdersResult = {
  orders: AdminDashboardOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function getDashboardStats() {
  const data = await apiData<{ stats: DashboardStats }>(
    "/api/admin/dashboard/stats",
  );
  return data.stats;
}

export async function getRecentOrders(params?: { limit?: number }) {
  return apiData<AdminRecentOrdersResult>(
    `/api/admin/dashboard/recent-orders${toQuery(params)}`,
  );
}
