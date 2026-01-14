import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { PivotBuilder } from "~/features/bi/components/pivot-builder/PivotBuilder";
import {
  NlQueryInput,
  type NlQueryExecutionResult,
  QueryResults,
} from "~/features/bi/nl-query/components";
import { useAuth } from "~/features/auth";
import { useOrgContext } from "~/features/organizations/org-context";
import { isFeatureEnabled } from "~/tenant/feature-gates";
import type { AuthUser } from "~/lib/auth/types";
import { GLOBAL_ADMIN_ROLE_NAMES } from "~/lib/auth/utils/admin-check";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/dashboard/analytics/explore")({
  head: () => createPageHead("Analytics Explorer"),
  component: AnalyticsExplorePage,
});

const allowedRoles = new Set(["owner", "admin", "reporter"]);
const analyticsPermissions = new Set(["analytics.author", "analytics.sql"]);

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

interface NlQueryState {
  results: NlQueryExecutionResult["results"];
  suggestedVisualization: NlQueryExecutionResult["suggestedVisualization"];
}

function AnalyticsExplorePage() {
  const { organizationRole, activeOrganizationId } = useOrgContext();
  const { user } = useAuth();
  const permissions = getPermissionSet(user as AuthUser | null);
  const hasAccess =
    (organizationRole && allowedRoles.has(organizationRole)) ||
    isGlobalAdmin(user as AuthUser | null) ||
    hasAnalyticsPermission(permissions);

  const nlQueryEnabled = isFeatureEnabled("sin_nl_query");
  const [nlQueryState, setNlQueryState] = useState<NlQueryState | null>(null);

  if (!hasAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics access required</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Your organization role does not include analytics access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Build pivots and charts with governed datasets.
        </p>
      </div>

      {nlQueryEnabled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" aria-hidden />
              Ask AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NlQueryInput
              organizationId={activeOrganizationId ?? undefined}
              onQueryExecuted={(result) => {
                setNlQueryState({
                  results: result.results,
                  suggestedVisualization: result.suggestedVisualization,
                });
              }}
            />
          </CardContent>
        </Card>
      )}

      {nlQueryState && nlQueryState.results.length > 0 && (
        <QueryResults
          results={nlQueryState.results}
          suggestedVisualization={nlQueryState.suggestedVisualization}
          onClear={() => setNlQueryState(null)}
        />
      )}

      <PivotBuilder />
    </div>
  );
}
