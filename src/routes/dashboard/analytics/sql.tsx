import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { SqlWorkbench } from "~/features/bi/components/sql-workbench/SqlWorkbench";
import { useAuth } from "~/features/auth";
import { useOrgContext } from "~/features/organizations/org-context";
import type { AuthUser } from "~/lib/auth/types";
import { GLOBAL_ADMIN_ROLE_NAMES } from "~/lib/auth/utils/admin-check";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/analytics/sql")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_analytics_sql_workbench");
  },
  component: SqlWorkbenchPage,
});

const allowedRoles = new Set(["owner", "admin", "reporter"]);
const analyticsPermissions = new Set(["analytics.sql"]);

const getPermissionSet = (user: AuthUser | null) => {
  const permissions = new Set<string>();
  for (const assignment of user?.roles ?? []) {
    const perms = assignment.role?.permissions ?? {};
    for (const [key, enabled] of Object.entries(perms)) {
      if (enabled) permissions.add(key);
    }
  }
  return permissions;
};

const isGlobalAdmin = (user: AuthUser | null) =>
  Boolean(
    user?.roles?.some((assignment) =>
      GLOBAL_ADMIN_ROLE_NAMES.includes(assignment.role?.name ?? ""),
    ),
  );

const hasAnalyticsPermission = (permissions: Set<string>) =>
  Array.from(analyticsPermissions).some((permission) => permissions.has(permission)) ||
  permissions.has("analytics.admin") ||
  permissions.has("*");

function SqlWorkbenchPage() {
  const { organizationRole } = useOrgContext();
  const { user } = useAuth();
  const permissions = getPermissionSet(user as AuthUser | null);
  const hasAccess =
    (organizationRole && allowedRoles.has(organizationRole)) ||
    isGlobalAdmin(user as AuthUser | null) ||
    hasAnalyticsPermission(permissions);

  if (!hasAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics SQL access required</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Your organization role or permission set does not include SQL access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">SQL Workbench</h1>
        <p className="text-muted-foreground text-sm">
          Run governed SQL queries against curated datasets.
        </p>
      </div>
      <SqlWorkbench />
    </div>
  );
}
