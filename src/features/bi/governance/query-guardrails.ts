/**
 * SQL Workbench Guardrails
 *
 * Enforces query limits (timeout, row limits, cost, concurrency) for SQL workbench.
 */

export const QUERY_GUARDRAILS = {
  statementTimeoutMs: 30000,
  maxRowsUi: 10000,
  maxRowsExport: 100000,
  maxEstimatedCost: 100000,
  maxConcurrentPerUser: 2,
  maxConcurrentPerOrg: 5,
  maxPivotRows: 500,
  maxPivotColumns: 50,
  maxPivotCells: 25000,
} as const;

const inflightByUser = new Map<string, number>();
const inflightByOrg = new Map<string, number>();

const bump = (map: Map<string, number>, key: string) => {
  const next = (map.get(key) ?? 0) + 1;
  map.set(key, next);
  return next;
};

const drop = (map: Map<string, number>, key: string) => {
  const next = (map.get(key) ?? 1) - 1;
  if (next <= 0) {
    map.delete(key);
  } else {
    map.set(key, next);
  }
};

export const acquireConcurrencySlot = (
  userId: string,
  organizationId: string | null,
): (() => void) => {
  const userCount = bump(inflightByUser, userId);
  if (userCount > QUERY_GUARDRAILS.maxConcurrentPerUser) {
    drop(inflightByUser, userId);
    throw new Error("Too many concurrent SQL queries for this user");
  }

  if (organizationId) {
    const orgCount = bump(inflightByOrg, organizationId);
    if (orgCount > QUERY_GUARDRAILS.maxConcurrentPerOrg) {
      drop(inflightByUser, userId);
      drop(inflightByOrg, organizationId);
      throw new Error("Too many concurrent SQL queries for this organization");
    }
  }

  return () => {
    drop(inflightByUser, userId);
    if (organizationId) {
      drop(inflightByOrg, organizationId);
    }
  };
};

export const stripTrailingSemicolons = (sqlText: string) => sqlText.replace(/;\s*$/, "");

export const buildLimitedQuery = (sqlText: string, maxRows: number) =>
  `SELECT * FROM (${stripTrailingSemicolons(sqlText)}) AS bi_limit_subquery LIMIT ${maxRows}`;

export const assertPivotCardinality = (rowCount: number, columnCount: number) => {
  if (rowCount > QUERY_GUARDRAILS.maxPivotRows) {
    throw new Error("Too many row categories; add filters or fewer dimensions.");
  }
  if (columnCount > QUERY_GUARDRAILS.maxPivotColumns) {
    throw new Error("Too many column categories; add filters or fewer dimensions.");
  }
  if (rowCount * columnCount > QUERY_GUARDRAILS.maxPivotCells) {
    throw new Error("Too many categories; add filters or fewer dimensions.");
  }
};

const escapeLiteral = (value: string) => `'${value.replace(/'/g, "''")}'`;

export const inlineParameters = (
  sqlText: string,
  parameters: Record<string, unknown>,
): string => {
  return sqlText.replace(/\{\{([a-zA-Z_][\w]*)\}\}/g, (_, name) => {
    if (!(name in parameters)) {
      throw new Error(`Missing SQL parameter: ${name}`);
    }

    const value = parameters[name];
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "number" && Number.isFinite(value)) return value.toString();
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
    if (value instanceof Date) return escapeLiteral(value.toISOString());
    if (Array.isArray(value)) {
      return `ARRAY[${value.map((entry) => inlineParameters("{{value}}", { value: entry })).join(", ")}]`;
    }
    return escapeLiteral(String(value));
  });
};
