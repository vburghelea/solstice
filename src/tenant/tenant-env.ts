import { z } from "zod";
import { env as clientEnv } from "~/lib/env.client";
import type { TenantKey } from "./tenant.types";

const tenantKeySchema = z.enum(["qc", "viasport"]);

const parseTenantKey = (value: string | undefined, label: string) => {
  if (!value) return undefined;
  const parsed = tenantKeySchema.safeParse(value);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid ${label}: ${message}`);
  }
  return parsed.data;
};

const resolveTenantKey = (
  serverKey: TenantKey | undefined,
  clientKey: TenantKey | undefined,
) => {
  if (serverKey && clientKey && serverKey !== clientKey) {
    throw new Error(
      `Tenant key mismatch: TENANT_KEY=${serverKey} VITE_TENANT_KEY=${clientKey}`,
    );
  }

  return serverKey ?? clientKey ?? "qc";
};

const getServerEnv = (key: string) => {
  if (typeof process === "undefined") return undefined;
  return process.env[key];
};

export const getServerTenantKey = (): TenantKey => {
  const serverKey = parseTenantKey(getServerEnv("TENANT_KEY"), "TENANT_KEY");
  const clientKey = parseTenantKey(getServerEnv("VITE_TENANT_KEY"), "VITE_TENANT_KEY");

  return resolveTenantKey(serverKey, clientKey);
};

export const getClientTenantKey = (): TenantKey => {
  const clientKey = parseTenantKey(clientEnv.VITE_TENANT_KEY, "VITE_TENANT_KEY");
  return clientKey ?? "qc";
};

export const getTenantKey = (): TenantKey => {
  if (typeof window === "undefined") {
    return getServerTenantKey();
  }

  return getClientTenantKey();
};
