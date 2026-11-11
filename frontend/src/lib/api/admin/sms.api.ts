import { apiData } from "@/lib/api/client";
import type { SendTestSmsResult, SmsLogsResult } from "@/lib/api/types";
import { toQuery } from "@/lib/api/types";

export async function sendTestSms(body: {
  phone: string;
  message?: string;
}): Promise<SendTestSmsResult> {
  return apiData<SendTestSmsResult>("/api/admin/sms/test", {
    method: "POST",
    body,
  });
}

export async function getSmsLogs(params?: {
  page?: number;
  limit?: number;
  phone?: string;
  provider?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<SmsLogsResult> {
  return apiData<SmsLogsResult>(`/api/admin/sms/logs${toQuery(params)}`);
}
