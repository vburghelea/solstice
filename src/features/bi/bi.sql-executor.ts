import { sql, type SQLChunk } from "drizzle-orm";
import type { DatasetConfig } from "./bi.types";
import type { QueryContext } from "./bi.types";
import type { JsonRecord, JsonValue } from "~/shared/lib/json";
import { parseAndValidateSql, validateAgainstDataset } from "./engine/sql-parser";
import { rewriteSqlTables } from "./engine/sql-rewriter";
import {
  QUERY_GUARDRAILS,
  acquireConcurrencySlot,
  buildLimitedQuery,
  inlineParameters,
  stripTrailingSemicolons,
} from "./governance/query-guardrails";
import { DATASETS, getDataset } from "./semantic";
import { assertSqlWorkbenchReady } from "./governance/sql-workbench-gate";

const PLACEHOLDER_PATTERN = /\{\{([a-zA-Z_][\w]*)\}\}/g;

const escapeSqlString = (value: string) => `'${value.replaceAll("'", "''")}'`;

const formatSettingValue = (value: string | number | boolean) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "0";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return escapeSqlString(value);
};

export type SqlExecutionResult = {
  rows: JsonRecord[];
  truncated: boolean;
  executionTimeMs: number;
  rowCount: number;
  sql: string;
};

const getViewName = (datasetId: string) => `bi_v_${datasetId}`;

const buildTableMapping = (datasets: DatasetConfig[]) => {
  const map: Record<string, string> = {};
  for (const dataset of datasets) {
    map[dataset.baseTable] = getViewName(dataset.id);
    map[dataset.id] = getViewName(dataset.id);
  }
  return map;
};

const buildAllowedTables = (datasets: DatasetConfig[]) =>
  new Set(datasets.map((dataset) => getViewName(dataset.id)));

const buildAllowedColumns = (datasets: DatasetConfig[]) => {
  const allowed = new Map<string, Set<string>>();
  for (const dataset of datasets) {
    const viewName = getViewName(dataset.id);
    const columns = new Set<string>();
    for (const field of dataset.fields) {
      if (field.piiClassification && field.piiClassification !== "none") continue;
      columns.add(field.sourceColumn.toLowerCase());
    }
    allowed.set(viewName, columns);
  }
  return allowed;
};

const buildParameterizedSql = (sqlText: string, parameters: JsonRecord) => {
  let lastIndex = 0;
  const chunks: SQLChunk[] = [];
  let match: RegExpExecArray | null = null;

  while ((match = PLACEHOLDER_PATTERN.exec(sqlText)) !== null) {
    const before = sqlText.slice(lastIndex, match.index);
    if (before) {
      chunks.push(sql.raw(before));
    }
    const name = match[1];
    if (!(name in parameters)) {
      throw new Error(`Missing SQL parameter: ${name}`);
    }
    chunks.push(sql.param(parameters[name]));
    lastIndex = match.index + match[0].length;
  }

  const tail = sqlText.slice(lastIndex);
  if (tail) {
    chunks.push(sql.raw(tail));
  }

  return sql.join(chunks);
};

const extractPlanCost = (explainResult: Array<Record<string, unknown>>) => {
  if (!explainResult.length) return null;
  const planEntry = explainResult[0] as Record<string, unknown>;
  const planValue = planEntry["QUERY PLAN"] ?? planEntry["QUERY_PLAN"];
  const plan = Array.isArray(planValue) ? planValue[0] : planValue;
  if (!plan || typeof plan !== "object") return null;
  const planDetails = (plan as Record<string, unknown>)["Plan"] as
    | Record<string, unknown>
    | undefined;
  const totalCost = planDetails?.["Total Cost"];
  return typeof totalCost === "number" ? totalCost : null;
};

const normalizeSqlValue = (value: unknown): JsonValue => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map((entry) => normalizeSqlValue(entry));
  if (typeof value === "object") {
    const nested: JsonRecord = {};
    for (const [key, entry] of Object.entries(value)) {
      nested[key] = normalizeSqlValue(entry);
    }
    return nested;
  }
  if (
    typeof value === "number" ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  return String(value);
};

const normalizeSqlRow = (row: Record<string, unknown>): JsonRecord => {
  const normalized: JsonRecord = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[key] = normalizeSqlValue(value);
  }
  return normalized;
};

export const executeSqlWorkbenchQuery = async (params: {
  sqlText: string;
  parameters?: JsonRecord;
  datasetId?: string;
  context: QueryContext;
  maxRows?: number;
  logQuery?: boolean;
}): Promise<SqlExecutionResult> => {
  const { sqlText, datasetId, context } = params;
  const parameters = params.parameters ?? {};
  const maxRows = params.maxRows ?? QUERY_GUARDRAILS.maxRowsUi;
  const shouldLog = params.logQuery ?? true;

  const release = await acquireConcurrencySlot(context.userId, context.organizationId);
  const startedAt = Date.now();

  try {
    const parsed = parseAndValidateSql(sqlText);
    if (!parsed.isValid) {
      throw new Error(parsed.errors.join(" "));
    }

    const selectedDatasets = (
      datasetId ? [getDataset(datasetId)] : Object.values(DATASETS)
    ).filter((dataset): dataset is DatasetConfig => Boolean(dataset));

    if (selectedDatasets.length === 0) {
      throw new Error("No datasets available for SQL workbench");
    }

    await assertSqlWorkbenchReady({
      organizationId: context.organizationId ?? null,
      isGlobalAdmin: context.isGlobalAdmin,
      datasetIds: selectedDatasets.map((dataset) => dataset.id),
    });

    const tableMapping = buildTableMapping(selectedDatasets);
    const rewritten = rewriteSqlTables(stripTrailingSemicolons(sqlText), tableMapping);

    const rewrittenParsed = parseAndValidateSql(rewritten.sql);
    if (!rewrittenParsed.isValid) {
      throw new Error(rewrittenParsed.errors.join(" "));
    }

    const allowedTables = buildAllowedTables(selectedDatasets);
    const allowedColumns = buildAllowedColumns(selectedDatasets);
    const validationErrors = validateAgainstDataset(
      rewrittenParsed,
      allowedTables,
      allowedColumns,
    );

    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(" "));
    }

    const limitedSqlText = buildLimitedQuery(rewritten.sql, maxRows);
    const query = buildParameterizedSql(limitedSqlText, parameters);

    const { getDb } = await import("~/db/server-helpers");
    const db = await getDb();

    const result = await db.transaction(async (tx) => {
      await tx.execute(sql.raw("SET LOCAL ROLE bi_readonly"));
      await tx.execute(
        sql.raw(
          `SET LOCAL app.org_id = ${formatSettingValue(context.organizationId ?? "")}`,
        ),
      );
      await tx.execute(
        sql.raw(
          `SET LOCAL app.is_global_admin = ${formatSettingValue(
            String(context.isGlobalAdmin),
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

      const explainSql = inlineParameters(limitedSqlText, parameters);
      const explainRows = await tx.execute<Record<string, unknown>>(
        sql.raw(`EXPLAIN (FORMAT JSON) ${explainSql}`),
      );
      const planCost = extractPlanCost(explainRows);
      if (typeof planCost === "number" && planCost > QUERY_GUARDRAILS.maxEstimatedCost) {
        throw new Error("SQL query exceeds cost limits");
      }

      return tx.execute<Record<string, unknown>>(query);
    });

    const rows = Array.isArray(result) ? result : [];
    const normalizedRows = rows.map((row) => normalizeSqlRow(row));
    const executionTimeMs = Date.now() - startedAt;

    if (shouldLog) {
      const { logQuery } = await import("./governance");
      const logParams = {
        context,
        queryType: "sql" as const,
        sqlQuery: rewritten.sql,
        parameters,
        rowsReturned: normalizedRows.length,
        executionTimeMs,
        ...(datasetId ? { datasetId } : {}),
      };

      await logQuery(logParams);
    }

    return {
      rows: normalizedRows,
      truncated: normalizedRows.length >= maxRows,
      executionTimeMs,
      rowCount: normalizedRows.length,
      sql: rewritten.sql,
    };
  } finally {
    await release();
  }
};
