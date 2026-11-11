import { apiData } from "@/lib/api/client";
import type { AdminMediaListResult } from "@/lib/api/types";
import { toQuery } from "@/lib/api/types";

export type AdminMediaQuery = {
  page?: number;
  limit?: number;
  search?: string;
  includeArchived?: boolean;
};

export async function listAdminMedia(
  params?: AdminMediaQuery,
): Promise<AdminMediaListResult> {
  return apiData<AdminMediaListResult>(
    `/api/admin/media${toQuery({
      page: params?.page,
      limit: params?.limit,
      search: params?.search,
      includeArchived:
        params?.includeArchived === undefined ? undefined : params.includeArchived,
    })}`,
  );
}

