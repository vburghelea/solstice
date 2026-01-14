import type { OrganizationRole } from "~/lib/auth/guards/org-guard";
import type { QueryContext } from "../bi.types";

const ANALYTICS_ROLES: OrganizationRole[] = ["owner", "admin", "reporter"];

const extractPermissionSet = (
  roleAssignments: Array<{ role?: { permissions?: Record<string, boolean> } }>,
) => {
  const permissions = new Set<string>();
  for (const assignment of roleAssignments) {
    const perms = assignment.role?.permissions ?? {};
    for (const [key, value] of Object.entries(perms)) {
      if (value) permissions.add(key);
    }
  }
  return permissions;
};

export type BuildQueryContextParams = {
  context: unknown;
  userId: string;
  hasRecentAuth?: boolean;
  requireOrgAccess?: boolean;
};

export type BuildQueryContextResult = {
  queryContext: QueryContext;
  contextOrganizationId: string | null;
  isGlobalAdmin: boolean;
  orgRole: OrganizationRole | null;
  permissions: Set<string>;
};

export const buildQueryContext = async (
  params: BuildQueryContextParams,
): Promise<BuildQueryContextResult> => {
  const { PermissionService } = await import("~/features/roles/permission.service");
  const isGlobalAdmin = await PermissionService.isGlobalAdmin(params.userId);
  const roleAssignments = await PermissionService.getUserRoles(params.userId);
  const permissions = extractPermissionSet(roleAssignments);

  const contextOrganizationId =
    (params.context as { organizationId?: string | null } | undefined)?.organizationId ??
    null;

  let orgRole: OrganizationRole | null = null;
  const shouldCheckOrg =
    params.requireOrgAccess !== false && contextOrganizationId && !isGlobalAdmin;

  if (shouldCheckOrg) {
    const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
    const access = await requireOrganizationAccess(
      { userId: params.userId, organizationId: contextOrganizationId },
      { roles: ANALYTICS_ROLES },
    );
    orgRole = access.role as OrganizationRole;
  }

  return {
    queryContext: {
      userId: params.userId,
      organizationId: contextOrganizationId,
      orgRole,
      isGlobalAdmin,
      permissions,
      hasRecentAuth: params.hasRecentAuth ?? false,
      timestamp: new Date(),
    },
    contextOrganizationId,
    isGlobalAdmin,
    orgRole,
    permissions,
  };
};
