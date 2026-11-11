import { apiData } from "@/lib/api/client";
import type { MyOrdersResult, Order, OrderStatus } from "@/lib/api/types";
import { toQuery } from "@/lib/api/types";

export async function createOrder(body: {
  addressId: string;
  paymentMethod?: "COD";
  couponCode?: string;
}) {
  const data = await apiData<{ order: Order }>("/api/orders", {
    method: "POST",
    body: { paymentMethod: "COD", ...body },
  });
  return data.order;
}

export type GuestOrderCustomer = {
  id?: string;
  phone?: string;
  isNewUser?: boolean;
  matchedExistingAccount?: boolean;
  hasPin?: boolean;
  postOrderCta?: "register" | "login";
};

export type CreateGuestOrderResult = {
  order: Order;
  customer: GuestOrderCustomer;
};

export type GuestOrderAddressBody = {
  fullName: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country?: string;
  label?: string | null;
};

export async function createGuestOrder(body: {
  phone: string;
  name?: string;
  paymentMethod?: "COD";
  couponCode?: string;
  items: Array<{ productId: string; skuId: string; quantity: number }>;
  address: GuestOrderAddressBody;
}) {
  return apiData<CreateGuestOrderResult>("/api/orders/guest", {
    method: "POST",
    auth: false,
    body: { paymentMethod: "COD", ...body },
  });
}

export async function listMyOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return apiData<MyOrdersResult>(`/api/orders/me${toQuery(params)}`);
}

export async function getMyOrder(orderId: string) {
  const data = await apiData<{ order: Order }>(`/api/orders/me/${orderId}`);
  return data.order;
}

export type CancelOrderResult = {
  cancelledFromStatus: OrderStatus;
  order: Order;
};

export async function cancelMyOrder(
  orderId: string,
  body: {
    cancelledFromStatus: Extract<
      OrderStatus,
      "Pending" | "Confirmed" | "OutForDelivery"
    >;
    note?: string;
  },
) {
  return apiData<CancelOrderResult>(`/api/orders/${orderId}/cancel`, {
    method: "POST",
    body,
  });
}
