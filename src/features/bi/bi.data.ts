import type { FormDefinition } from "~/features/forms/forms.schemas";
import { maskPiiFields } from "./governance";

export type QueryFilter = { field: string; operator: string; value: unknown };

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
}) => {
  const { datasetId } = params;
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

    const selection = Object.fromEntries(
      params.columns.map((column) => [
        column,
        columnMap[column as keyof typeof columnMap],
      ]),
    );

    const baseQuery = db
      .select(selection)
      .from(organizations)
      .where(buildConditions(columnMap, params.filters));

    const orderBy = buildOrderBy(columnMap);
    const rows = orderBy ? await baseQuery.orderBy(orderBy) : await baseQuery;

    const masked = rows.map((row) => maskPiiFields(row, params.fieldsToMask));

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

    const selection = Object.fromEntries(
      params.columns.map((column) => [
        column,
        columnMap[column as keyof typeof columnMap],
      ]),
    );

    const baseQuery = db
      .select(selection)
      .from(reportingSubmissions)
      .where(buildConditions(columnMap, params.filters));

    const orderBy = buildOrderBy(columnMap);
    const rows = orderBy ? await baseQuery.orderBy(orderBy) : await baseQuery;

    const masked = rows.map((row) => maskPiiFields(row, params.fieldsToMask));

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

    const shouldIncludePayload = params.columns.includes("payload");
    const queryColumns = [...params.columns];
    if (shouldIncludePayload && !queryColumns.includes("formVersionId")) {
      queryColumns.push("formVersionId");
    }

    const selection = Object.fromEntries(
      queryColumns.map((column) => [column, columnMap[column as keyof typeof columnMap]]),
    );

    const baseQuery = db
      .select(selection)
      .from(formSubmissions)
      .where(buildConditions(columnMap, params.filters));

    const orderBy = buildOrderBy(columnMap);
    const rows = orderBy ? await baseQuery.orderBy(orderBy) : await baseQuery;

    const maskFields = params.fieldsToMask.filter((field) => field !== "payload");
    let masked = rows.map((row) => maskPiiFields(row, maskFields));

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

    const selection = Object.fromEntries(
      params.columns.map((column) => [
        column,
        columnMap[column as keyof typeof columnMap],
      ]),
    );

    const baseQuery = db
      .select(selection)
      .from(events)
      .where(buildConditions(columnMap, params.filters));

    const orderBy = buildOrderBy(columnMap);
    const rows = orderBy ? await baseQuery.orderBy(orderBy) : await baseQuery;

    const masked = rows.map((row) => maskPiiFields(row, params.fieldsToMask));

    return shapeRows(masked as Array<Record<string, unknown>>, params.columns);
  }

  return [];
};
