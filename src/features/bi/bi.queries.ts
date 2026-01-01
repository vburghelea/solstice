/**
 * BI Module Queries (Server Functions)
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { OrganizationRole } from "~/lib/auth/guards/org-guard";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import {
  biQueryLogFilterSchema,
  pivotQuerySchema,
  sqlQuerySchema,
  sqlSchemaRequestSchema,
} from "./bi.schemas";
import type { FilterConfig } from "./bi.schemas";
import type { BiQueryLogEntry, QueryContext } from "./bi.types";
import { normalizePivotConfig } from "./bi.utils";
import { loadDatasetData } from "./bi.data";
import { buildPivotResult } from "./engine/pivot-aggregator";
import { filterAccessibleFields, getFieldsToMask } from "./governance";
import { DATASETS, getDataset } from "./semantic";

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

const hasAnalyticsPermission = (permissions: Set<string>, permission: string) =>
  permissions.has(permission) ||
  permissions.has("analytics.admin") ||
  permissions.has("*");

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

const parseLogDateFilter = (value: string, boundary: "start" | "end") => {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (!isDateOnly) return new Date(value);

  const base = new Date(`${value}T00:00:00.000Z`);
  if (boundary === "end") {
    return new Date(base.getTime() + 24 * 60 * 60 * 1000 - 1);
  }
  return base;
};

export const getAvailableDatasets = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .handler(async ({ context }) => {
    await assertFeatureEnabled("sin_analytics");
    const user = requireUser(context);
    const { PermissionService } = await import("~/features/roles/permission.service");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(user.id);
    const roleAssignments = await PermissionService.getUserRoles(user.id);
    const permissions = extractPermissionSet(roleAssignments);

    const contextOrganizationId =
      (context as { organizationId?: string | null } | undefined)?.organizationId ?? null;

    let orgRole: OrganizationRole | null = null;
    if (contextOrganizationId && !isGlobalAdmin) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      const access = await requireOrganizationAccess(
        { userId: user.id, organizationId: contextOrganizationId },
        { roles: ANALYTICS_ROLES },
      );
      orgRole = access.role as OrganizationRole;
    }

    const datasets = Object.values(DATASETS);

    const visible = datasets.filter((dataset) => {
      if (isGlobalAdmin) return true;
      if (!dataset.allowedRoles || dataset.allowedRoles.length === 0) return true;
      if (!orgRole) return false;
      return dataset.allowedRoles.includes(orgRole);
    });

    return {
      datasets: visible.map((dataset) => ({
        id: dataset.id,
        name: dataset.name,
        description: dataset.description ?? "",
        fieldCount: dataset.fields.length,
        canExport: permissions.has("analytics.export") || permissions.has("*"),
      })),
    };
  });

export const getDatasetFields = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(z.object({ datasetId: z.string().min(1) }).parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics");
    const user = requireUser(context);
    const dataset = getDataset(data.datasetId);

    const { badRequest } = await import("~/lib/server/errors");
    if (!dataset) {
      throw badRequest(`Unknown dataset: ${data.datasetId}`);
    }

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(user.id);
    const roleAssignments = await PermissionService.getUserRoles(user.id);
    const permissions = extractPermissionSet(roleAssignments);

    const contextOrganizationId =
      (context as { organizationId?: string | null } | undefined)?.organizationId ?? null;

    let orgRole: OrganizationRole | null = null;
    if (contextOrganizationId && !isGlobalAdmin) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      const access = await requireOrganizationAccess(
        { userId: user.id, organizationId: contextOrganizationId },
        { roles: ANALYTICS_ROLES },
      );
      orgRole = access.role as OrganizationRole;
    }

    const queryContext: QueryContext = {
      userId: user.id,
      organizationId: contextOrganizationId,
      orgRole,
      isGlobalAdmin,
      permissions,
      hasRecentAuth: false,
      timestamp: new Date(),
    };

    const fields = filterAccessibleFields(dataset.fields, queryContext);

    return {
      datasetId: data.datasetId,
      fields: fields.map((field) => ({
        ...field,
        allowGroupBy: field.allowGroupBy ?? false,
        allowAggregate: field.allowAggregate ?? false,
        allowFilter: field.allowFilter ?? false,
        allowSort: field.allowSort ?? false,
        defaultAggregation: field.defaultAggregation ?? null,
      })),
    };
  });

export const getSqlSchema = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(sqlSchemaRequestSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics_sql_workbench");
    const user = requireUser(context);
    const { badRequest, forbidden } = await import("~/lib/server/errors");
    const { PermissionService } = await import("~/features/roles/permission.service");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(user.id);
    const roleAssignments = await PermissionService.getUserRoles(user.id);
    const permissions = extractPermissionSet(roleAssignments);

    if (!hasAnalyticsPermission(permissions, "analytics.sql")) {
      throw forbidden("Analytics SQL permission required");
    }

    const contextOrganizationId =
      (context as { organizationId?: string | null } | undefined)?.organizationId ?? null;

    let orgRole: OrganizationRole | null = null;
    if (contextOrganizationId && !isGlobalAdmin) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      const access = await requireOrganizationAccess(
        { userId: user.id, organizationId: contextOrganizationId },
        { roles: ANALYTICS_ROLES },
      );
      orgRole = access.role as OrganizationRole;
    }

    const datasets = Object.values(DATASETS);
    const visible = datasets.filter((dataset) => {
      if (isGlobalAdmin) return true;
      if (!dataset.allowedRoles || dataset.allowedRoles.length === 0) return true;
      if (!orgRole) return false;
      return dataset.allowedRoles.includes(orgRole);
    });

    const selected = data.datasetId
      ? visible.filter((dataset) => dataset.id === data.datasetId)
      : visible;

    if (data.datasetId && selected.length === 0) {
      throw badRequest(`Unknown dataset: ${data.datasetId}`);
    }

    type SchemaColumnRow = {
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
      ordinal_position: number;
    };

    const viewNames = selected.map((dataset) => `bi_v_${dataset.id}`);
    const columnsByTable = new Map<string, SchemaColumnRow[]>();

    if (viewNames.length > 0) {
      const { getDb } = await import("~/db/server-helpers");
      const { sql } = await import("drizzle-orm");
      const db = await getDb();
      const viewChunks = viewNames.map((viewName) => sql`${viewName}`);

      const rows = await db.execute<SchemaColumnRow>(sql`
        SELECT table_name, column_name, data_type, is_nullable, ordinal_position
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN (${sql.join(viewChunks, sql`, `)})
        ORDER BY table_name, ordinal_position
      `);

      for (const row of Array.isArray(rows) ? rows : []) {
        const existing = columnsByTable.get(row.table_name) ?? [];
        existing.push(row);
        columnsByTable.set(row.table_name, existing);
      }
    }

    const tables = selected.map((dataset) => {
      const viewName = `bi_v_${dataset.id}`;
      const fieldMap = new Map(
        dataset.fields.map((field) => [field.sourceColumn.toLowerCase(), field]),
      );
      const datasetFields = dataset.fields.filter(
        (field) => !field.piiClassification || field.piiClassification === "none",
      );
      const columns = (columnsByTable.get(viewName) ?? []).map((column) => {
        const field = fieldMap.get(column.column_name.toLowerCase());
        return {
          name: column.column_name,
          dataType: column.data_type,
          isNullable: column.is_nullable === "YES",
          label: field?.name ?? null,
          description: field?.description ?? null,
          piiClassification: field?.piiClassification ?? "none",
        };
      });

      const fallbackColumns =
        columns.length > 0
          ? columns
          : datasetFields.map((field) => ({
              name: field.sourceColumn,
              dataType: field.dataType,
              isNullable: false,
              label: field.name,
              description: field.description ?? null,
              piiClassification: field.piiClassification ?? "none",
            }));

      return {
        datasetId: dataset.id,
        datasetName: dataset.name,
        viewName,
        description: dataset.description ?? "",
        columns: fallbackColumns,
      };
    });

    return { tables, isGlobalAdmin };
  });

export const executePivotQuery = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(pivotQuerySchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics");
    const user = requireUser(context);
    const dataset = getDataset(data.datasetId);
    const { badRequest, forbidden } = await import("~/lib/server/errors");

    if (!dataset) {
      throw badRequest(`Unknown dataset: ${data.datasetId}`);
    }

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(user.id);
    const roleAssignments = await PermissionService.getUserRoles(user.id);
    const permissions = extractPermissionSet(roleAssignments);

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
          requestOrganizationId: data.organizationId ?? null,
          filters: data.filters,
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
      hasRecentAuth: false,
      timestamp: new Date(),
    };

    const normalized = normalizePivotConfig({
      dataset,
      rows: data.rows,
      columns: data.columns,
      measures: data.measures,
      filters: data.filters,
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

    const fieldsToMask = getFieldsToMask(accessibleFields, queryContext);

    const rows = await loadDatasetData({
      datasetId: dataset.id,
      columns: normalized.value.selectedFields,
      filters: orgScopeFilters,
      fieldsToMask,
    });

    const pivot = buildPivotResult(rows, {
      rowFields: normalized.value.rowFields,
      columnFields: normalized.value.columnFields,
      measures: normalized.value.measures,
    });

    const { logQuery } = await import("./governance");
    await logQuery({
      context: queryContext,
      queryType: "pivot",
      datasetId: dataset.id,
      pivotQuery: data,
      rowsReturned: rows.length,
      executionTimeMs: 0,
    });

    return {
      pivot,
      rowCount: rows.length,
    };
  });

export const getDashboards = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .handler(async ({ context }) => {
    await assertFeatureEnabled("sin_analytics");
    const user = requireUser(context);
    const { getDb } = await import("~/db/server-helpers");
    const { biDashboards } = await import("~/db/schema");
    const { and, eq, isNull, or, sql } = await import("drizzle-orm");
    const { PermissionService } = await import("~/features/roles/permission.service");

    const db = await getDb();
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(user.id);
    const contextOrganizationId =
      (context as { organizationId?: string | null } | undefined)?.organizationId ?? null;

    if (isGlobalAdmin) {
      return {
        dashboards: await db.select().from(biDashboards),
      };
    }

    if (!contextOrganizationId) {
      return { dashboards: [] };
    }

    const personalCondition = and(
      isNull(biDashboards.organizationId),
      eq(biDashboards.ownerId, user.id),
    );

    const sharedWithCondition = sql`${biDashboards.sharedWith} @> ${JSON.stringify([
      user.id,
    ])}::jsonb`;

    const orgScopedCondition = and(
      eq(biDashboards.organizationId, contextOrganizationId),
      or(
        eq(biDashboards.ownerId, user.id),
        sharedWithCondition,
        eq(biDashboards.isOrgWide, true),
      ),
    );

    return {
      dashboards: await db
        .select()
        .from(biDashboards)
        .where(or(personalCondition, orgScopedCondition)),
    };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(z.object({ dashboardId: z.uuid() }).parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics");
    const user = requireUser(context);
    const { getDb } = await import("~/db/server-helpers");
    const { biDashboards, biDashboardWidgets } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { PermissionService } = await import("~/features/roles/permission.service");

    const db = await getDb();
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(user.id);
    const [dashboard] = await db
      .select()
      .from(biDashboards)
      .where(eq(biDashboards.id, data.dashboardId))
      .limit(1);

    if (!dashboard) return null;

    if (!isGlobalAdmin) {
      const contextOrganizationId =
        (context as { organizationId?: string | null } | undefined)?.organizationId ??
        null;

      const canAccess =
        dashboard.ownerId === user.id ||
        dashboard.isOrgWide ||
        (dashboard.sharedWith ?? []).includes(user.id) ||
        (contextOrganizationId && dashboard.organizationId === contextOrganizationId);

      if (!canAccess) return null;
    }

    const widgets = await db
      .select()
      .from(biDashboardWidgets)
      .where(eq(biDashboardWidgets.dashboardId, dashboard.id));

    return {
      ...dashboard,
      widgets,
    };
  });

export const executeSqlQuery = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(sqlQuerySchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics_sql_workbench");
    const user = requireUser(context);
    const { forbidden } = await import("~/lib/server/errors");
    const { PermissionService } = await import("~/features/roles/permission.service");

    const isGlobalAdmin = await PermissionService.isGlobalAdmin(user.id);
    const roleAssignments = await PermissionService.getUserRoles(user.id);
    const permissions = extractPermissionSet(roleAssignments);

    if (!hasAnalyticsPermission(permissions, "analytics.sql")) {
      throw forbidden("Analytics SQL permission required");
    }

    const contextOrganizationId =
      (context as { organizationId?: string | null } | undefined)?.organizationId ?? null;

    let orgRole: OrganizationRole | null = null;
    if (contextOrganizationId && !isGlobalAdmin) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      const access = await requireOrganizationAccess(
        { userId: user.id, organizationId: contextOrganizationId },
        { roles: ANALYTICS_ROLES },
      );
      orgRole = access.role as OrganizationRole;
    }

    const queryContext: QueryContext = {
      userId: user.id,
      organizationId: contextOrganizationId,
      orgRole,
      isGlobalAdmin,
      permissions,
      hasRecentAuth: false,
      timestamp: new Date(),
    };

    const { executeSqlWorkbenchQuery } = await import("./bi.sql-executor");
    const sqlParams = {
      sqlText: data.sql,
      parameters: data.parameters ?? {},
      context: queryContext,
      ...(data.datasetId ? { datasetId: data.datasetId } : {}),
    };

    return executeSqlWorkbenchQuery(sqlParams);
  });

export const listBiQueryLogs = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(biQueryLogFilterSchema.parse)
  .handler(async ({ data, context }): Promise<BiQueryLogEntry[]> => {
    await assertFeatureEnabled("sin_admin_audit");
    const user = requireUser(context);
    const { forbidden } = await import("~/lib/server/errors");
    const { PermissionService } = await import("~/features/roles/permission.service");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(user.id);

    const { getDb } = await import("~/db/server-helpers");
    const { biQueryLog, organizationMembers } = await import("~/db/schema");
    const { and, desc, eq, gte, inArray, lte } = await import("drizzle-orm");
    const { ORG_ADMIN_ROLES } = await import("~/lib/auth/guards/org-guard");

    const db = await getDb();
    const conditions = [];

    if (!isGlobalAdmin) {
      const adminMemberships = await db
        .select({ organizationId: organizationMembers.organizationId })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.userId, user.id),
            eq(organizationMembers.status, "active"),
            inArray(organizationMembers.role, ORG_ADMIN_ROLES),
          ),
        );

      const allowedOrgIds = adminMemberships.map((row) => row.organizationId);
      if (allowedOrgIds.length === 0) {
        throw forbidden("Admin access required");
      }

      if (data.organizationId) {
        if (!allowedOrgIds.includes(data.organizationId)) {
          throw forbidden("Insufficient organization role");
        }
        conditions.push(eq(biQueryLog.organizationId, data.organizationId));
      } else {
        conditions.push(inArray(biQueryLog.organizationId, allowedOrgIds));
      }
    } else if (data.organizationId) {
      conditions.push(eq(biQueryLog.organizationId, data.organizationId));
    }

    if (data.userId) {
      conditions.push(eq(biQueryLog.userId, data.userId));
    }

    if (data.queryType) {
      conditions.push(eq(biQueryLog.queryType, data.queryType));
    }

    if (data.datasetId) {
      conditions.push(eq(biQueryLog.datasetId, data.datasetId));
    }

    if (data.from) {
      conditions.push(gte(biQueryLog.createdAt, parseLogDateFilter(data.from, "start")));
    }

    if (data.to) {
      conditions.push(lte(biQueryLog.createdAt, parseLogDateFilter(data.to, "end")));
    }

    const rows = (await db
      .select()
      .from(biQueryLog)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(biQueryLog.createdAt))
      .limit(data.limit ?? 100)) as BiQueryLogEntry[];

    return rows;
  });
