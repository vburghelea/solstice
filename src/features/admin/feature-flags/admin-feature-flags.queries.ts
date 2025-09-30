import { useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import type { OperationResult } from "~/shared/types/common";

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "on", "enabled"].includes(normalized)) return true;
    if (["false", "0", "off", "disabled"].includes(normalized)) return false;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return null;
}

function normalizeFlagKey(envKey: string): string {
  return envKey
    .replace(/^VITE_FLAG_/, "")
    .toLowerCase()
    .replace(/_/g, "-");
}

type FeatureFlagRecord = {
  key: string;
  envKey: string;
  environmentValue: boolean | null;
};

type FeatureFlagListWire = {
  flags: FeatureFlagRecord[];
};

export const listAdminFeatureFlags = createServerFn({ method: "GET" }).handler(
  async (): Promise<OperationResult<FeatureFlagListWire>> => {
    try {
      const [{ getCurrentUser }, { PermissionService }] = await Promise.all([
        import("~/features/auth/auth.queries"),
        import("~/features/roles/permission.service"),
      ]);
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "UNAUTHORIZED", message: "User not authenticated" }],
        };
      }

      const isAdmin = await PermissionService.isGlobalAdmin(currentUser.id);
      if (!isAdmin) {
        return {
          success: false,
          errors: [{ code: "FORBIDDEN", message: "Admin access required" }],
        };
      }

      const flags: FeatureFlagRecord[] = [];
      const env = process.env ?? {};
      for (const [key, value] of Object.entries(env)) {
        if (!key.startsWith("VITE_FLAG_")) continue;
        flags.push({
          key: normalizeFlagKey(key),
          envKey: key,
          environmentValue: parseBoolean(value),
        });
      }

      return { success: true, data: { flags } };
    } catch (error) {
      console.error("listAdminFeatureFlags error", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Unable to load feature flags" }],
      };
    }
  },
);

export function useAdminFeatureFlags() {
  return useQuery<FeatureFlagListWire, Error>({
    queryKey: ["admin", "feature-flags"],
    queryFn: async () => {
      const result = await listAdminFeatureFlags();
      if (!result.success) {
        throw new Error(result.errors?.[0]?.message ?? "Unable to load feature flags");
      }
      return result.data;
    },
    staleTime: 60_000,
  });
}

export type { FeatureFlagRecord };
