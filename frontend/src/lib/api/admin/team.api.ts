import { apiData } from "@/lib/api/client";
import type { UserRole } from "@/lib/api/types";

export type TeamMember = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  authProvider?: string | null;
  role: UserRole;
  hasPin?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  isDisabled?: boolean;
};

export type TeamListResult = {
  items: TeamMember[];
  total: number;
};

export type CreateAdminBody = {
  email: string;
  pin: string;
  name?: string;
};

export type CreateAdminResult = {
  user: TeamMember;
  credentials: {
    email: string;
    pin: string;
  };
};

export type PatchTeamBody = {
  role?: "admin" | "customer";
  restore?: boolean;
};

export async function listAdminTeam(): Promise<TeamListResult> {
  return apiData<TeamListResult>("/api/admin/team");
}

export async function createAdminTeamMember(
  body: CreateAdminBody,
): Promise<CreateAdminResult> {
  return apiData<CreateAdminResult>("/api/admin/team", {
    method: "POST",
    body,
  });
}

export async function patchAdminTeamMember(
  userId: string,
  body: PatchTeamBody,
): Promise<TeamMember> {
  return apiData<TeamMember>(`/api/admin/team/${userId}`, {
    method: "PATCH",
    body,
  });
}

export async function disableAdminTeamMember(
  userId: string,
): Promise<TeamMember> {
  return apiData<TeamMember>(`/api/admin/team/${userId}`, {
    method: "DELETE",
  });
}

export async function restoreAdminTeamMember(
  userId: string,
): Promise<TeamMember> {
  return patchAdminTeamMember(userId, { restore: true });
}

export async function demoteAdminTeamMember(
  userId: string,
): Promise<TeamMember> {
  return patchAdminTeamMember(userId, { role: "customer" });
}
