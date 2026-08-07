import { useQuery } from "@tanstack/react-query";

import { getAuthConfig, type AuthConfig } from "@/lib/api/auth.api";

const DEFAULT_CONFIG: AuthConfig = {
  googleEnabled: true,
  emailOtpEnabled: true,
  smsOtpEnabled: false,
  googleReviewUrl: null,
};

export function useAuthConfig() {
  return useQuery({
    queryKey: ["auth", "config"],
    queryFn: getAuthConfig,
    staleTime: 5 * 60 * 1000,
    placeholderData: DEFAULT_CONFIG,
  });
}
