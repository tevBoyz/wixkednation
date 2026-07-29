import type { SmsLog } from "@/lib/api/types";

export function getSmsLogPurpose(log: SmsLog): string | undefined {
  const purpose = log.metadata?.purpose;
  return typeof purpose === "string" ? purpose : undefined;
}

/** Never show raw OTP content in admin SMS logs UI. */
export function formatSmsLogMessage(log: SmsLog): string {
  const purpose = getSmsLogPurpose(log);

  if (purpose === "otp") {
    return "[OTP message redacted]";
  }

  if (!log.message?.trim()) {
    return "-";
  }

  return log.message;
}
