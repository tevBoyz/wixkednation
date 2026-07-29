import { apiData } from "@/lib/api/client";
import type { AuthUser } from "@/lib/api/types";

export async function getCurrentUser() {
  const data = await apiData<{ user: AuthUser }>("/api/users/me");
  return data.user;
}

export async function updateCurrentUser(body: {
  name?: string | null;
  email?: string | null;
}) {
  const data = await apiData<{ user: AuthUser }>("/api/users/me", {
    method: "PATCH",
    body,
  });
  return data.user;
}
