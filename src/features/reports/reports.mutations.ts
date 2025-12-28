import { createServerFn } from "@tanstack/react-start";
import type { FormDefinition } from "~/features/forms/forms.schemas";
import type { OrganizationRole } from "~/lib/auth/guards/org-guard";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { zod$ } from "~/lib/server/fn-utils";
import type { JsonRecord, JsonValue } from "~/shared/lib/json";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { DATA_SOURCE_CONFIG, type ReportDataSource } from "./reports.config";
import {
  createSavedReportSchema,
  deleteSavedReportSchema,
  exportReportSchema,
  pivotExportSchema,
  pivotQuerySchema,
  updateSavedReportSchema,
} from "./reports.schemas";
import {
  normalizeReportQuery,
  type NormalizedFilters,
  type NormalizedSort,
} from "./reports.validation";

const ANALYTICS_ROLES: OrganizationRole[] = ["owner", "admin", "reporter"];
const ORG_WIDE_ROLES: OrganizationRole[] = ["owner", "admin"];

const SENSITIVE_FIELDS = [
  "email",
  "phone",
  "dateOfBirth",
  "emergencyContact",
  "emergencyContactPhone",
  "emergencyContactEmail",
];

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

const canViewSensitiveFields = (permissions: Set<string>) =>
  permissions.has("*") ||
  permissions.has("pii.read") ||
  permissions.has("pii:read") ||
  permissions.has("data.pii.read");

const applyFieldLevelAcl = (
  rows: Array<Record<string, unknown>>,
  opts: { canViewSensitiveFields: boolean },
) => {
  if (opts.canViewSensitiveFields) return rows;
  return rows.map((row) => {
    const next = { ...row };
    for (const field of SENSITIVE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(next, field)) {
        next[field] = "***";
      }
    }
    return next;
  });
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
  // For objects, recursively serialize
  if (typeof value === "object") {
    const result: Record<string, JsonValue> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = serializeFilterValue(v);
    }
    return result;
  }
  return null;
};

const serializeFilters = (filters: NormalizedFilters): JsonRecord => {
  const serialized: JsonRecord = {};
  for (const [field, filter] of Object.entries(filters)) {
    serialized[field] = {
      operator: filter.operator,
      value: serializeFilterValue(filter.value),
    };
  }
  return serialized;
};

const applyOrganizationScope = (
  filters: NormalizedFilters,
  dataSource: ReportDataSource,
  organizationId: string | null,
): NormalizedFilters => {
  if (!organizationId) return filters;
  const scopedField = dataSource === "organizations" ? "id" : "organizationId";
  return {
    ...filters,
    [scopedField]: { operator: "eq" as const, value: organizationId },
  };
};

const shapeRows = (rows: Array<Record<string, unknown>>, columns: string[]) =>
  rows.map((row) => {
    const next: Record<string, unknown> = {};
    for (const column of columns) {
      next[column] = row[column];
    }
    return next;
  });

const redactFormSubmissionPayloads = async (params: {
  rows: Array<Record<string, unknown>>;
  canViewSensitiveFields: boolean;
}) => {
  if (params.canViewSensitiveFields) return params.rows;
  const { getDb } = await import("~/db/server-helpers");
  const { formVersions } = await import("~/db/schema");
  const { inArray } = await import("drizzle-orm");

  const versionIds = Array.from(
    new Set(
      params.rows
        .map((row) => row["formVersionId"])
        .filter(
          (value): value is string => typeof value === "string" && value.length > 0,
        ),
    ),
  );

  if (versionIds.length === 0) return params.rows;

  const db = await getDb();
  const versions = await db
    .select({
      id: formVersions.id,
      definition: formVersions.definition,
    })
    .from(formVersions)
    .where(inArray(formVersions.id, versionIds));

  const definitionById = new Map<string, FormDefinition>();
  for (const version of versions) {
    if (version.definition) {
      definitionById.set(version.id, version.definition as FormDefinition);
    }
  }

  return params.rows.map((row) => {
    const payload = row["payload"];
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return row;
    }

    const definition = definitionById.get(String(row["formVersionId"]));
    if (!definition) {
      return { ...row, payload: "[REDACTED]" };
    }

    const fieldsByKey = new Map(definition.fields.map((field) => [field.key, field]));
    const redacted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(payload)) {
      const field = fieldsByKey.get(key);
      const classification = field?.dataClassification ?? "none";
      const isPii = classification !== "none";

      if (isPii || !field) {
        redacted[key] = "[REDACTED]";
      } else {
        redacted[key] = value;
      }
    }

    return { ...row, payload: redacted };
  });
};

const ensureSharedWithMembers = async ({
  organizationId,
  sharedWith,
}: {
  organizationId: string | null;
  sharedWith: string[];
}) => {
  if (sharedWith.length === 0) return;
  if (!organizationId) {
    const { badRequest } = await import("~/lib/server/errors");
    throw badRequest("Shared reports require an organization scope");
  }

  const { getDb } = await import("~/db/server-helpers");
  const { organizationMembers } = await import("~/db/schema");
  const { and, eq, inArray } = await import("drizzle-orm");
  const db = await getDb();

  const members = await db
    .select({ userId: organizationMembers.userId })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.status, "active"),
        inArray(organizationMembers.userId, sharedWith),
      ),
    );

  const memberIds = new Set(members.map((member) => member.userId));
  const invalid = sharedWith.filter((userId) => !memberIds.has(userId));
  if (invalid.length > 0) {
    const { badRequest } = await import("~/lib/server/errors");
    throw badRequest("Cannot share reports outside the organization");
  }
};

const loadReportData = async (params: {
  query: {
    dataSource: ReportDataSource;
    columns: string[];
    filters: NormalizedFilters;
    sort: NormalizedSort | null;
  };
  organizationId: string | null;
  canViewSensitiveFields: boolean;
}) => {
  const { getDb } = await import("~/db/server-helpers");
  const { and, asc, between, desc, eq, gt, gte, inArray, lt, lte, ne } =
    await import("drizzle-orm");
  const { organizations, reportingSubmissions, formSubmissions } =
    await import("~/db/schema");

  const db = await getDb();
  const filters = applyOrganizationScope(
    params.query.filters,
    params.query.dataSource,
    params.organizationId,
  );

  const buildConditions = (
    columns: Record<string, unknown>,
    scopedFilters: NormalizedFilters,
  ) => {
    const conditions = [];
    for (const [field, filter] of Object.entries(scopedFilters)) {
      const column = columns[field];
      if (!column) continue;

      switch (filter.operator) {
        case "eq":
          conditions.push(eq(column as never, filter.value as never));
          break;
        case "neq":
          conditions.push(ne(column as never, filter.value as never));
          break;
        case "gt":
          conditions.push(gt(column as never, filter.value as never));
          break;
        case "gte":
          conditions.push(gte(column as never, filter.value as never));
          break;
        case "lt":
          conditions.push(lt(column as never, filter.value as never));
          break;
        case "lte":
          conditions.push(lte(column as never, filter.value as never));
          break;
        case "in":
          conditions.push(inArray(column as never, filter.value as never[]));
          break;
        case "between": {
          const [start, end] = filter.value as [unknown, unknown];
          conditions.push(between(column as never, start as never, end as never));
          break;
        }
        default:
          break;
      }
    }
    return conditions.length ? and(...conditions) : undefined;
  };

  const buildOrderBy = (columns: Record<string, unknown>) => {
    if (!params.query.sort) return undefined;
    const column = columns[params.query.sort.field];
    if (!column) return undefined;
    return params.query.sort.direction === "asc"
      ? asc(column as never)
      : desc(column as never);
  };

  if (params.query.dataSource === "organizations") {
    const columnMap = {
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      type: organizations.type,
      parentOrgId: organizations.parentOrgId,
      status: organizations.status,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
    } as const;

    const selection = Object.fromEntries(
      params.query.columns.map((column) => [
        column,
        columnMap[column as keyof typeof columnMap],
      ]),
    );

    const baseQuery = db
      .select(selection)
      .from(organizations)
      .where(buildConditions(columnMap, filters));
    const orderBy = buildOrderBy(columnMap);
    const rows = orderBy ? await baseQuery.orderBy(orderBy) : await baseQuery;

    const sanitized = applyFieldLevelAcl(rows as Array<Record<string, unknown>>, {
      canViewSensitiveFields: params.canViewSensitiveFields,
    });

    return {
      rows: shapeRows(sanitized, params.query.columns),
      columns: params.query.columns,
      filtersUsed: filters,
    };
  }

  if (params.query.dataSource === "reporting_submissions") {
    const columnMap = {
      id: reportingSubmissions.id,
      taskId: reportingSubmissions.taskId,
      organizationId: reportingSubmissions.organizationId,
      formSubmissionId: reportingSubmissions.formSubmissionId,
      status: reportingSubmissions.status,
      submittedAt: reportingSubmissions.submittedAt,
      submittedBy: reportingSubmissions.submittedBy,
      reviewedAt: reportingSubmissions.reviewedAt,
      reviewedBy: reportingSubmissions.reviewedBy,
      reviewNotes: reportingSubmissions.reviewNotes,
      createdAt: reportingSubmissions.createdAt,
      updatedAt: reportingSubmissions.updatedAt,
    } as const;

    const selection = Object.fromEntries(
      params.query.columns.map((column) => [
        column,
        columnMap[column as keyof typeof columnMap],
      ]),
    );

    const baseQuery = db
      .select(selection)
      .from(reportingSubmissions)
      .where(buildConditions(columnMap, filters));
    const orderBy = buildOrderBy(columnMap);
    const rows = orderBy ? await baseQuery.orderBy(orderBy) : await baseQuery;

    const sanitized = applyFieldLevelAcl(rows as Array<Record<string, unknown>>, {
      canViewSensitiveFields: params.canViewSensitiveFields,
    });

    return {
      rows: shapeRows(sanitized, params.query.columns),
      columns: params.query.columns,
      filtersUsed: filters,
    };
  }

  if (params.query.dataSource === "form_submissions") {
    const columnMap = {
      id: formSubmissions.id,
      formId: formSubmissions.formId,
      formVersionId: formSubmissions.formVersionId,
      organizationId: formSubmissions.organizationId,
      importJobId: formSubmissions.importJobId,
      submitterId: formSubmissions.submitterId,
      status: formSubmissions.status,
      payload: formSubmissions.payload,
      completenessScore: formSubmissions.completenessScore,
      missingFields: formSubmissions.missingFields,
      validationErrors: formSubmissions.validationErrors,
      submittedAt: formSubmissions.submittedAt,
      reviewedBy: formSubmissions.reviewedBy,
      reviewedAt: formSubmissions.reviewedAt,
      reviewNotes: formSubmissions.reviewNotes,
      createdAt: formSubmissions.createdAt,
      updatedAt: formSubmissions.updatedAt,
    } as const;

    const shouldIncludePayload = params.query.columns.includes("payload");
    const queryColumns = [...params.query.columns];
    if (shouldIncludePayload && !queryColumns.includes("formVersionId")) {
      queryColumns.push("formVersionId");
    }

    const selection = Object.fromEntries(
      queryColumns.map((column) => [column, columnMap[column as keyof typeof columnMap]]),
    );

    const baseQuery = db
      .select(selection)
      .from(formSubmissions)
      .where(buildConditions(columnMap, filters));
    const orderBy = buildOrderBy(columnMap);
    const rows = orderBy ? await baseQuery.orderBy(orderBy) : await baseQuery;

    let sanitized = applyFieldLevelAcl(rows as Array<Record<string, unknown>>, {
      canViewSensitiveFields: params.canViewSensitiveFields,
    });

    if (shouldIncludePayload) {
      sanitized = await redactFormSubmissionPayloads({
        rows: sanitized,
        canViewSensitiveFields: params.canViewSensitiveFields,
      });
    }

    return {
      rows: shapeRows(sanitized, params.query.columns),
      columns: params.query.columns,
      filtersUsed: filters,
    };
  }

  return { rows: [], columns: [], filtersUsed: filters };
};

type PivotMeasureMeta = {
  field: string | null;
  aggregation: "count" | "sum" | "avg" | "min" | "max";
  key: string;
  label: string;
};

type PivotResult = {
  rowFields: string[];
  columnFields: string[];
  measures: PivotMeasureMeta[];
  columnKeys: Array<{ key: string; label: string; values: Record<string, string> }>;
  rows: Array<{
    key: string;
    values: Record<string, string>;
    cells: Record<string, Record<string, number | null>>;
  }>;
};

const normalizePivotConfig = async (params: {
  dataSource: ReportDataSource;
  rows?: string[] | undefined;
  columns?: string[] | undefined;
  measures: Array<{
    field?: string | undefined;
    aggregation: PivotMeasureMeta["aggregation"];
  }>;
  filters?: JsonRecord | undefined;
}) => {
  const rowFields = Array.from(new Set(params.rows ?? []));
  const columnFields = Array.from(new Set(params.columns ?? []));
  const { badRequest } = await import("~/lib/server/errors");

  const measures: PivotMeasureMeta[] = params.measures.map((measure) => {
    if (measure.aggregation !== "count" && !measure.field) {
      throw badRequest("Measures require a field for non-count aggregations.");
    }
    const field = measure.field ?? null;
    const key = `${measure.aggregation}:${field ?? "count"}`;
    const label =
      measure.aggregation === "count"
        ? "Count"
        : `${measure.aggregation.toUpperCase()}(${field ?? "-"})`;
    return { field, aggregation: measure.aggregation, key, label };
  });

  const measureFields = measures
    .map((measure) => measure.field)
    .filter((field): field is string => Boolean(field));
  const columns = Array.from(new Set([...rowFields, ...columnFields, ...measureFields]));

  if (columns.length === 0) {
    const fallback = DATA_SOURCE_CONFIG[params.dataSource]?.allowedColumns[0];
    if (!fallback) {
      throw badRequest("No fields available for pivot query.");
    }
    columns.push(fallback);
  }

  const query = normalizeReportQuery({
    dataSource: params.dataSource,
    filters: params.filters,
    columns,
    sort: undefined,
  });

  return { query, rowFields, columnFields, measures };
};

const toPivotKey = (fields: string[], row: Record<string, unknown>) => {
  if (fields.length === 0) return "__total__";
  return fields.map((field) => String(row[field] ?? "")).join("||");
};

const toPivotValues = (fields: string[], row: Record<string, unknown>) => {
  const values: Record<string, string> = {};
  for (const field of fields) {
    const value = row[field];
    if (value === null || value === undefined) {
      values[field] = "";
    } else if (typeof value === "string") {
      values[field] = value;
    } else if (typeof value === "number" || typeof value === "boolean") {
      values[field] = String(value);
    } else {
      values[field] = JSON.stringify(value);
    }
  }
  return values;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const buildPivotResult = (
  rows: Array<Record<string, unknown>>,
  config: {
    rowFields: string[];
    columnFields: string[];
    measures: PivotMeasureMeta[];
  },
): PivotResult => {
  const columnKeyMap = new Map<string, Record<string, string>>();
  const rowMap = new Map<
    string,
    {
      values: Record<string, string>;
      cells: Record<
        string,
        Record<
          string,
          { sum: number; count: number; min: number | null; max: number | null }
        >
      >;
    }
  >();

  for (const row of rows) {
    const rowKey = toPivotKey(config.rowFields, row);
    const columnKey = toPivotKey(config.columnFields, row);
    const columnValues = toPivotValues(config.columnFields, row);

    if (!columnKeyMap.has(columnKey)) {
      columnKeyMap.set(columnKey, columnValues);
    }

    const rowEntry = rowMap.get(rowKey) ?? {
      values: toPivotValues(config.rowFields, row),
      cells: {},
    };

    if (!rowEntry.cells[columnKey]) {
      rowEntry.cells[columnKey] = {};
    }

    for (const measure of config.measures) {
      if (!rowEntry.cells[columnKey][measure.key]) {
        rowEntry.cells[columnKey][measure.key] = {
          sum: 0,
          count: 0,
          min: null,
          max: null,
        };
      }

      const bucket = rowEntry.cells[columnKey][measure.key];
      if (measure.aggregation === "count") {
        bucket.sum += 1;
        bucket.count += 1;
        continue;
      }

      const numeric = toNumber(measure.field ? row[measure.field] : null);
      if (numeric === null) continue;

      switch (measure.aggregation) {
        case "sum":
          bucket.sum += numeric;
          bucket.count += 1;
          break;
        case "avg":
          bucket.sum += numeric;
          bucket.count += 1;
          break;
        case "min":
          bucket.min = bucket.min === null ? numeric : Math.min(bucket.min, numeric);
          break;
        case "max":
          bucket.max = bucket.max === null ? numeric : Math.max(bucket.max, numeric);
          break;
        default:
          break;
      }
    }

    rowMap.set(rowKey, rowEntry);
  }

  const columnKeys = Array.from(columnKeyMap.entries()).map(([key, values]) => {
    const label =
      Object.keys(values).length === 0
        ? "Total"
        : Object.entries(values)
            .map(([field, value]) => `${field}: ${value || "-"}`)
            .join(" / ");
    return { key, label, values };
  });

  const outputRows = Array.from(rowMap.entries()).map(([key, rowEntry]) => {
    const cells: Record<string, Record<string, number | null>> = {};
    for (const columnKey of columnKeys) {
      const aggregate = rowEntry.cells[columnKey.key] ?? {};
      cells[columnKey.key] = {};
      for (const measure of config.measures) {
        const bucket = aggregate[measure.key];
        if (!bucket) {
          cells[columnKey.key][measure.key] = null;
          continue;
        }

        switch (measure.aggregation) {
          case "count":
          case "sum":
            cells[columnKey.key][measure.key] = bucket.sum;
            break;
          case "avg":
            cells[columnKey.key][measure.key] =
              bucket.count > 0 ? Number((bucket.sum / bucket.count).toFixed(2)) : null;
            break;
          case "min":
            cells[columnKey.key][measure.key] = bucket.min;
            break;
          case "max":
            cells[columnKey.key][measure.key] = bucket.max;
            break;
          default:
            cells[columnKey.key][measure.key] = null;
        }
      }
    }

    return { key, values: rowEntry.values, cells };
  });

  return {
    rowFields: config.rowFields,
    columnFields: config.columnFields,
    measures: config.measures,
    columnKeys,
    rows: outputRows,
  };
};

export const createSavedReport = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(createSavedReportSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics");
    const sessionUser = requireUser(context);

    const { getDb } = await import("~/db/server-helpers");
    const { savedReports } = await import("~/db/schema");
    const { PermissionService } = await import("~/features/roles/permission.service");
    const { badRequest } = await import("~/lib/server/errors");

    const isGlobalAdmin = await PermissionService.isGlobalAdmin(sessionUser.id);
    const organizationId = data.organizationId ?? null;
    const isOrgWide = data.isOrgWide ?? false;
    const sharedWith = data.sharedWith ?? [];

    if (isOrgWide && !organizationId) {
      throw badRequest("Org-wide reports require an organization");
    }

    if (organizationId && !isGlobalAdmin) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      const requiredRoles = isOrgWide ? ORG_WIDE_ROLES : ANALYTICS_ROLES;
      await requireOrganizationAccess(
        { userId: sessionUser.id, organizationId },
        { roles: requiredRoles },
      );
    }

    await ensureSharedWithMembers({ organizationId, sharedWith });

    const db = await getDb();
    const [created] = await db
      .insert(savedReports)
      .values({
        organizationId,
        name: data.name,
        description: data.description ?? null,
        dataSource: data.dataSource,
        filters: data.filters ?? {},
        columns: data.columns ?? [],
        sort: data.sort ?? {},
        ownerId: sessionUser.id,
        sharedWith,
        isOrgWide,
      })
      .returning();

    if (created) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "REPORT_SAVE",
        actorUserId: sessionUser.id,
        targetType: "saved_report",
        targetId: created.id,
        targetOrgId: created.organizationId ?? null,
      });
    }

    return created ?? null;
  });

export const updateSavedReport = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(updateSavedReportSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics");
    const sessionUser = requireUser(context);

    const { getDb } = await import("~/db/server-helpers");
    const { savedReports } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { PermissionService } = await import("~/features/roles/permission.service");
    const { badRequest } = await import("~/lib/server/errors");

    const db = await getDb();
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(sessionUser.id);
    const [existing] = await db
      .select()
      .from(savedReports)
      .where(eq(savedReports.id, data.reportId))
      .limit(1);

    if (!existing) return null;

    if (existing.ownerId !== sessionUser.id) {
      if (!isGlobalAdmin) return null;
    }

    const nextOrganizationId =
      data.data.organizationId ?? existing.organizationId ?? null;
    const nextIsOrgWide = data.data.isOrgWide ?? existing.isOrgWide;
    const nextSharedWith = data.data.sharedWith ?? existing.sharedWith ?? [];

    if (nextIsOrgWide && !nextOrganizationId) {
      throw badRequest("Org-wide reports require an organization");
    }

    if (nextOrganizationId && !isGlobalAdmin) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      const requiredRoles = nextIsOrgWide ? ORG_WIDE_ROLES : ANALYTICS_ROLES;
      await requireOrganizationAccess(
        { userId: sessionUser.id, organizationId: nextOrganizationId },
        { roles: requiredRoles },
      );
    }

    if (
      data.data.sharedWith !== undefined ||
      data.data.organizationId !== undefined ||
      data.data.isOrgWide !== undefined
    ) {
      await ensureSharedWithMembers({
        organizationId: nextOrganizationId,
        sharedWith: nextSharedWith,
      });
    }

    const [updated] = await db
      .update(savedReports)
      .set({
        organizationId: nextOrganizationId,
        name: data.data.name ?? existing.name,
        description: data.data.description ?? existing.description,
        dataSource: data.data.dataSource ?? existing.dataSource,
        filters: data.data.filters ?? existing.filters,
        columns: data.data.columns ?? existing.columns,
        sort: data.data.sort ?? existing.sort,
        sharedWith: nextSharedWith,
        isOrgWide: nextIsOrgWide,
      })
      .where(eq(savedReports.id, data.reportId))
      .returning();

    if (updated) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "REPORT_UPDATE",
        actorUserId: sessionUser.id,
        targetType: "saved_report",
        targetId: updated.id,
        targetOrgId: updated.organizationId ?? null,
      });
    }

    return updated ?? null;
  });

export const deleteSavedReport = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(deleteSavedReportSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics");
    const sessionUser = requireUser(context);

    const { getDb } = await import("~/db/server-helpers");
    const { savedReports } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(savedReports)
      .where(eq(savedReports.id, data.reportId))
      .limit(1);

    if (!existing) return null;

    if (existing.ownerId !== sessionUser.id) {
      const { PermissionService } = await import("~/features/roles/permission.service");
      const isAdmin = await PermissionService.isGlobalAdmin(sessionUser.id);
      if (!isAdmin) return null;
    }

    await db.delete(savedReports).where(eq(savedReports.id, data.reportId));

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "REPORT_DELETE",
      actorUserId: sessionUser.id,
      targetType: "saved_report",
      targetId: data.reportId,
      targetOrgId: existing.organizationId ?? null,
    });

    return { success: true };
  });

export const runPivotQuery = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(pivotQuerySchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics");
    const sessionUser = requireUser(context);

    const { query, rowFields, columnFields, measures } = await normalizePivotConfig({
      dataSource: data.dataSource as ReportDataSource,
      rows: data.rows,
      columns: data.columns,
      measures: data.measures,
      filters: data.filters,
    });

    const { PermissionService } = await import("~/features/roles/permission.service");
    const { forbidden } = await import("~/lib/server/errors");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(sessionUser.id);
    const contextOrganizationId =
      (context as { organizationId?: string | null } | undefined)?.organizationId ?? null;

    const orgFilterField = query.dataSource === "organizations" ? "id" : "organizationId";
    const orgFilter = query.filters[orgFilterField];
    const orgFilterIds = orgFilter
      ? orgFilter.operator === "in"
        ? (orgFilter.value as string[])
        : [orgFilter.value as string]
      : [];

    let scopedOrganizationId: string | null = null;
    if (!isGlobalAdmin) {
      if (data.organizationId && data.organizationId !== contextOrganizationId) {
        throw forbidden("Organization context mismatch");
      }
      if (
        orgFilterIds.length > 0 &&
        (!contextOrganizationId ||
          orgFilterIds.some((orgId) => orgId !== contextOrganizationId))
      ) {
        throw forbidden("Organization context mismatch");
      }

      if (!contextOrganizationId) {
        throw forbidden("Organization context required");
      }

      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      const access = await requireOrganizationAccess(
        { userId: sessionUser.id, organizationId: contextOrganizationId },
        { roles: ANALYTICS_ROLES },
      );
      scopedOrganizationId = access.organizationId;
    } else {
      scopedOrganizationId =
        data.organizationId ??
        contextOrganizationId ??
        (orgFilterIds.length === 1 ? orgFilterIds[0] : null);
    }

    const roleAssignments = await PermissionService.getUserRoles(sessionUser.id);
    const permissions = extractPermissionSet(
      roleAssignments as Array<{ role?: { permissions?: Record<string, boolean> } }>,
    );
    const canViewPii = canViewSensitiveFields(permissions);

    const reportResult = await loadReportData({
      query,
      organizationId: scopedOrganizationId,
      canViewSensitiveFields: canViewPii,
    });

    const pivot = buildPivotResult(reportResult.rows, {
      rowFields,
      columnFields,
      measures,
    });

    return {
      pivot,
      rowCount: reportResult.rows.length,
    };
  });

export const exportPivotData = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(pivotExportSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics");
    const sessionUser = requireUser(context);

    const { getCurrentSession, requireRecentAuth } =
      await import("~/lib/auth/guards/step-up");
    const session = await getCurrentSession();
    await requireRecentAuth(sessionUser.id, session);

    const { query, rowFields, columnFields, measures } = await normalizePivotConfig({
      dataSource: data.dataSource as ReportDataSource,
      rows: data.rows,
      columns: data.columns,
      measures: data.measures,
      filters: data.filters,
    });

    const { PermissionService } = await import("~/features/roles/permission.service");
    const { forbidden } = await import("~/lib/server/errors");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(sessionUser.id);
    const contextOrganizationId =
      (context as { organizationId?: string | null } | undefined)?.organizationId ?? null;

    const orgFilterField = query.dataSource === "organizations" ? "id" : "organizationId";
    const orgFilter = query.filters[orgFilterField];
    const orgFilterIds = orgFilter
      ? orgFilter.operator === "in"
        ? (orgFilter.value as string[])
        : [orgFilter.value as string]
      : [];

    let scopedOrganizationId: string | null = null;
    if (!isGlobalAdmin) {
      if (data.organizationId && data.organizationId !== contextOrganizationId) {
        throw forbidden("Organization context mismatch");
      }
      if (
        orgFilterIds.length > 0 &&
        (!contextOrganizationId ||
          orgFilterIds.some((orgId) => orgId !== contextOrganizationId))
      ) {
        throw forbidden("Organization context mismatch");
      }

      if (!contextOrganizationId) {
        throw forbidden("Organization context required");
      }

      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      const access = await requireOrganizationAccess(
        { userId: sessionUser.id, organizationId: contextOrganizationId },
        { roles: ANALYTICS_ROLES },
      );
      scopedOrganizationId = access.organizationId;
    } else {
      scopedOrganizationId =
        data.organizationId ??
        contextOrganizationId ??
        (orgFilterIds.length === 1 ? orgFilterIds[0] : null);
    }

    const roleAssignments = await PermissionService.getUserRoles(sessionUser.id);
    const permissions = extractPermissionSet(
      roleAssignments as Array<{ role?: { permissions?: Record<string, boolean> } }>,
    );
    const canViewPii = canViewSensitiveFields(permissions);

    const reportResult = await loadReportData({
      query,
      organizationId: scopedOrganizationId,
      canViewSensitiveFields: canViewPii,
    });

    const pivot = buildPivotResult(reportResult.rows, {
      rowFields,
      columnFields,
      measures,
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

    if (data.exportType === "excel") {
      const module = await import("xlsx");
      const XLSX = "default" in module ? module.default : module;
      const worksheet = XLSX.utils.json_to_sheet(exportRows, { header: columnLabels });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Pivot");
      exportPayload = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
      fileName = "pivot-export.xlsx";
      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      encoding = "base64";
    } else {
      const { toCsv } = await import("~/shared/lib/csv");
      exportPayload = toCsv(exportRows);
    }

    const { getDb } = await import("~/db/server-helpers");
    const { exportHistory } = await import("~/db/schema");
    const db = await getDb();

    await db.insert(exportHistory).values({
      userId: sessionUser.id,
      organizationId: scopedOrganizationId,
      reportId: null,
      exportType: data.exportType,
      dataSource: data.dataSource,
      filtersUsed: serializeFilters(reportResult.filtersUsed),
      rowCount: exportRows.length,
      fileKey: null,
    });

    const { logExportEvent } = await import("~/lib/audit");
    await logExportEvent({
      action: "REPORT_PIVOT_EXPORT",
      actorUserId: sessionUser.id,
      metadata: {
        type: data.exportType,
        rows: exportRows.length,
        organizationId: scopedOrganizationId,
        dataSource: data.dataSource,
      },
    });

    return { data: exportPayload, fileName, mimeType, encoding };
  });

export const exportReport = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(exportReportSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics");
    const sessionUser = requireUser(context);

    const { getCurrentSession, requireRecentAuth } =
      await import("~/lib/auth/guards/step-up");
    const session = await getCurrentSession();
    await requireRecentAuth(sessionUser.id, session);

    const { exportHistory } = await import("~/db/schema");
    const { getDb } = await import("~/db/server-helpers");
    const { PermissionService } = await import("~/features/roles/permission.service");
    const db = await getDb();

    const { forbidden } = await import("~/lib/server/errors");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(sessionUser.id);
    const query = normalizeReportQuery({
      dataSource: data.dataSource,
      filters: data.filters,
      columns: data.columns,
      sort: data.sort,
    });
    const contextOrganizationId =
      (context as { organizationId?: string | null } | undefined)?.organizationId ?? null;

    const orgFilterField = query.dataSource === "organizations" ? "id" : "organizationId";
    const orgFilter = query.filters[orgFilterField];
    const orgFilterIds = orgFilter
      ? orgFilter.operator === "in"
        ? (orgFilter.value as string[])
        : [orgFilter.value as string]
      : [];

    let scopedOrganizationId: string | null = null;
    if (!isGlobalAdmin) {
      if (data.organizationId && data.organizationId !== contextOrganizationId) {
        throw forbidden("Organization context mismatch");
      }
      if (
        orgFilterIds.length > 0 &&
        (!contextOrganizationId ||
          orgFilterIds.some((orgId) => orgId !== contextOrganizationId))
      ) {
        throw forbidden("Organization context mismatch");
      }

      if (!contextOrganizationId) {
        throw forbidden("Organization context required");
      }

      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      const access = await requireOrganizationAccess(
        { userId: sessionUser.id, organizationId: contextOrganizationId },
        { roles: ANALYTICS_ROLES },
      );
      scopedOrganizationId = access.organizationId;
    } else {
      scopedOrganizationId =
        data.organizationId ??
        contextOrganizationId ??
        (orgFilterIds.length === 1 ? orgFilterIds[0] : null);
    }

    const roleAssignments = await PermissionService.getUserRoles(sessionUser.id);
    const permissions = extractPermissionSet(
      roleAssignments as Array<{ role?: { permissions?: Record<string, boolean> } }>,
    );
    const canViewPii = canViewSensitiveFields(permissions);

    const reportResult = await loadReportData({
      query,
      organizationId: scopedOrganizationId,
      canViewSensitiveFields: canViewPii,
    });

    let exportPayload = "";
    let fileName = "report-export.csv";
    let mimeType = "text/csv";
    let encoding: "base64" | "utf-8" = "utf-8";

    if (data.exportType === "excel") {
      const module = await import("xlsx");
      const XLSX = "default" in module ? module.default : module;
      const worksheet = XLSX.utils.json_to_sheet(reportResult.rows, {
        header: reportResult.columns,
      });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      exportPayload = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
      fileName = "report-export.xlsx";
      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      encoding = "base64";
    } else {
      const { toCsv } = await import("~/shared/lib/csv");
      exportPayload = toCsv(reportResult.rows);
    }

    await db.insert(exportHistory).values({
      userId: sessionUser.id,
      organizationId: scopedOrganizationId,
      reportId: null,
      exportType: data.exportType,
      dataSource: data.dataSource,
      filtersUsed: serializeFilters(reportResult.filtersUsed),
      rowCount: reportResult.rows.length,
      fileKey: null,
    });

    const { logExportEvent } = await import("~/lib/audit");
    await logExportEvent({
      action: "REPORT_EXPORT",
      actorUserId: sessionUser.id,
      metadata: {
        type: data.exportType,
        rows: reportResult.rows.length,
        organizationId: scopedOrganizationId,
        dataSource: data.dataSource,
      },
    });

    return {
      data: exportPayload,
      fileName,
      mimeType,
      encoding,
    };
  });
