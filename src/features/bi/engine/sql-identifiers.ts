const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export const assertSafeIdentifier = (value: string, label = "identifier") => {
  if (!IDENTIFIER_PATTERN.test(value)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return value;
};

export const quoteIdentifier = (value: string, label?: string) =>
  `"${assertSafeIdentifier(value, label).replace(/"/g, '""')}"`;

export const qualifyIdentifier = (table: string, column: string) =>
  `${quoteIdentifier(table, "table")}.${quoteIdentifier(column, "column")}`;
