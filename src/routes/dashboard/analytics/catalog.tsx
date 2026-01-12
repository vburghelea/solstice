import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useAuth } from "~/features/auth";
import { getAvailableDatasets, getDatasetFields } from "~/features/bi/bi.queries";
import { getMetricsForDataset } from "~/features/bi/semantic/metrics.config";
import type { DatasetField } from "~/features/bi/bi.types";
import type { AuthUser } from "~/lib/auth/types";
import { GLOBAL_ADMIN_ROLE_NAMES } from "~/lib/auth/utils/admin-check";
import { useOrgContext } from "~/features/organizations/org-context";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/dashboard/analytics/catalog")({
  head: () => createPageHead("Data Catalog"),
  component: AnalyticsCatalogPage,
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

const formatEnumValues = (field: DatasetField) => {
  if (!field.enumValues || field.enumValues.length === 0) return "-";
  return field.enumValues.map((entry) => entry.label).join(", ");
};

const formatSensitivity = (field: DatasetField) => {
  if (!field.piiClassification || field.piiClassification === "none") return "None";
  return field.piiClassification.replace(/_/g, " ");
};

const formatFormat = (field: DatasetField) => {
  if (!field.formatType) return "-";
  const options = field.formatOptions ?? {};
  if (field.formatType === "percent" && typeof options.decimals === "number") {
    return `${field.formatType} (${options.decimals}d)`;
  }
  if (field.formatType === "currency" && options.currency) {
    return `${field.formatType} (${options.currency})`;
  }
  return field.formatType;
};

function AnalyticsCatalogPage() {
  const { organizationRole } = useOrgContext();
  const { user } = useAuth();
  const permissions = getPermissionSet(user as AuthUser | null);
  const hasAccess =
    (organizationRole && allowedRoles.has(organizationRole)) ||
    isGlobalAdmin(user as AuthUser | null) ||
    hasAnalyticsPermission(permissions);

  const datasetsQuery = useQuery({
    queryKey: ["bi-datasets"],
    queryFn: () => getAvailableDatasets(),
  });

  const datasets = datasetsQuery.data?.datasets ?? [];
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(
    datasets[0]?.id ?? "",
  );

  useEffect(() => {
    if (!selectedDatasetId && datasets.length > 0) {
      setSelectedDatasetId(datasets[0]?.id ?? "");
    }
  }, [datasets, selectedDatasetId]);

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId) ?? null,
    [datasets, selectedDatasetId],
  );

  const fieldsQuery = useQuery({
    queryKey: ["bi-fields", selectedDatasetId],
    queryFn: () =>
      selectedDatasetId
        ? getDatasetFields({ data: { datasetId: selectedDatasetId } })
        : Promise.resolve(null),
    enabled: Boolean(selectedDatasetId),
  });

  const fields = (fieldsQuery.data?.fields ?? []) as DatasetField[];
  const metrics = useMemo(
    () => getMetricsForDataset(selectedDatasetId),
    [selectedDatasetId],
  );

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
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Data catalog</h1>
        <p className="text-muted-foreground text-sm">
          Browse governed datasets, definitions, and metrics.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dataset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={selectedDatasetId}
            onValueChange={(value) => setSelectedDatasetId(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select dataset" />
            </SelectTrigger>
            <SelectContent>
              {datasets.map((dataset) => (
                <SelectItem key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedDataset ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {selectedDataset.description ?? "No description provided."}
              </p>
              {selectedDataset.freshness ? (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">
                    Source: {selectedDataset.freshness.sourceSystem}
                  </Badge>
                  <Badge variant="secondary">
                    Cadence: {selectedDataset.freshness.updateCadence}
                  </Badge>
                  {selectedDataset.freshness.lastUpdatedField ? (
                    <Badge variant="secondary">
                      Last updated field: {selectedDataset.freshness.lastUpdatedField}
                    </Badge>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {metrics.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.map((metric) => (
              <div key={metric.id} className="space-y-1 rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <Badge variant="outline">{metric.aggregation ?? "count"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {metric.description ?? "No description provided."}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Sensitivity</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Enum values</TableHead>
                <TableHead>Ops</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground text-sm">
                    Select a dataset to view fields.
                  </TableCell>
                </TableRow>
              ) : (
                fields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{field.name}</TableCell>
                    <TableCell>{field.dataType}</TableCell>
                    <TableCell className="max-w-[320px]">
                      {field.description ?? "-"}
                    </TableCell>
                    <TableCell>{formatSensitivity(field)}</TableCell>
                    <TableCell>{formatFormat(field)}</TableCell>
                    <TableCell>{formatEnumValues(field)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 text-xs">
                        {field.allowGroupBy ? (
                          <Badge variant="secondary">Group</Badge>
                        ) : null}
                        {field.allowAggregate ? (
                          <Badge variant="secondary">Aggregate</Badge>
                        ) : null}
                        {field.allowFilter ? (
                          <Badge variant="secondary">Filter</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
