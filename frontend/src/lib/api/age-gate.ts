import { apiData } from "@/lib/api/client";

type AgeGateVerifyData = {
  approved: boolean;
  ageGateToken: string;
  expiresIn: string;
};

type AgeGateBlockData = {
  blocked: true;
};

export async function verifyAgeGate(): Promise<AgeGateVerifyData> {
  return apiData<AgeGateVerifyData>("/api/age-gate/verify", {
    method: "POST",
    auth: false,
    body: { accepted: true },
  });
}

export async function blockAgeGate(): Promise<AgeGateBlockData> {
  return apiData<AgeGateBlockData>("/api/age-gate/block", {
    method: "POST",
    auth: false,
    body: { accepted: false },
  });
}
