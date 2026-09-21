import { apiData } from "@/lib/api/client";
import { toQuery } from "@/lib/api/types";

export type AdminLead = {
  id: string;
  email: string;
  campaignKey: string;
  source?: string | null;
  createdAt: string;
  couponId: string;
  couponCode?: string | null;
  couponName?: string | null;
  couponType?: string | null;
  couponStatus?: string | null;
  redemptionCount?: number;
  redeemed?: boolean;
};

export type AdminLeadsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  campaignKey?: string;
  source?: string;
};

export type AdminLeadsListResult = {
  leads: AdminLead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminLeadCampaign = {
  campaignKey: string;
  leadCount: number;
};

export async function listAdminLeads(params?: AdminLeadsQuery) {
  return apiData<AdminLeadsListResult>(`/api/admin/leads${toQuery(params)}`);
}

export async function listAdminLeadCampaigns() {
  const data = await apiData<{ campaigns: AdminLeadCampaign[] }>(
    "/api/admin/leads/campaigns",
  );
  return data.campaigns;
}

export async function exportAdminLeads(params?: Omit<AdminLeadsQuery, "page" | "limit">) {
  return apiData<{ leads: AdminLead[]; truncated?: boolean }>(
    `/api/admin/leads/export${toQuery(params)}`,
  );
}
