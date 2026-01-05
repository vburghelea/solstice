/**
 * BI Module Mutations (Server Functions)
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { OrganizationRole } from "~/lib/auth/guards/org-guard";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import type { FilterConfig } from "./bi.schemas";
import {
  exportRequestSchema,
  filterSchema,
  pivotQuerySchema,
  sqlExportRequestSchema,
  widgetTypeSchema,
} from "./bi.schemas";
import type { QueryContext } from "./bi.types";
import { normalizePivotConfig } from "./bi.utils";
import { loadDatasetData } from "./bi.data";
import { buildPivotResult } from "./engine/pivot-aggregator";
import {
  filterAccessibleFields,
  getFieldsToMask,
  QUERY_GUARDRAILS,
  queryIncludesPii,
} from "./governance";
import { getDataset } from "./semantic";
import { getMetric } from "./semantic/metrics.config";
import type { JsonRecord, JsonValue } from "~/shared/lib/json";

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

const serializeFilterValue = (value: unknown): JsonValue => {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((entry) => serializeFilterValue(entry));
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null ||
    value === undefined
  ) {
    return value;
  }
  if (typeof value === "object") {
    const result: Record<string, JsonValue> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = serializeFilterValue(v);
    }
    return result;
  }
  return null;
};

const serializeFilters = (
  filters: Array<{ field: string; operator: string; value: unknown }>,
) => {
  const serialized: JsonRecord = {};
  for (const filter of filters) {
    serialized[filter.field] = {
      operator: filter.operator,
      value: serializeFilterValue(filter.value),
    };
  }
  return serialized;
};

const ensureOrgScope = (params: {
  datasetOrgField?: string;
  datasetRequiresOrg: boolean | undefined;
  isGlobalAdmin: boolean;
  contextOrganizationId: string | null;
  requestOrganizationId?: string | null;
  filters: FilterConfig[];
}): { scopedOrganizationId: string | null } => {
  if (params.isGlobalAdmin) {
    return {
      scopedOrganizationId:
        params.requestOrganizationId ?? params.contextOrganizationId ?? null,
    };
  }

  if (!params.datasetRequiresOrg) {
    return { scopedOrganizationId: null };
  }

  if (!params.contextOrganizationId) {
    throw new Error("Organization context required");
  }

  if (
    params.requestOrganizationId &&
    params.requestOrganizationId !== params.contextOrganizationId
  ) {
    throw new Error("Organization context mismatch");
  }

  const orgField = params.datasetOrgField ?? "organizationId";
  const orgFilter = params.filters.find((filter) => filter.field === orgField);
  if (orgFilter) {
    const filterValues =
      orgFilter.operator === "in" && Array.isArray(orgFilter.value)
        ? orgFilter.value
        : [orgFilter.value];
    const invalid = filterValues.some((value) => value !== params.contextOrganizationId);
    if (invalid) {
      throw new Error("Organization context mismatch");
    }
  }

  return { scopedOrganizationId: params.contextOrganizationId };
};

const hasAnalyticsPermission = (permissions: Set<string>, permission: string) =>
  permissions.has(permission) ||
  permissions.has("analytics.admin") ||
  permissions.has("*");

const ensureDashboardOwner = async (dashboardId: string, userId: string) => {
  const { getDb } = await import("~/db/server-helpers");
  const { biDashboards } = await import("~/db/schema");
  const { eq } = await import("drizzle-orm");
  const { badRequest, forbidden } = await import("~/lib/server/errors");
  const { PermissionService } = await import("~/features/roles/permission.service");

  const db = await getDb();
  const [dashboard] = await db
    .select()
    .from(biDashboards)
    .where(eq(biDashboards.id, dashboardId))
    .limit(1);

  if (!dashboard) {
    throw badRequest("Dashboard not found");
  }

  const isGlobalAdmin = await PermissionService.isGlobalAdmin(userId);
  if (!isGlobalAdmin && dashboard.ownerId !== userId) {
    throw forbidden("Dashboard access denied");
  }

  return dashboard;
};

// =============================================================================
// Export Mutations
// =============================================================================

export const exportPivotResults = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(exportRequestSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics");
    const user = requireUser(context);
    const { enforceRateLimit } = await import("~/lib/security/rate-limiter");
    await enforceRateLimit({
      bucket: "export",
      route: "bi:pivot-export",
      userId: user.id,
    });
    const { badRequest, forbidden } = await import("~/lib/server/errors");

    if (!data.pivotQuery) {
      throw badRequest("pivotQuery is required for export");
    }

    const { getCurrentSession, requireRecentAuth } =
      await import("~/lib/auth/guards/step-up");
    const session = await getCurrentSession();
    await requireRecentAuth(user.id, session);

    const dataset = getDataset(data.pivotQuery.datasetId);
    if (!dataset) {
      throw badRequest(`Unknown dataset: ${data.pivotQuery.datasetId}`);
    }

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(user.id);
    const roleAssignments = await PermissionService.getUserRoles(user.id);
    const permissions = extractPermissionSet(roleAssignments);

    if (!hasAnalyticsPermission(permissions, "analytics.export")) {
      throw forbidden("Analytics export permission required");
    }

    const requestedMetricIds = data.pivotQuery.measures
      .map((measure) => measure.metricId)
      .filter((value): value is string => Boolean(value));
    const forbiddenMetrics = requestedMetricIds.filter((metricId) => {
      const metric = getMetric(metricId);
      if (!metric?.requiredPermission) return false;
      return (
        !permissions.has(metric.requiredPermission) &&
        !permissions.has("analytics.admin") &&
        !permissions.has("*")
      );
    });

    if (forbiddenMetrics.length > 0) {
      throw forbidden(`Metric access denied: ${forbiddenMetrics.join(", ")}`);
    }

    const contextOrganizationId =
      (context as { organizationId?: string | null } | undefined)?.organizationId ?? null;

    let orgRole: OrganizationRole | null = null;
    if (contextOrganizationId && !isGlobalAdmin && dataset.requiresOrgScope) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      const access = await requireOrganizationAccess(
        { userId: user.id, organizationId: contextOrganizationId },
        { roles: ANALYTICS_ROLES },
      );
      orgRole = access.role as OrganizationRole;
    }

    let scopedOrganizationId: string | null = null;
    try {
      scopedOrganizationId =
        ensureOrgScope({
          datasetOrgField: dataset.orgScopeColumn ?? "organizationId",
          datasetRequiresOrg: dataset.requiresOrgScope,
          isGlobalAdmin,
          contextOrganizationId,
          requestOrganizationId: data.pivotQuery.organizationId ?? null,
          filters: data.pivotQuery.filters,
        }).scopedOrganizationId ?? null;
    } catch (error) {
      throw forbidden(error instanceof Error ? error.message : "Org scoping failed");
    }

    const queryContext: QueryContext = {
      userId: user.id,
      organizationId: scopedOrganizationId,
      orgRole,
      isGlobalAdmin,
      permissions,
      hasRecentAuth: true,
      timestamp: new Date(),
    };

    const normalized = normalizePivotConfig({
      dataset,
      rows: data.pivotQuery.rows,
      columns: data.pivotQuery.columns,
      measures: data.pivotQuery.measures,
      filters: data.pivotQuery.filters,
    });

    if (!normalized.ok) {
      throw badRequest(normalized.errors.join(" "));
    }

    const accessibleFields = filterAccessibleFields(dataset.fields, queryContext);
    const accessibleIds = new Set(accessibleFields.map((field) => field.id));
    const requestedFields = new Set([
      ...normalized.value.rowFields,
      ...normalized.value.columnFields,
      ...normalized.value.measures
        .map((measure) => measure.field)
        .filter((field): field is string => Boolean(field)),
    ]);

    const forbiddenFields = Array.from(requestedFields).filter(
      (field) => !accessibleIds.has(field),
    );

    if (forbiddenFields.length > 0) {
      throw forbidden(`Field access denied: ${forbiddenFields.join(", ")}`);
    }

    const orgScopeFilters = normalized.value.filters;
    if (dataset.requiresOrgScope && scopedOrganizationId) {
      const scopeField = dataset.orgScopeColumn ?? "organizationId";
      orgScopeFilters.push({
        field: scopeField,
        operator: "eq",
        value: scopedOrganizationId,
      });
    }

    const fieldsToMask = getFieldsToMask(accessibleFields, queryContext, true);

    const exportLimit = QUERY_GUARDRAILS.maxRowsExport;
    const rows = await loadDatasetData({
      datasetId: dataset.id,
      columns: normalized.value.selectedFields,
      filters: orgScopeFilters,
      fieldsToMask,
      limit: exportLimit + 1,
    });

    if (rows.length > exportLimit) {
      throw badRequest(
        `Export exceeds ${exportLimit.toLocaleString()} rows. Add filters to reduce.`,
      );
    }

    const pivot = buildPivotResult(rows, {
      rowFields: normalized.value.rowFields,
      columnFields: normalized.value.columnFields,
      measures: normalized.value.measures,
    });

    const columnLabels = [
      ...pivot.rowFields,
      ...pivot.columnKeys.flatMap((columnKey) =>
        pivot.measures.map((measure) => `${columnKey.label} • ${measure.label}`),
      ),
    ];

    const exportRows = pivot.rows.map((row) => {
      const record: Record<string, unknown> = {};
      for (const field of pivot.rowFields) {
        record[field] = row.values[field] ?? "";
      }
      for (const columnKey of pivot.columnKeys) {
        for (const measure of pivot.measures) {
          const header = `${columnKey.label} • ${measure.label}`;
          record[header] = row.cells[columnKey.key]?.[measure.key] ?? null;
        }
      }
      return record;
    });

    let exportPayload = "";
    let fileName = "pivot-export.csv";
    let mimeType = "text/csv";
    let encoding: "base64" | "utf-8" = "utf-8";

    if (data.format === "xlsx") {
      const module = await import("xlsx");
      const XLSX = "default" in module ? module.default : module;
      const worksheet = XLSX.utils.json_to_sheet(exportRows, { header: columnLabels });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Pivot");
      exportPayload = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
      fileName = "pivot-export.xlsx";
      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      encoding = "base64";
    } else if (data.format === "json") {
      exportPayload = JSON.stringify(exportRows, null, 2);
      fileName = "pivot-export.json";
      mimeType = "application/json";
    } else {
      const { toCsv } = await import("~/shared/lib/csv");
      exportPayload = toCsv(exportRows);
    }

    const { getDb } = await import("~/db/server-helpers");
    const { exportHistory } = await import("~/db/schema");
    const db = await getDb();

    await db.insert(exportHistory).values({
      userId: user.id,
      organizationId: scopedOrganizationId,
      reportId: null,
      exportType: data.format,
      dataSource: dataset.id,
      filtersUsed: serializeFilters(orgScopeFilters),
      rowCount: exportRows.length,
      fileKey: null,
    });

    const includesPii = queryIncludesPii(Array.from(requestedFields), dataset.fields);
    const { logExport } = await import("./governance");
    await logExport({
      context: queryContext,
      queryType: "export",
      datasetId: dataset.id,
      pivotQuery: data.pivotQuery,
      rowsReturned: exportRows.length,
      executionTimeMs: 0,
      format: data.format,
      includesPii,
      stepUpAuthUsed: true,
    });
    const { logAuditEntry } = await import("~/lib/audit");
    await logAuditEntry({
      action: "BI.EXPORT",
      actionCategory: "EXPORT",
      actorUserId: user.id,
      actorOrgId: scopedOrganizationId,
      targetType: "bi_dataset",
      targetId: dataset.id,
      metadata: {
        datasetId: dataset.id,
        format: data.format,
        rowCount: exportRows.length,
        includesPii,
        stepUpAuthUsed: true,
      },
    });

    return {
      data: exportPayload,
      fileName,
      mimeType,
      encoding,
    };
  });

export const exportSqlResults = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(sqlExportRequestSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics_sql_workbench");
    const user = requireUser(context);
    const { enforceRateLimit } = await import("~/lib/security/rate-limiter");
    await enforceRateLimit({
      bucket: "export",
      route: "bi:sql-export",
      userId: user.id,
    });
    const { badRequest, forbidden } = await import("~/lib/server/errors");

    const { getCurrentSession, requireRecentAuth } =
      await import("~/lib/auth/guards/step-up");
    const session = await getCurrentSession();
    await requireRecentAuth(user.id, session);

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(user.id);
    const roleAssignments = await PermissionService.getUserRoles(user.id);
    const permissions = extractPermissionSet(roleAssignments);

    const contextOrganizationId =
      (context as { organizationId?: string | null } | undefined)?.organizationId ?? null;

    // Check org role BEFORE permission check - org admins/owners get SQL access
    let orgRole: OrganizationRole | null = null;
    if (contextOrganizationId && !isGlobalAdmin) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      const access = await requireOrganizationAccess(
        { userId: user.id, organizationId: contextOrganizationId },
        { roles: ANALYTICS_ROLES },
      );
      orgRole = access.role as OrganizationRole;
    }

    // Per SPEC-bi-platform.md: org admin/owner get SQL access, reporters need analytics.sql permission
    const orgRoleAllowsSql = orgRole === "admin" || orgRole === "owner";
    if (
      !isGlobalAdmin &&
      !orgRoleAllowsSql &&
      !hasAnalyticsPermission(permissions, "analytics.sql")
    ) {
      throw forbidden("Analytics SQL permission required");
    }
    if (!hasAnalyticsPermission(permissions, "analytics.export")) {
      throw forbidden("Analytics export permission required");
    }

    const queryContext: QueryContext = {
      userId: user.id,
      organizationId: contextOrganizationId,
      orgRole,
      isGlobalAdmin,
      permissions,
      hasRecentAuth: true,
      timestamp: new Date(),
    };

    const { executeSqlWorkbenchQuery } = await import("./bi.sql-executor");
    const result = await executeSqlWorkbenchQuery({
      sqlText: data.sql,
      parameters: data.parameters ?? {},
      context: queryContext,
      maxRows: QUERY_GUARDRAILS.maxRowsExport + 1,
      ...(data.datasetId ? { datasetId: data.datasetId } : {}),
      logQuery: false,
    });

    if (result.rowCount > QUERY_GUARDRAILS.maxRowsExport) {
      throw badRequest(
        `Export exceeds ${QUERY_GUARDRAILS.maxRowsExport.toLocaleString()} rows. ` +
          "Add filters to reduce.",
      );
    }

    const exportRows = result.rows as Array<Record<string, unknown>>;
    const columns = exportRows[0] ? Object.keys(exportRows[0]) : [];

    let exportPayload = "";
    let fileName = "sql-export.csv";
    let mimeType = "text/csv";
    let encoding: "base64" | "utf-8" = "utf-8";

    if (data.format === "xlsx") {
      const module = await import("xlsx");
      const XLSX = "default" in module ? module.default : module;
      const worksheet = XLSX.utils.json_to_sheet(exportRows, { header: columns });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "SQL");
      exportPayload = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
      fileName = "sql-export.xlsx";
      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      encoding = "base64";
    } else if (data.format === "json") {
      exportPayload = JSON.stringify(exportRows, null, 2);
      fileName = "sql-export.json";
      mimeType = "application/json";
    } else {
      const { toCsv } = await import("~/shared/lib/csv");
      exportPayload = toCsv(exportRows);
    }

    const { getDb } = await import("~/db/server-helpers");
    const { exportHistory } = await import("~/db/schema");
    const db = await getDb();
    await db.insert(exportHistory).values({
      userId: user.id,
      organizationId: contextOrganizationId,
      reportId: null,
      exportType: data.format,
      dataSource: data.datasetId ?? "sql_workbench",
      filtersUsed: {
        sql: data.sql,
        parameters: data.parameters ?? {},
      } as JsonRecord,
      rowCount: exportRows.length,
      fileKey: null,
    });

    const { logExport } = await import("./governance");
    await logExport({
      context: queryContext,
      queryType: "export",
      ...(data.datasetId ? { datasetId: data.datasetId } : {}),
      sqlQuery: result.sql,
      parameters: data.parameters ?? {},
      rowsReturned: exportRows.length,
      executionTimeMs: result.executionTimeMs,
      format: data.format,
      includesPii: false,
      stepUpAuthUsed: true,
    });

    const { logAuditEntry } = await import("~/lib/audit");
    await logAuditEntry({
      action: "BI.EXPORT",
      actionCategory: "EXPORT",
      actorUserId: user.id,
      actorOrgId: contextOrganizationId,
      targetType: data.datasetId ? "bi_dataset" : "bi_sql",
      targetId: data.datasetId ?? null,
      metadata: {
        datasetId: data.datasetId ?? null,
        format: data.format,
        rowCount: exportRows.length,
        includesPii: false,
        stepUpAuthUsed: true,
        queryType: "sql",
      },
    });

    return {
      data: exportPayload,
      fileName,
      mimeType,
      encoding,
    };
  });

// =============================================================================
// Dashboard Mutations
// =============================================================================

const createDashboardSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const createDashboard = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(createDashboardSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics");
    const user = requireUser(context);
    const { forbidden } = await import("~/lib/server/errors");

    const contextOrganizationId =
      (context as { organizationId?: string | null } | undefined)?.organizationId ?? null;

    const { PermissionService } = await import("~/features/roles/permission.service");
    const roleAssignments = await PermissionService.getUserRoles(user.id);
    const permissions = extractPermissionSet(roleAssignments);

    if (!hasAnalyticsPermission(permissions, "analytics.author")) {
      throw forbidden("Analytics author permission required");
    }

    if (!contextOrganizationId) {
      throw forbidden("Organization context required");
    }

    const { getDb } = await import("~/db/server-helpers");
    const { biDashboards } = await import("~/db/schema");

    const db = await getDb();
    const [dashboard] = await db
      .insert(biDashboards)
      .values({
        organizationId: contextOrganizationId,
        name: data.name,
        description: data.description ?? null,
        layout: { columns: 12, rowHeight: 32, compactType: "vertical" },
        globalFilters: [],
        ownerId: user.id,
        sharedWith: [],
        isOrgWide: false,
        isPublished: false,
      })
      .returning();

    return {
      dashboardId: dashboard?.id ?? null,
    };
  });

const updateDashboardSchema = z.object({
  dashboardId: z.uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isOrgWide: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  sharedWith: z.array(z.string()).optional(),
  layout: z
    .object({
      columns: z.number().int().positive(),
      rowHeight: z.number().int().positive(),
      compactType: z.enum(["vertical", "horizontal"]).nullable(),
    })
    .optional(),
  globalFilters: z.array(filterSchema).optional(),
});

export const updateDashboard = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(updateDashboardSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics");
    const user = requireUser(context);
    const { getDb } = await import("~/db/server-helpers");
    const { biDashboards } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { forbidden } = await import("~/lib/server/errors");

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(biDashboards)
      .where(eq(biDashboards.id, data.dashboardId))
      .limit(1);

    if (!existing) return { success: false as const };

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(user.id);
    const roleAssignments = await PermissionService.getUserRoles(user.id);
    const permissions = extractPermissionSet(roleAssignments);

    if (!isGlobalAdmin && existing.ownerId !== user.id) {
      throw forbidden("Dashboard access denied");
    }

    if (data.isOrgWide && !hasAnalyticsPermission(permissions, "analytics.share")) {
      throw forbidden("Analytics share permission required");
    }

    const [updated] = await db
      .update(biDashboards)
      .set({
        name: data.name ?? existing.name,
        description: data.description ?? existing.description,
        isOrgWide: data.isOrgWide ?? existing.isOrgWide,
        isPublished: data.isPublished ?? existing.isPublished,
        sharedWith: data.sharedWith ?? existing.sharedWith,
        layout: data.layout ?? existing.layout,
        globalFilters: data.globalFilters ?? existing.globalFilters,
      })
      .where(eq(biDashboards.id, data.dashboardId))
      .returning();

    return {
      success: Boolean(updated),
    };
  });

const deleteDashboardSchema = z.object({
  dashboardId: z.uuid(),
});

export const deleteDashboard = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(deleteDashboardSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics");
    const user = requireUser(context);
    const { getDb } = await import("~/db/server-helpers");
    const { biDashboards } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    await ensureDashboardOwner(data.dashboardId, user.id);
    await db.delete(biDashboards).where(eq(biDashboards.id, data.dashboardId));

    return { success: true as const };
  });

// =============================================================================
// Widget Mutations
// =============================================================================

const addWidgetSchema = z.object({
  dashboardId: z.uuid(),
  widgetType: z.enum(["chart", "pivot", "kpi", "text", "filter"]),
  title: z.string().min(1).max(100),
  position: z.object({
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
    w: z.number().int().positive(),
    h: z.number().int().positive(),
  }),
  query: pivotQuerySchema.optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const addWidget = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(addWidgetSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics");
    const user = requireUser(context);
    await ensureDashboardOwner(data.dashboardId, user.id);
    const { getDb } = await import("~/db/server-helpers");
    const { biDashboardWidgets } = await import("~/db/schema");

    const db = await getDb();
    const [widget] = await db
      .insert(biDashboardWidgets)
      .values({
        dashboardId: data.dashboardId,
        widgetType: data.widgetType,
        reportId: null,
        x: data.position.x,
        y: data.position.y,
        w: data.position.w,
        h: data.position.h,
        config: {
          title: data.title,
          ...(data.query ? { query: data.query } : {}),
          ...data.config,
        },
      })
      .returning();

    return {
      widgetId: widget?.id ?? null,
    };
  });

const updateWidgetSchema = z.object({
  dashboardId: z.uuid(),
  widgetId: z.uuid(),
  widgetType: widgetTypeSchema.optional(),
  title: z.string().min(1).max(100).optional(),
  position: z
    .object({
      x: z.number().int().nonnegative(),
      y: z.number().int().nonnegative(),
      w: z.number().int().positive(),
      h: z.number().int().positive(),
    })
    .optional(),
  query: pivotQuerySchema.optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const updateWidget = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(updateWidgetSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics");
    const user = requireUser(context);
    await ensureDashboardOwner(data.dashboardId, user.id);
    const { getDb } = await import("~/db/server-helpers");
    const { biDashboardWidgets } = await import("~/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(biDashboardWidgets)
      .where(
        and(
          eq(biDashboardWidgets.id, data.widgetId),
          eq(biDashboardWidgets.dashboardId, data.dashboardId),
        ),
      )
      .limit(1);

    if (!existing) return { success: false as const };

    const nextConfig = {
      ...existing.config,
      ...data.config,
      ...(data.title ? { title: data.title } : {}),
      ...(data.query ? { query: data.query } : {}),
    };

    const [updated] = await db
      .update(biDashboardWidgets)
      .set({
        widgetType: data.widgetType ?? existing.widgetType,
        x: data.position?.x ?? existing.x,
        y: data.position?.y ?? existing.y,
        w: data.position?.w ?? existing.w,
        h: data.position?.h ?? existing.h,
        config: nextConfig,
      })
      .where(
        and(
          eq(biDashboardWidgets.id, data.widgetId),
          eq(biDashboardWidgets.dashboardId, data.dashboardId),
        ),
      )
      .returning();

    return { success: Boolean(updated) };
  });

const removeWidgetSchema = z.object({
  dashboardId: z.uuid(),
  widgetId: z.uuid(),
});

export const removeWidget = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(removeWidgetSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics");
    const user = requireUser(context);
    await ensureDashboardOwner(data.dashboardId, user.id);
    const { getDb } = await import("~/db/server-helpers");
    const { biDashboardWidgets } = await import("~/db/schema");
    const { and, eq } = await import("drizzle-orm");

    const db = await getDb();
    await db
      .delete(biDashboardWidgets)
      .where(
        and(
          eq(biDashboardWidgets.id, data.widgetId),
          eq(biDashboardWidgets.dashboardId, data.dashboardId),
        ),
      );

    return { success: true as const };
  });
