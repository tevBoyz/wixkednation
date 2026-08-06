import { apiData, apiRequest, type ApiEnvelope } from "@/lib/api/client";
import type { Address } from "@/lib/api/types";

export type AddressBody = {
  label?: string | null;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
};

export async function listAddresses(): Promise<Address[]> {
  const data = await apiData<{ addresses?: Address[] } | Address[]>(
    "/api/users/me/addresses",
  );
  if (Array.isArray(data)) {
    return data;
  }
  return data.addresses ?? [];
}

export async function createAddress(body: AddressBody) {
  const data = await apiData<{ address: Address }>("/api/users/me/addresses", {
    method: "POST",
    body,
  });
  return data.address;
}

export async function updateAddress(
  addressId: string,
  body: Partial<AddressBody>,
) {
  const data = await apiData<{ address: Address }>(
    `/api/users/me/addresses/${addressId}`,
    {
      method: "PATCH",
      body,
    },
  );
  return data.address;
}

export async function deleteAddress(addressId: string) {
  return apiRequest<ApiEnvelope<unknown>>(
    `/api/users/me/addresses/${addressId}`,
    { method: "DELETE" },
  );
}
