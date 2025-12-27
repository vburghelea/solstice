import { redirect } from "@tanstack/react-router";
import type { NavItem } from "~/features/layouts/nav.types";
import type { OrganizationRole } from "~/lib/auth/guards/org-guard";
import type { AuthUser } from "~/lib/auth/types";
import { isAdminClient } from "~/lib/auth/utils/admin-check";
import { getTenantConfig } from "./index";
import type { FeatureKey } from "./tenant.types";

export const isFeatureEnabled = (key: FeatureKey) =>
  Boolean(getTenantConfig().features[key]);

export const assertFeatureEnabled = async (key: FeatureKey) => {
  if (!isFeatureEnabled(key)) {
    const { forbidden } = await import("~/lib/server/errors");
    throw forbidden("Feature not enabled for this tenant");
  }
};

export const requireFeatureInRoute = (
  key: FeatureKey,
  redirectTo = "/dashboard/forbidden",
) => {
  if (!isFeatureEnabled(key)) {
    throw redirect({ to: redirectTo });
  }
};

export const filterNavItems = (
  items: NavItem[],
  options?: {
    user?: AuthUser | null;
    organizationRole?: OrganizationRole | null;
  },
) => {
  return items.filter((item) => {
    if (item.feature && !isFeatureEnabled(item.feature)) return false;

    if (item.requiresGlobalAdmin) {
      if (!options?.user) return false;
      if (!isAdminClient(options.user)) return false;
    }

    if (item.requiresOrgRole) {
      const role = options?.organizationRole ?? null;
      if (!role) return false;
      const required = Array.isArray(item.requiresOrgRole)
        ? item.requiresOrgRole
        : [item.requiresOrgRole];
      if (!required.includes(role)) return false;
    }

    return true;
  });
};
