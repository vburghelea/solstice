import { sql, type SQL, type SQLChunk } from "drizzle-orm";
import type { AggregationType } from "../bi.schemas";
import type { DatasetConfig, DatasetField } from "../bi.types";
import type { NormalizedFilter } from "./filters";
import type { PivotMeasureMeta } from "./pivot-aggregator";

type PivotSqlDimension = {
  fieldId: string;
  alias: string;
  column: string;
  isMasked?: boolean;
};

type PivotSqlMeasure = {
  key: string;
  alias: string;
  aggregation: AggregationType;
  fieldId: string | null;
};

export type PivotSqlPlan = {
  sql: SQL;
  rowDimensions: PivotSqlDimension[];
  columnDimensions: PivotSqlDimension[];
  measures: PivotSqlMeasure[];
};

const BASE_ALIAS = "base";

const quoteIdentifier = (value: string) => `"${value.replace(/"/g, '""')}"`;

const buildColumnRef = (column: string) =>
  `${quoteIdentifier(BASE_ALIAS)}.${quoteIdentifier(column)}`;

const toPivotKey = (fields: PivotSqlDimension[], row: Record<string, unknown>) => {
  if (fields.length === 0) return "__total__";
  return fields.map((field) => String(row[field.alias] ?? "")).join("||");
};

const toPivotValues = (fields: PivotSqlDimension[], row: Record<string, unknown>) => {
  const values: Record<string, string> = {};
  for (const field of fields) {
    const value = row[field.alias];
    if (value === null || value === undefined) {
      values[field.fieldId] = "";
    } else if (typeof value === "string") {
      values[field.fieldId] = value;
    } else if (typeof value === "number" || typeof value === "boolean") {
      values[field.fieldId] = String(value);
    } else {
      values[field.fieldId] = JSON.stringify(value);
    }
  }
  return values;
};

const resolveFieldColumn = (dataset: DatasetConfig, fieldId: string) => {
  const field = dataset.fields.find((entry) => entry.id === fieldId);
  if (!field) {
    throw new Error(`Unknown field '${fieldId}' for dataset '${dataset.id}'`);
  }
  return field.sourceColumn;
};

const resolveField = (dataset: DatasetConfig, fieldId: string): DatasetField => {
  const field = dataset.fields.find((entry) => entry.id === fieldId);
  if (!field) {
    throw new Error(`Unknown field '${fieldId}' for dataset '${dataset.id}'`);
  }
  return field;
};

export const buildFieldExpression = (
  dataset: DatasetConfig,
  fieldId: string,
): SQLChunk => {
  const field = resolveField(dataset, fieldId);
  const columnRef = buildColumnRef(field.sourceColumn);
  if (field.timeGrain) {
    return sql.raw(`DATE_TRUNC('${field.timeGrain}', ${columnRef})::date`);
  }
  return sql.raw(columnRef);
};

const buildMeasureExpression = (
  measure: { aggregation: AggregationType },
  columnRef: string | null,
): SQLChunk => {
  if (!columnRef && measure.aggregation !== "count") {
    return sql.raw("NULL");
  }
  switch (measure.aggregation) {
    case "count":
      return sql.raw("COUNT(*)");
    case "count_distinct":
      return sql.raw(`COUNT(DISTINCT ${columnRef})`);
    case "sum":
      return sql.raw(`SUM(${columnRef})`);
    case "avg":
      return sql.raw(`AVG(${columnRef})`);
    case "min":
      return sql.raw(`MIN(${columnRef})`);
    case "max":
      return sql.raw(`MAX(${columnRef})`);
    case "median":
      return sql.raw(`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${columnRef})`);
    case "stddev":
      return sql.raw(`STDDEV_POP(${columnRef})`);
    case "variance":
      return sql.raw(`VAR_POP(${columnRef})`);
    default:
      return sql.raw("NULL");
  }
};

export const buildFilterExpression = (
  filter: NormalizedFilter,
  dataset: DatasetConfig,
): SQLChunk => {
  const columnExpr = buildFieldExpression(dataset, filter.field);

  if (filter.operator === "is_null") {
    return sql`${columnExpr} IS NULL`;
  }
  if (filter.operator === "is_not_null") {
    return sql`${columnExpr} IS NOT NULL`;
  }

  if (filter.operator === "eq" && filter.value === null) {
    return sql`${columnExpr} IS NULL`;
  }
  if (filter.operator === "neq" && filter.value === null) {
    return sql`${columnExpr} IS NOT NULL`;
  }

  if (filter.operator === "in" || filter.operator === "not_in") {
    const values = Array.isArray(filter.value) ? filter.value : [];
    if (values.length === 0) {
      return sql.raw("1 = 0");
    }
    const params = values.map((value) => sql.param(value));
    const joined = sql.join(params, sql`, `);
    return sql`${columnExpr} ${sql.raw(
      filter.operator === "in" ? "IN" : "NOT IN",
    )} (${joined})`;
  }

  if (filter.operator === "between" && Array.isArray(filter.value)) {
    const [start, end] = filter.value;
    return sql`${columnExpr} BETWEEN ${sql.param(start)} AND ${sql.param(end)}`;
  }

  if (filter.operator === "contains") {
    return sql`${columnExpr} ILIKE ${sql.param(`%${filter.value}%`)}`;
  }
  if (filter.operator === "starts_with") {
    return sql`${columnExpr} ILIKE ${sql.param(`${filter.value}%`)}`;
  }
  if (filter.operator === "ends_with") {
    return sql`${columnExpr} ILIKE ${sql.param(`%${filter.value}`)}`;
  }

  const operatorMap: Record<string, string> = {
    eq: "=",
    neq: "!=",
    gt: ">",
    gte: ">=",
    lt: "<",
    lte: "<=",
  };

  const operator = operatorMap[filter.operator] ?? "=";
  return sql`${columnExpr} ${sql.raw(operator)} ${sql.param(filter.value)}`;
};

export const buildPivotSqlPlan = (params: {
  dataset: DatasetConfig;
  rowFields: string[];
  columnFields: string[];
  measures: PivotMeasureMeta[];
  filters: NormalizedFilter[];
  limit: number;
  maskedFieldIds?: Set<string>;
}): PivotSqlPlan => {
  const maskedFieldIds = params.maskedFieldIds ?? new Set<string>();
  const rowDimensions = params.rowFields.map((fieldId, index) => ({
    fieldId,
    alias: `r${index}`,
    column: resolveFieldColumn(params.dataset, fieldId),
    isMasked: maskedFieldIds.has(fieldId),
  }));
  const columnDimensions = params.columnFields.map((fieldId, index) => ({
    fieldId,
    alias: `c${index}`,
    column: resolveFieldColumn(params.dataset, fieldId),
    isMasked: maskedFieldIds.has(fieldId),
  }));
  const measures = params.measures.map((measure, index) => ({
    key: measure.key,
    alias: `m${index}`,
    aggregation: measure.aggregation,
    fieldId: measure.field ?? null,
  }));

  const selectChunks: SQLChunk[] = [];

  for (const dimension of [...rowDimensions, ...columnDimensions]) {
    const expression = dimension.isMasked
      ? sql.param("***")
      : buildFieldExpression(params.dataset, dimension.fieldId);
    selectChunks.push(sql`${expression} AS ${sql.raw(quoteIdentifier(dimension.alias))}`);
  }

  for (const measure of measures) {
    const columnRef = measure.fieldId
      ? buildColumnRef(resolveFieldColumn(params.dataset, measure.fieldId))
      : null;
    const expression = buildMeasureExpression(measure, columnRef);
    selectChunks.push(sql`${expression} AS ${sql.raw(quoteIdentifier(measure.alias))}`);
  }

  const viewName = `bi_v_${params.dataset.id}`;
  const whereConditions = params.filters.map((filter) =>
    buildFilterExpression(filter, params.dataset),
  );

  const groupByExpressions = [...rowDimensions, ...columnDimensions]
    .filter((dim) => !dim.isMasked)
    .map((dim) => buildFieldExpression(params.dataset, dim.fieldId));

  const selectClause = sql.join(selectChunks, sql`, `);
  const whereClause =
    whereConditions.length > 0
      ? sql`WHERE ${sql.join(whereConditions, sql` AND `)}`
      : sql``;
  const groupByClause =
    groupByExpressions.length > 0
      ? sql`GROUP BY ${sql.join(groupByExpressions, sql`, `)}`
      : sql``;
  const orderByClause =
    groupByExpressions.length > 0
      ? sql`ORDER BY ${sql.join(groupByExpressions, sql`, `)}`
      : sql``;

  const query = sql`
    SELECT ${selectClause}
    FROM ${sql.raw(`${quoteIdentifier(viewName)} AS ${quoteIdentifier(BASE_ALIAS)}`)}
    ${whereClause}
    ${groupByClause}
    ${orderByClause}
    LIMIT ${sql.param(params.limit)}
  `;

  return {
    sql: query,
    rowDimensions,
    columnDimensions,
    measures,
  };
};

export const buildPivotResultFromSqlRows = (params: {
  rows: Array<Record<string, unknown>>;
  rowDimensions: PivotSqlDimension[];
  columnDimensions: PivotSqlDimension[];
  measures: PivotMeasureMeta[];
  measureAliases: PivotSqlMeasure[];
}) => {
  const columnKeyMap = new Map<string, Record<string, string>>();
  const rowMap = new Map<
    string,
    {
      values: Record<string, string>;
      cells: Record<string, Record<string, number | null>>;
    }
  >();

  for (const row of params.rows) {
    const rowKey = toPivotKey(params.rowDimensions, row);
    const columnKey = toPivotKey(params.columnDimensions, row);
    const columnValues = toPivotValues(params.columnDimensions, row);

    if (!columnKeyMap.has(columnKey)) {
      columnKeyMap.set(columnKey, columnValues);
    }

    const rowEntry = rowMap.get(rowKey) ?? {
      values: toPivotValues(params.rowDimensions, row),
      cells: {},
    };

    if (!rowEntry.cells[columnKey]) {
      rowEntry.cells[columnKey] = {};
    }

    params.measureAliases.forEach((measure) => {
      const rawValue = row[measure.alias];
      if (rawValue === null || rawValue === undefined) {
        rowEntry.cells[columnKey][measure.key] = null;
        return;
      }
      const numeric =
        typeof rawValue === "number"
          ? rawValue
          : typeof rawValue === "bigint"
            ? Number(rawValue)
            : typeof rawValue === "string"
              ? Number(rawValue)
              : Number(rawValue as number);
      rowEntry.cells[columnKey][measure.key] = Number.isFinite(numeric) ? numeric : null;
    });

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
      for (const measure of params.measures) {
        cells[columnKey.key][measure.key] = aggregate[measure.key] ?? null;
      }
    }
    return { key, values: rowEntry.values, cells };
  });

  return {
    rowFields: params.rowDimensions.map((dim) => dim.fieldId),
    columnFields: params.columnDimensions.map((dim) => dim.fieldId),
    measures: params.measures,
    columnKeys,
    rows: outputRows,
  };
};
