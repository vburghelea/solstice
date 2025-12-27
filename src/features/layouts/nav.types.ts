import type { LucideIcon } from "lucide-react";
import type { OrganizationRole } from "~/lib/auth/guards/org-guard";
import type { FeatureKey } from "~/tenant/tenant.types";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  exact?: boolean;
  feature?: FeatureKey;
  requiresGlobalAdmin?: boolean;
  requiresOrgRole?: OrganizationRole | OrganizationRole[];
};

export type NavSection = {
  label: string;
  items: NavItem[];
};
