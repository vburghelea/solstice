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
  fieldValueSuggestionsSchema,
  filterSchema,
  pivotQuerySchema,
  sqlQuerySchema,
  sqlSchemaRequestSchema,
} from "./bi.schemas";
import type { FilterConfig, PivotQuery } from "./bi.schemas";
import type { BiQueryLogEntry, QueryContext } from "./bi.types";
import { buildAllowedFilters, normalizePivotConfig } from "./bi.utils";
import { buildPivotCacheKey, getPivotCache, setPivotCache } from "./cache/pivot-cache";
import { loadDatasetData } from "./bi.data";
import { buildPivotResult } from "./engine/pivot-aggregator";
import {
  buildFieldExpression,
  buildFilterExpression,
  buildPivotResultFromSqlRows,
  buildPivotSqlPlan,
} from "./engine/pivot-sql-compiler";
import { normalizeFilter, type NormalizedFilter } from "./engine/filters";
import {
  acquireConcurrencySlot,
  filterAccessibleFields,
  getFieldsToMask,
} from "./governance";
import { assertPivotCardinality, QUERY_GUARDRAILS } from "./governance/query-guardrails";
import { DATASETS, getDataset } from "./semantic";
import { getMetric } from "./semantic/metrics.config";

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
        freshness: dataset.freshness ?? null,
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

export const getFieldValueSuggestions = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(fieldValueSuggestionsSchema.parse)
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
    if (contextOrganizationId && !isGlobalAdmin) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      const access = await requireOrganizationAccess(
        { userId: user.id, organizationId: contextOrganizationId },
        { roles: ANALYTICS_ROLES },
      );
      orgRole = access.role as OrganizationRole;
    }

    if (!isGlobalAdmin && dataset.allowedRoles && dataset.allowedRoles.length > 0) {
      if (!orgRole || !dataset.allowedRoles.includes(orgRole)) {
        throw forbidden("Dataset access denied");
      }
    }

    const scopedFilters = (data.filters ?? []).filter(
      (filter) => !filter.datasetId || filter.datasetId === dataset.id,
    );
    let scopedOrganizationId: string | null = null;
    try {
      scopedOrganizationId =
        ensureOrgScope({
          datasetOrgField: dataset.orgScopeColumn ?? "organizationId",
          datasetRequiresOrg: dataset.requiresOrgScope,
          isGlobalAdmin,
          contextOrganizationId,
          requestOrganizationId: data.organizationId ?? null,
          filters: scopedFilters,
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

    const accessibleFields = filterAccessibleFields(dataset.fields, queryContext);
    const targetField = accessibleFields.find((field) => field.id === data.fieldId);
    if (!targetField) {
      throw forbidden(`Field access denied: ${data.fieldId}`);
    }

    if (!targetField.allowFilter || targetField.dataType === "json") {
      return { values: [] };
    }

    const fieldsToMask = getFieldsToMask(accessibleFields, queryContext);
    if (fieldsToMask.includes(targetField.id)) {
      return { values: [] };
    }

    const allowedFilters = buildAllowedFilters(dataset);
    const normalizedFilters: NormalizedFilter[] = [];
    const filtersToApply = scopedFilters.filter((filter) => {
      if (filter.field === targetField.id) return false;
      return true;
    });

    for (const filter of filtersToApply) {
      try {
        normalizedFilters.push(normalizeFilter(filter, allowedFilters));
      } catch {
        continue;
      }
    }

    if (dataset.requiresOrgScope && scopedOrganizationId) {
      normalizedFilters.push({
        field: dataset.orgScopeColumn ?? "organizationId",
        operator: "eq",
        value: scopedOrganizationId,
      });
    }

    const { sql } = await import("drizzle-orm");
    const fieldExpr = buildFieldExpression(dataset, targetField.id);
    const whereConditions = normalizedFilters.map((filter) =>
      buildFilterExpression(filter, dataset),
    );
    whereConditions.push(sql`${fieldExpr} IS NOT NULL`);

    const search = data.search?.trim();
    if (search) {
      whereConditions.push(
        sql`CAST(${fieldExpr} AS TEXT) ILIKE ${sql.param(`%${search}%`)}`,
      );
    }

    const whereClause =
      whereConditions.length > 0
        ? sql`WHERE ${sql.join(whereConditions, sql` AND `)}`
        : sql``;

    const MAX_SUGGESTIONS = 50;
    const limit = Math.min(data.limit ?? 25, MAX_SUGGESTIONS);
    const quoteIdentifier = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const viewName = quoteIdentifier(`bi_v_${dataset.id}`);
    const baseAlias = quoteIdentifier("base");

    const formatSettingValue = (value: string | number | boolean) => {
      if (typeof value === "number") {
        return Number.isFinite(value) ? String(value) : "0";
      }
      if (typeof value === "boolean") {
        return value ? "true" : "false";
      }
      return `'${String(value).replace(/'/g, "''")}'`;
    };

    const release = acquireConcurrencySlot(user.id, scopedOrganizationId);
    try {
      const { getDb } = await import("~/db/server-helpers");
      const db = await getDb();

      const result = await db.transaction(async (tx) => {
        await tx.execute(sql.raw("SET LOCAL ROLE bi_readonly"));
        await tx.execute(
          sql.raw(
            `SET LOCAL app.org_id = ${formatSettingValue(scopedOrganizationId ?? "")}`,
          ),
        );
        await tx.execute(
          sql.raw(
            `SET LOCAL app.is_global_admin = ${formatSettingValue(
              String(isGlobalAdmin),
            )}`,
          ),
        );
        await tx.execute(
          sql.raw(
            `SET LOCAL statement_timeout = ${formatSettingValue(
              QUERY_GUARDRAILS.statementTimeoutMs,
            )}`,
          ),
        );

        return tx.execute<Record<string, unknown>>(sql`
          SELECT ${fieldExpr} AS value, COUNT(*) AS count
          FROM ${sql.raw(`${viewName} AS ${baseAlias}`)}
          ${whereClause}
          GROUP BY ${fieldExpr}
          ORDER BY count DESC
          LIMIT ${sql.param(limit)}
        `);
      });

      const rows = Array.isArray(result)
        ? result
        : ((result as { rows?: Array<Record<string, unknown>> }).rows ?? []);

      const values = rows
        .map((row) => {
          const value = row["value"];
          if (value === null || value === undefined) return null;
          const count = row["count"];
          return {
            value,
            count: typeof count === "number" ? count : Number(count ?? 0),
          };
        })
        .filter((entry): entry is { value: string | number | boolean; count: number } =>
          Boolean(entry),
        );

      return { values };
    } finally {
      release();
    }
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

const runPivotQuery = async (params: {
  data: PivotQuery;
  context: unknown;
  user: { id: string };
}) => {
  await assertFeatureEnabled("sin_analytics");
  const { data, context, user } = params;
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

  const requestedMetricIds = data.measures
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
  const rawLimit = Math.min(
    data.limit ?? QUERY_GUARDRAILS.maxRowsUi,
    QUERY_GUARDRAILS.maxRowsUi,
  );
  const pivotLimit = QUERY_GUARDRAILS.maxPivotCells + 1;

  const cacheKey = buildPivotCacheKey({
    userId: user.id,
    organizationId: scopedOrganizationId,
    datasetId: dataset.id,
    query: data,
  });
  const cached = getPivotCache(cacheKey);
  if (cached) {
    const { logQuery } = await import("./governance");
    await logQuery({
      context: queryContext,
      queryType: "pivot",
      datasetId: dataset.id,
      pivotQuery: data,
      rowsReturned: cached.rowCount,
      executionTimeMs: 0,
    });
    return {
      pivot: cached.pivot,
      rowCount: cached.rowCount,
    };
  }

  const startedAt = Date.now();
  let pivotResult: ReturnType<typeof buildPivotResult>;
  let rowsReturned = 0;

  const formatSettingValue = (value: string | number | boolean) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? String(value) : "0";
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    return `'${String(value).replace(/'/g, "''")}'`;
  };

  const release = acquireConcurrencySlot(user.id, scopedOrganizationId);
  try {
    const plan = buildPivotSqlPlan({
      dataset,
      rowFields: normalized.value.rowFields,
      columnFields: normalized.value.columnFields,
      measures: normalized.value.measures,
      filters: orgScopeFilters,
      limit: pivotLimit,
      maskedFieldIds: new Set(fieldsToMask),
    });

    const { getDb } = await import("~/db/server-helpers");
    const { sql } = await import("drizzle-orm");
    const db = await getDb();

    try {
      const result = await db.transaction(async (tx) => {
        await tx.execute(sql.raw("SET LOCAL ROLE bi_readonly"));
        await tx.execute(
          sql.raw(
            `SET LOCAL app.org_id = ${formatSettingValue(scopedOrganizationId ?? "")}`,
          ),
        );
        await tx.execute(
          sql.raw(
            `SET LOCAL app.is_global_admin = ${formatSettingValue(
              String(isGlobalAdmin),
            )}`,
          ),
        );
        await tx.execute(
          sql.raw(
            `SET LOCAL statement_timeout = ${formatSettingValue(
              QUERY_GUARDRAILS.statementTimeoutMs,
            )}`,
          ),
        );

        return tx.execute<Record<string, unknown>>(plan.sql);
      });

      const rows = Array.isArray(result)
        ? result
        : ((result as { rows?: Array<Record<string, unknown>> }).rows ?? []);

      if (rows.length > QUERY_GUARDRAILS.maxPivotCells) {
        throw new Error("Too many categories; add filters or fewer dimensions.");
      }

      rowsReturned = rows.length;
      pivotResult = buildPivotResultFromSqlRows({
        rows,
        rowDimensions: plan.rowDimensions,
        columnDimensions: plan.columnDimensions,
        measures: normalized.value.measures,
        measureAliases: plan.measures,
      });
    } catch (error) {
      const isMissingView =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "42P01";
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const shouldFallback =
        isMissingView ||
        message.includes("relation") ||
        message.includes("bi_v_") ||
        message.includes("does not exist");

      if (!shouldFallback) {
        throw error;
      }

      const rows = await loadDatasetData({
        datasetId: dataset.id,
        columns: normalized.value.selectedFields,
        filters: orgScopeFilters,
        fieldsToMask,
        limit: rawLimit + 1,
      });

      if (rows.length > rawLimit) {
        throw new Error("Query returned too many rows; add filters.");
      }

      rowsReturned = rows.length;
      pivotResult = buildPivotResult(rows, {
        rowFields: normalized.value.rowFields,
        columnFields: normalized.value.columnFields,
        measures: normalized.value.measures,
      });
    }
  } finally {
    release();
  }

  assertPivotCardinality(pivotResult.rows.length, pivotResult.columnKeys.length);

  const executionTimeMs = Date.now() - startedAt;
  setPivotCache(cacheKey, {
    datasetId: dataset.id,
    pivot: pivotResult,
    rowCount: rowsReturned,
  });

  const { logQuery } = await import("./governance");
  await logQuery({
    context: queryContext,
    queryType: "pivot",
    datasetId: dataset.id,
    pivotQuery: data,
    rowsReturned,
    executionTimeMs,
  });

  return {
    pivot: pivotResult,
    rowCount: rowsReturned,
  };
};

export const executePivotQuery = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(pivotQuerySchema.parse)
  .handler(async ({ data, context }) => {
    const user = requireUser(context);
    return runPivotQuery({ data, context, user });
  });

const pivotBatchSchema = z.object({
  queries: z.array(
    z.object({
      widgetId: z.string().min(1),
      query: pivotQuerySchema,
    }),
  ),
});

export const executePivotBatch = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(pivotBatchSchema.parse)
  .handler(async ({ data, context }) => {
    const user = requireUser(context);
    const results: Array<{
      widgetId: string;
      pivot?: ReturnType<typeof buildPivotResult>;
      rowCount?: number;
      error?: string;
    }> = [];

    for (const entry of data.queries) {
      try {
        const result = await runPivotQuery({
          data: entry.query,
          context,
          user,
        });
        results.push({
          widgetId: entry.widgetId,
          pivot: result.pivot,
          rowCount: result.rowCount,
        });
      } catch (error) {
        results.push({
          widgetId: entry.widgetId,
          error: error instanceof Error ? error.message : "Query failed",
        });
      }
    }

    return { results };
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
