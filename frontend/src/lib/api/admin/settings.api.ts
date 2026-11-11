import { apiData } from "@/lib/api/client";
import type { AdminSettings } from "@/lib/api/types";

export async function getAdminSettings(): Promise<AdminSettings> {
  const data = await apiData<{ settings: AdminSettings }>("/api/admin/settings");
  return data.settings;
}

export async function updateAdminSettings(body: {
  defaultMeasurementUnit?: string;
  defaultCurrency?: string;
}): Promise<AdminSettings> {
  const data = await apiData<{ settings: AdminSettings }>("/api/admin/settings", {
    method: "PATCH",
    body,
  });
  return data.settings;
}

export async function addAdminPhone(
  phone: string,
  options?: { showOnBanner?: boolean },
): Promise<AdminSettings> {
  const data = await apiData<{ settings: AdminSettings }>(
    "/api/admin/settings/admin-phones",
    {
      method: "POST",
      body: {
        phone,
        ...(options?.showOnBanner != null
          ? { showOnBanner: options.showOnBanner }
          : {}),
      },
    },
  );
  return data.settings;
}

export async function updateAdminPhoneBanner(
  phoneId: string,
  showOnBanner: boolean,
): Promise<AdminSettings> {
  const data = await apiData<{ settings: AdminSettings }>(
    `/api/admin/settings/admin-phones/${phoneId}`,
    {
      method: "PATCH",
      body: { showOnBanner },
    },
  );
  return data.settings;
}

export async function removeAdminPhone(phoneId: string): Promise<AdminSettings> {
  const data = await apiData<{ settings: AdminSettings }>(
    `/api/admin/settings/admin-phones/${phoneId}`,
    { method: "DELETE" },
  );
  return data.settings;
}

export async function updateSmsSettings(body: {
  provider?: string;
  senderId?: string;
}): Promise<AdminSettings> {
  const data = await apiData<{ settings: AdminSettings }>(
    "/api/admin/settings/sms",
    {
      method: "PATCH",
      body,
    },
  );
  return data.settings;
}
