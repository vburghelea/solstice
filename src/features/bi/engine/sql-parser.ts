import {
  astVisitor,
  parse,
  type Statement,
  type WithStatement,
  type WithRecursiveStatement,
} from "pgsql-ast-parser";

export type SqlParameter = { name: string; position: number };

export type ParsedQuery = {
  isValid: boolean;
  errors: string[];
  tables: string[];
  columns: string[];
  parameters: SqlParameter[];
  tableAliases: Record<string, string | null>;
  cteNames: string[];
  selectAliases: string[];
  sanitizedSql?: string;
};

const PLACEHOLDER_PREFIX = "__bi_param__";
const PLACEHOLDER_PATTERN = /\{\{([a-zA-Z_][\w]*)\}\}/g;

export const normalizeSqlPlaceholders = (sqlText: string) => {
  const parameters: SqlParameter[] = [];
  const sanitizedSql = sqlText.replace(PLACEHOLDER_PATTERN, (_, name, index) => {
    parameters.push({ name, position: index });
    return `'${PLACEHOLDER_PREFIX}${name}__'`;
  });

  return { sanitizedSql, parameters };
};

export const restoreSqlPlaceholders = (sqlText: string) => {
  const pattern = new RegExp(`'${PLACEHOLDER_PREFIX}([a-zA-Z_][\\w]*)__'`, "g");
  return sqlText.replace(pattern, (_, name) => `{{${name}}}`);
};

const isSelectStatement = (statement: Statement): boolean => {
  switch (statement.type) {
    case "select":
      return true;
    case "union":
    case "union all":
      return isSelectStatement(statement.left) && isSelectStatement(statement.right);
    case "with": {
      const withStatement = statement as WithStatement;
      return (
        isSelectStatement(withStatement.in) &&
        withStatement.bind.every((binding) => isSelectStatement(binding.statement))
      );
    }
    case "with recursive": {
      const withStatement = statement as WithRecursiveStatement;
      return isSelectStatement(withStatement.in) && isSelectStatement(withStatement.bind);
    }
    default:
      return false;
  }
};

const normalizeTableName = (name?: string | null, schema?: string | null) => {
  if (!name) return null;
  if (schema) return `${schema}.${name}`;
  return name;
};

const collectCteNames = (statement: Statement) => {
  const names = new Set<string>();
  const visit = (stmt: Statement) => {
    switch (stmt.type) {
      case "with": {
        const withStatement = stmt as WithStatement;
        withStatement.bind.forEach((binding) => {
          names.add(binding.alias.name.toLowerCase());
          if (binding.statement && typeof binding.statement === "object") {
            visit(binding.statement as Statement);
          }
        });
        if (withStatement.in && typeof withStatement.in === "object") {
          visit(withStatement.in as Statement);
        }
        break;
      }
      case "with recursive": {
        const withStatement = stmt as WithRecursiveStatement;
        names.add(withStatement.alias.name.toLowerCase());
        if (withStatement.bind) {
          visit(withStatement.bind as Statement);
        }
        if (withStatement.in && typeof withStatement.in === "object") {
          visit(withStatement.in as Statement);
        }
        break;
      }
      case "union":
      case "union all":
        visit(stmt.left);
        visit(stmt.right);
        break;
      default:
        break;
    }
  };

  visit(statement);
  return names;
};

export function parseAndValidateSql(sqlText: string): ParsedQuery {
  const { sanitizedSql, parameters } = normalizeSqlPlaceholders(sqlText);

  const result: ParsedQuery = {
    isValid: true,
    errors: [],
    tables: [],
    columns: [],
    parameters,
    tableAliases: {},
    cteNames: [],
    selectAliases: [],
    sanitizedSql,
  };

  let statements: Statement[] = [];

  try {
    statements = parse(sanitizedSql);
  } catch (error) {
    result.isValid = false;
    result.errors.push(
      `SQL parse error: ${error instanceof Error ? error.message : String(error)}`,
    );
    return result;
  }

  if (statements.length !== 1) {
    result.isValid = false;
    result.errors.push("SQL must contain a single SELECT statement");
    return result;
  }

  const statement = statements[0];
  if (!statement || !isSelectStatement(statement)) {
    result.isValid = false;
    result.errors.push("Only SELECT statements are allowed");
    return result;
  }

  const tables = new Set<string>();
  const columns = new Set<string>();
  const tableAliases = new Map<string, string | null>();
  const selectAliases = new Set<string>();
  const cteNames = collectCteNames(statement);

  const visitor = astVisitor((v) => ({
    fromTable: (from) => {
      const table = normalizeTableName(from.name.name, from.name.schema ?? null);
      const normalizedTable = table?.toLowerCase() ?? null;
      if (from.name.alias) {
        tableAliases.set(
          from.name.alias.toLowerCase(),
          cteNames.has(normalizedTable ?? "") ? null : normalizedTable,
        );
      }
      if (normalizedTable && !cteNames.has(normalizedTable)) {
        tables.add(normalizedTable);
      }
      v.super().fromTable(from);
    },
    fromCall: (from) => {
      const name = normalizeTableName(from.function.name, from.function.schema ?? null);
      if (name) {
        tables.add(name.toLowerCase());
      }
      const alias = from.alias?.name;
      if (alias) {
        tableAliases.set(alias.toLowerCase(), name ? name.toLowerCase() : null);
      }
      v.super().fromCall(from);
    },
    fromStatement: (from) => {
      if (from.alias) {
        tableAliases.set(from.alias.toLowerCase(), null);
      }
      v.super().fromStatement(from);
    },
    selectionColumn: (column) => {
      if (column.alias?.name) {
        selectAliases.add(column.alias.name.toLowerCase());
      }
      v.super().selectionColumn(column);
    },
    ref: (ref) => {
      const table = normalizeTableName(
        ref.table?.name ?? null,
        ref.table?.schema ?? null,
      );
      if (table) {
        columns.add(`${table.toLowerCase()}.${ref.name}`);
      } else {
        columns.add(String(ref.name));
      }
      v.super().ref(ref);
    },
  }));

  visitor.statement(statement);

  result.tables = Array.from(tables);
  result.columns = Array.from(columns);
  result.tableAliases = Object.fromEntries(tableAliases);
  result.cteNames = Array.from(cteNames);
  result.selectAliases = Array.from(selectAliases);

  return result;
}

export function validateAgainstDataset(
  parsed: ParsedQuery,
  allowedTables: Set<string>,
  allowedColumns: Map<string, Set<string>>,
): string[] {
  const errors: string[] = [];
  const normalizedTables = new Set(Array.from(allowedTables).map((t) => t.toLowerCase()));
  const normalizedColumns = new Map(
    Array.from(allowedColumns.entries()).map(([table, cols]) => [
      table.toLowerCase(),
      new Set(Array.from(cols).map((col) => col.toLowerCase())),
    ]),
  );
  const cteNames = new Set(parsed.cteNames.map((name) => name.toLowerCase()));
  const selectAliases = new Set(parsed.selectAliases.map((name) => name.toLowerCase()));
  const tableAliases = new Map(
    Object.entries(parsed.tableAliases).map(([alias, table]) => [
      alias.toLowerCase(),
      table ? table.toLowerCase() : null,
    ]),
  );

  for (const table of parsed.tables) {
    if (!normalizedTables.has(table.toLowerCase())) {
      errors.push(`Table "${table}" is not in the allowed dataset`);
    }
  }

  for (const column of parsed.columns) {
    if (column === "*") continue;

    const [table, col] = column.includes(".") ? column.split(".") : [null, column];

    if (!table) {
      if (col === "*") continue;
      const normalizedColumn = col.toLowerCase();
      if (selectAliases.has(normalizedColumn)) continue;
      const isAllowed = Array.from(normalizedColumns.values()).some((cols) =>
        cols.has(normalizedColumn),
      );
      if (!isAllowed) {
        errors.push(`Column "${column}" is not accessible`);
      }
      continue;
    }

    if (col === "*") {
      continue;
    }

    const normalizedTable = table.toLowerCase();
    if (cteNames.has(normalizedTable)) {
      continue;
    }

    const resolvedTable = tableAliases.has(normalizedTable)
      ? tableAliases.get(normalizedTable)
      : normalizedTable;

    if (!resolvedTable) {
      continue;
    }

    const cols = normalizedColumns.get(resolvedTable);
    if (!cols) {
      errors.push(`Column "${column}" is not accessible`);
      continue;
    }

    const normalizedColumn = col.toLowerCase();
    if (!cols.has(normalizedColumn) && !cols.has("*")) {
      errors.push(`Column "${column}" is not accessible`);
    }
  }

  return errors;
}
