import {
  assignChanged,
  astMapper,
  parse,
  toSql,
  type FromTable,
  type Statement,
} from "pgsql-ast-parser";
import { normalizeSqlPlaceholders, restoreSqlPlaceholders } from "./sql-parser";

export type SqlRewriteResult = {
  sql: string;
  rewritten: boolean;
};

const buildTableMap = (tableMap: Record<string, string>) =>
  new Map(Object.entries(tableMap).map(([key, value]) => [key.toLowerCase(), value]));

const rewriteFromTable = (from: FromTable, map: Map<string, string>): FromTable => {
  const tableName = from.name.name;
  const mapped = map.get(tableName.toLowerCase());

  if (!mapped) {
    return from;
  }

  const alias = from.name.alias ?? tableName;
  const nextName = assignChanged(from.name, {
    name: mapped,
    alias,
  });

  return assignChanged(from, { name: nextName });
};

export function rewriteSqlTables(
  sqlText: string,
  tableMap: Record<string, string>,
): SqlRewriteResult {
  const { sanitizedSql } = normalizeSqlPlaceholders(sqlText);
  const statements = parse(sanitizedSql);

  const [statement] = statements;
  if (statements.length !== 1 || !statement) {
    return { sql: sqlText, rewritten: false };
  }

  const map = buildTableMap(tableMap);
  let touched = false;

  const mapper = astMapper((m) => ({
    fromTable: (from) => {
      const next = rewriteFromTable(from, map);
      if (next !== from) {
        touched = true;
      }
      return m.super().fromTable(next);
    },
  }));

  const rewritten = mapper.statement(statement as Statement);
  if (!rewritten) {
    return { sql: sqlText, rewritten: false };
  }
  const rewrittenSql = toSql.statement(rewritten);

  return {
    sql: restoreSqlPlaceholders(rewrittenSql),
    rewritten: touched,
  };
}
