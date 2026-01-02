import type { FormDefinition } from "~/features/forms/forms.schemas";
import type { DatasetField } from "./bi.types";
import { getDataset } from "./semantic";
import { maskPiiFields } from "./governance";

export type QueryFilter = { field: string; operator: string; value: unknown };

const toUtcDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const formatUtcDate = (date: Date) => date.toISOString().slice(0, 10);

const truncateToGrain = (date: Date, grain: DatasetField["timeGrain"]) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  switch (grain) {
    case "day":
      return new Date(Date.UTC(year, month, day));
    case "week": {
      const dayOfWeek = date.getUTCDay();
      const diff = (dayOfWeek + 6) % 7;
      return new Date(Date.UTC(year, month, day - diff));
    }
    case "month":
      return new Date(Date.UTC(year, month, 1));
    case "quarter": {
      const quarterStart = Math.floor(month / 3) * 3;
      return new Date(Date.UTC(year, quarterStart, 1));
    }
    default:
      return new Date(Date.UTC(year, month, day));
  }
};

const applyDerivedFields = (
  rows: Array<Record<string, unknown>>,
  fields: DatasetField[],
  columns: string[],
) => {
  const requested = new Set(columns);
  const derivedFields = fields.filter(
    (field) => field.timeGrain && field.derivedFrom && requested.has(field.id),
  );

  if (derivedFields.length === 0) return rows;

  return rows.map((row) => {
    const next = { ...row };
    for (const field of derivedFields) {
      const sourceValue = row[field.derivedFrom ?? ""] ?? row[field.id];
      const dateValue = toUtcDate(sourceValue);
      next[field.id] = dateValue
        ? formatUtcDate(truncateToGrain(dateValue, field.timeGrain))
        : null;
    }
    return next;
  });
};

export const shapeRows = (rows: Array<Record<string, unknown>>, columns: string[]) =>
  rows.map((row) => {
    const next: Record<string, unknown> = {};
    for (const column of columns) {
      next[column] = row[column];
    }
    return next;
  });

export const redactFormSubmissionPayloads = async (params: {
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

    const definition = definitionById.get(String(row["formVersionId"])) ?? null;
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

export const loadDatasetData = async (params: {
  datasetId: string;
  columns: string[];
  filters: QueryFilter[];
  fieldsToMask: string[];
  limit?: number;
}) => {
  const { datasetId } = params;
  const dataset = getDataset(datasetId);
  const { getDb } = await import("~/db/server-helpers");
  const { and, asc, between, eq, gt, gte, ilike, inArray, isNull, lt, lte, ne, not } =
    await import("drizzle-orm");
  const { events, formSubmissions, organizations, reportingSubmissions } =
    await import("~/db/schema");

  const db = await getDb();

  const buildConditions = (columns: Record<string, unknown>, filters: QueryFilter[]) => {
    const conditions = [] as Array<ReturnType<typeof eq>>;

    for (const filter of filters) {
      const column = columns[filter.field];
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
        case "not_in":
          conditions.push(not(inArray(column as never, filter.value as never[])));
          break;
        case "between": {
          const [start, end] = filter.value as [unknown, unknown];
          conditions.push(between(column as never, start as never, end as never));
          break;
        }
        case "contains":
          conditions.push(ilike(column as never, `%${filter.value}%`));
          break;
        case "starts_with":
          conditions.push(ilike(column as never, `${filter.value}%`));
          break;
        case "ends_with":
          conditions.push(ilike(column as never, `%${filter.value}`));
          break;
        case "is_null":
          conditions.push(isNull(column as never));
          break;
        case "is_not_null":
          conditions.push(not(isNull(column as never)));
          break;
        default:
          break;
      }
    }

    return conditions.length ? and(...conditions) : undefined;
  };

  const buildOrderBy = (columns: Record<string, unknown>) => {
    const sortField = params.columns[0];
    if (!sortField || !columns[sortField]) return undefined;
    return asc(columns[sortField] as never);
  };

  const attachDerivedColumns = <T extends Record<string, unknown>>(columnMap: T) => {
    const resolved = { ...columnMap } as Record<string, T[keyof T]>;
    for (const field of dataset?.fields ?? []) {
      if (!field.derivedFrom) continue;
      if (field.derivedFrom in columnMap) {
        resolved[field.id] = columnMap[field.derivedFrom] as T[keyof T];
      }
    }
    return resolved;
  };

  if (datasetId === "organizations") {
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

    type ColumnValue = (typeof columnMap)[keyof typeof columnMap];
    const resolvedColumns = attachDerivedColumns(columnMap) as Record<
      string,
      ColumnValue
    >;
    const selection = Object.fromEntries(
      params.columns.map((column) => [column, resolvedColumns[column]]),
    ) as Record<string, ColumnValue>;

    const baseQuery = db
      .select(selection)
      .from(organizations)
      .where(buildConditions(resolvedColumns, params.filters));

    const orderBy = buildOrderBy(resolvedColumns);
    const query = orderBy ? baseQuery.orderBy(orderBy) : baseQuery;
    const rows = await (typeof params.limit === "number"
      ? query.limit(params.limit)
      : query);

    const derived = applyDerivedFields(
      rows as Array<Record<string, unknown>>,
      dataset?.fields ?? [],
      params.columns,
    );
    const masked = derived.map((row) => maskPiiFields(row, params.fieldsToMask));

    return shapeRows(masked as Array<Record<string, unknown>>, params.columns);
  }

  if (datasetId === "reporting_submissions") {
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

    type ColumnValue = (typeof columnMap)[keyof typeof columnMap];
    const resolvedColumns = attachDerivedColumns(columnMap) as Record<
      string,
      ColumnValue
    >;
    const selection = Object.fromEntries(
      params.columns.map((column) => [column, resolvedColumns[column]]),
    ) as Record<string, ColumnValue>;

    const baseQuery = db
      .select(selection)
      .from(reportingSubmissions)
      .where(buildConditions(resolvedColumns, params.filters));

    const orderBy = buildOrderBy(resolvedColumns);
    const query = orderBy ? baseQuery.orderBy(orderBy) : baseQuery;
    const rows = await (typeof params.limit === "number"
      ? query.limit(params.limit)
      : query);

    const derived = applyDerivedFields(
      rows as Array<Record<string, unknown>>,
      dataset?.fields ?? [],
      params.columns,
    );
    const masked = derived.map((row) => maskPiiFields(row, params.fieldsToMask));

    return shapeRows(masked as Array<Record<string, unknown>>, params.columns);
  }

  if (datasetId === "form_submissions") {
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

    type ColumnValue = (typeof columnMap)[keyof typeof columnMap];
    const resolvedColumns = attachDerivedColumns(columnMap) as Record<
      string,
      ColumnValue
    >;
    const shouldIncludePayload = params.columns.includes("payload");
    const queryColumns = [...params.columns];
    if (shouldIncludePayload && !queryColumns.includes("formVersionId")) {
      queryColumns.push("formVersionId");
    }

    const selection = Object.fromEntries(
      queryColumns.map((column) => [column, resolvedColumns[column]]),
    ) as Record<string, ColumnValue>;

    const baseQuery = db
      .select(selection)
      .from(formSubmissions)
      .where(buildConditions(resolvedColumns, params.filters));

    const orderBy = buildOrderBy(resolvedColumns);
    const query = orderBy ? baseQuery.orderBy(orderBy) : baseQuery;
    const rows = await (typeof params.limit === "number"
      ? query.limit(params.limit)
      : query);

    const maskFields = params.fieldsToMask.filter((field) => field !== "payload");
    const derived = applyDerivedFields(
      rows as Array<Record<string, unknown>>,
      dataset?.fields ?? [],
      params.columns,
    );
    let masked = derived.map((row) => maskPiiFields(row, maskFields));

    if (shouldIncludePayload) {
      masked = await redactFormSubmissionPayloads({
        rows: masked as Array<Record<string, unknown>>,
        canViewSensitiveFields: params.fieldsToMask.length === 0,
      });
    }

    return shapeRows(masked as Array<Record<string, unknown>>, params.columns);
  }

  if (datasetId === "events") {
    const columnMap = {
      id: events.id,
      name: events.name,
      type: events.type,
      status: events.status,
      startDate: events.startDate,
      endDate: events.endDate,
      createdAt: events.createdAt,
    } as const;

    type ColumnValue = (typeof columnMap)[keyof typeof columnMap];
    const resolvedColumns = attachDerivedColumns(columnMap) as Record<
      string,
      ColumnValue
    >;
    const selection = Object.fromEntries(
      params.columns.map((column) => [column, resolvedColumns[column]]),
    ) as Record<string, ColumnValue>;

    const baseQuery = db
      .select(selection)
      .from(events)
      .where(buildConditions(resolvedColumns, params.filters));

    const orderBy = buildOrderBy(resolvedColumns);
    const query = orderBy ? baseQuery.orderBy(orderBy) : baseQuery;
    const rows = await (typeof params.limit === "number"
      ? query.limit(params.limit)
      : query);

    const derived = applyDerivedFields(
      rows as Array<Record<string, unknown>>,
      dataset?.fields ?? [],
      params.columns,
    );
    const masked = derived.map((row) => maskPiiFields(row, params.fieldsToMask));

    return shapeRows(masked as Array<Record<string, unknown>>, params.columns);
  }

  return [];
};
