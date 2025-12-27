import { getTenantKey } from "./tenant-env";
import type { TenantConfig, TenantKey } from "./tenant.types";
import { qcTenant } from "./tenants/qc";
import { viasportTenant } from "./tenants/viasport";

const TENANT_MAP: Record<TenantKey, TenantConfig> = {
  qc: qcTenant,
  viasport: viasportTenant,
};

export const getTenantConfig = (key?: TenantKey): TenantConfig => {
  const resolvedKey = key ?? getTenantKey();
  return TENANT_MAP[resolvedKey];
};

export const tenant = getTenantConfig();

export const isTenant = (key: TenantKey) => getTenantKey() === key;

export const getBrand = () => getTenantConfig().brand;

export const getOrgHierarchy = () => getTenantConfig().orgHierarchy;
