import type { FilterConfig, PivotQuery } from "../bi.schemas";
import { loadDatasetData } from "../bi.data";
import { buildPivotResult } from "./pivot-aggregator";
import { buildPivotResultFromSqlRows, buildPivotSqlPlan } from "./pivot-sql-compiler";
import { buildPivotCacheKey, getPivotCache, setPivotCache } from "../cache/pivot-cache";
import { normalizePivotConfig } from "../bi.utils";
import {
  acquireConcurrencySlot,
  filterAccessibleFields,
  getFieldsToMask,
} from "../governance";
import { assertPivotCardinality, QUERY_GUARDRAILS } from "../governance/query-guardrails";
import { formatSetLocalValue } from "../governance/set-local";
import { getDataset } from "../semantic";
import { getMetric } from "../semantic/metrics.config";
import { buildQueryContext } from "../governance/query-context";

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

export type ExecutePivotQueryParams = {
  query: PivotQuery;
  context: unknown;
  userId: string;
  source?: string;
};

export const executePivotQueryInternal = async (params: ExecutePivotQueryParams) => {
  const { badRequest, forbidden } = await import("~/lib/server/errors");
  const dataset = getDataset(params.query.datasetId);
  if (!dataset) {
    throw badRequest(`Unknown dataset: ${params.query.datasetId}`);
  }

  const queryContextResult = await buildQueryContext({
    context: params.context,
    userId: params.userId,
    ...(dataset.requiresOrgScope !== undefined
      ? { requireOrgAccess: dataset.requiresOrgScope }
      : {}),
  });
  const { contextOrganizationId, isGlobalAdmin, orgRole, permissions } =
    queryContextResult;

  if (!isGlobalAdmin && dataset.allowedRoles && dataset.allowedRoles.length > 0) {
    if (!orgRole || !dataset.allowedRoles.includes(orgRole)) {
      throw forbidden("Dataset access denied");
    }
  }

  const requestedMetricIds = params.query.measures
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

  let scopedOrganizationId: string | null = null;
  try {
    scopedOrganizationId =
      ensureOrgScope({
        datasetOrgField: dataset.orgScopeColumn ?? "organizationId",
        datasetRequiresOrg: dataset.requiresOrgScope,
        isGlobalAdmin,
        contextOrganizationId,
        requestOrganizationId: params.query.organizationId ?? null,
        filters: params.query.filters,
      }).scopedOrganizationId ?? null;
  } catch (error) {
    throw forbidden(error instanceof Error ? error.message : "Org scoping failed");
  }

  const queryContext = {
    ...queryContextResult.queryContext,
    organizationId: scopedOrganizationId,
  };

  const normalized = normalizePivotConfig({
    dataset,
    rows: params.query.rows,
    columns: params.query.columns,
    measures: params.query.measures,
    filters: params.query.filters,
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
    params.query.limit ?? QUERY_GUARDRAILS.maxRowsUi,
    QUERY_GUARDRAILS.maxRowsUi,
  );
  const pivotLimit = QUERY_GUARDRAILS.maxPivotCells + 1;

  const cacheKey = buildPivotCacheKey({
    userId: params.userId,
    organizationId: scopedOrganizationId,
    datasetId: dataset.id,
    query: params.query,
  });
  const cached = await getPivotCache(cacheKey);
  if (cached) {
    const { logQuery } = await import("../governance");
    await logQuery({
      context: queryContext,
      queryType: "pivot",
      datasetId: dataset.id,
      pivotQuery: params.query,
      parameters: {
        cacheStatus: "hit",
        ...(params.source ? { source: params.source } : {}),
      },
      rowsReturned: cached.rowCount,
      executionTimeMs: 0,
    });
    return {
      pivot: cached.pivot,
      rowCount: cached.rowCount,
      executionTimeMs: 0,
    };
  }

  const startedAt = Date.now();
  let pivotResult: ReturnType<typeof buildPivotResult>;
  let rowsReturned = 0;

  const release = await acquireConcurrencySlot(params.userId, scopedOrganizationId);
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
            `SET LOCAL app.org_id = ${formatSetLocalValue(scopedOrganizationId ?? "")}`,
          ),
        );
        await tx.execute(
          sql.raw(
            `SET LOCAL app.is_global_admin = ${formatSetLocalValue(isGlobalAdmin)}`,
          ),
        );
        await tx.execute(
          sql.raw(
            `SET LOCAL statement_timeout = ${formatSetLocalValue(
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
    await release();
  }

  assertPivotCardinality(pivotResult.rows.length, pivotResult.columnKeys.length);

  const executionTimeMs = Date.now() - startedAt;
  await setPivotCache(cacheKey, {
    datasetId: dataset.id,
    pivot: pivotResult,
    rowCount: rowsReturned,
  });

  const { logQuery } = await import("../governance");
  await logQuery({
    context: queryContext,
    queryType: "pivot",
    datasetId: dataset.id,
    pivotQuery: params.query,
    parameters: {
      cacheStatus: "miss",
      ...(params.source ? { source: params.source } : {}),
    },
    rowsReturned,
    executionTimeMs,
  });

  return {
    pivot: pivotResult,
    rowCount: rowsReturned,
    executionTimeMs,
  };
};
