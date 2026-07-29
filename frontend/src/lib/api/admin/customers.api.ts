import { apiData } from "@/lib/api/client";
import type {
  AdminCustomerDetailResult,
  AdminCustomersListResult,
  AdminCustomerOrdersResult,
  OrderStatus,
} from "@/lib/api/types";
import { toQuery } from "@/lib/api/types";

export type AdminCustomersQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export type AdminCustomerOrdersQuery = {
  page?: number;
  limit?: number;
  status?: OrderStatus;
};

export async function listAdminCustomers(
  params?: AdminCustomersQuery,
): Promise<AdminCustomersListResult> {
  return apiData<AdminCustomersListResult>(
    `/api/admin/customers${toQuery(params)}`,
  );
}

export async function getAdminCustomer(
  customerId: string,
): Promise<AdminCustomerDetailResult> {
  return apiData<AdminCustomerDetailResult>(
    `/api/admin/customers/${customerId}`,
  );
}

export async function getAdminCustomerOrders(
  customerId: string,
  params?: AdminCustomerOrdersQuery,
): Promise<AdminCustomerOrdersResult> {
  return apiData<AdminCustomerOrdersResult>(
    `/api/admin/customers/${customerId}/orders${toQuery(params)}`,
  );
}
