import type { OrganizationRole } from "~/lib/auth/guards/org-guard";

export type TenantKey = "qc" | "viasport";

export const featureKeys = [
  "qc_portal",
  "sin_portal",
  "qc_membership",
  "qc_events",
  "qc_teams",
  "qc_members_directory",
  "qc_reports",
  "qc_payments_square",
  "sin_admin",
  "sin_admin_orgs",
  "sin_admin_audit",
  "sin_admin_notifications",
  "sin_admin_security",
  "sin_admin_privacy",
  "sin_admin_forms",
  "sin_admin_imports",
  "sin_admin_reporting",
  "sin_admin_analytics",
  "sin_reporting",
  "sin_forms",
  "sin_imports",
  "sin_analytics",
  "security_core",
  "notifications_core",
] as const;

export type FeatureKey = (typeof featureKeys)[number];

export type BrandConfig = {
  name: string;
  shortName: string;
  portalSubtitle?: string;
  adminSubtitle?: string;
  description?: string;
  marketingUrl?: string;
  supportEmail?: string;
  supportName?: string;
  logoVariant?: "qc" | "viasport" | "default";
  themeColor?: string;
};

export type OrganizationType = "governing_body" | "pso" | "league" | "club" | "affiliate";

export type OrgTypeLabelMap = Record<OrganizationType, string>;

export type OrgHierarchyRules = {
  rootTypes: OrganizationType[];
  allowedChildren: Record<OrganizationType, OrganizationType[]>;
};

export type AdminRoleNames = {
  globalRoleNames: string[];
  orgAdminRoles?: OrganizationRole[];
};

export type TenantConfig = {
  key: TenantKey;
  brand: BrandConfig;
  features: Record<FeatureKey, boolean>;
  orgLabels: OrgTypeLabelMap;
  orgHierarchy: OrgHierarchyRules;
  admin: AdminRoleNames;
};
