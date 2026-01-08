import { format, parse } from "date-fns";
import type { CategorizedError } from "~/features/imports/error-analyzer";
import type { JsonRecord } from "~/shared/lib/json";

export interface AutofixResult {
  success: boolean;
  modifiedRows: number[];
  changes: Array<{
    row: number;
    column: string;
    oldValue: string;
    newValue: string;
  }>;
  rows: JsonRecord[];
  error?: string;
}

const cloneRows = (rows: JsonRecord[]) => rows.map((row) => ({ ...row }));

const toStringValue = (value: unknown) =>
  value === null || value === undefined ? "" : String(value);

const parseDateValue = (value: string, formatPattern: string) => {
  const parsed = parse(value, formatPattern, new Date());
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

export const swapColumns = (
  rows: JsonRecord[],
  col1: string,
  col2: string,
): AutofixResult => {
  const nextRows = cloneRows(rows);
  const changes: AutofixResult["changes"] = [];
  const modifiedRows = new Set<number>();

  nextRows.forEach((row, index) => {
    const rowNumber = index + 1;
    const value1 = row[col1];
    const value2 = row[col2];
    if (value1 === undefined && value2 === undefined) return;
    row[col1] = value2;
    row[col2] = value1;
    changes.push({
      row: rowNumber,
      column: col1,
      oldValue: toStringValue(value1),
      newValue: toStringValue(value2),
    });
    changes.push({
      row: rowNumber,
      column: col2,
      oldValue: toStringValue(value2),
      newValue: toStringValue(value1),
    });
    modifiedRows.add(rowNumber);
  });

  return {
    success: true,
    modifiedRows: Array.from(modifiedRows),
    changes,
    rows: nextRows,
  };
};

export const convertDateFormat = (
  rows: JsonRecord[],
  column: string,
  fromFormat: string,
  toFormat: string,
): AutofixResult => {
  const nextRows = cloneRows(rows);
  const changes: AutofixResult["changes"] = [];
  const modifiedRows = new Set<number>();

  nextRows.forEach((row, index) => {
    const raw = row[column];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) return;
    const parsed = parseDateValue(value, fromFormat);
    if (!parsed) return;
    const formatted = format(parsed, toFormat);
    if (formatted === value) return;
    row[column] = formatted;
    changes.push({
      row: index + 1,
      column,
      oldValue: value,
      newValue: formatted,
    });
    modifiedRows.add(index + 1);
  });

  return {
    success: true,
    modifiedRows: Array.from(modifiedRows),
    changes,
    rows: nextRows,
  };
};

export const normalizeBoolean = (
  rows: JsonRecord[],
  column: string,
  trueValues: string[],
  falseValues: string[],
): AutofixResult => {
  const nextRows = cloneRows(rows);
  const changes: AutofixResult["changes"] = [];
  const modifiedRows = new Set<number>();
  const truthy = new Set(trueValues.map((value) => value.toLowerCase()));
  const falsy = new Set(falseValues.map((value) => value.toLowerCase()));

  nextRows.forEach((row, index) => {
    const raw = row[column];
    const value = typeof raw === "string" ? raw.trim() : String(raw ?? "");
    if (!value) return;
    const normalized = value.toLowerCase();
    if (!truthy.has(normalized) && !falsy.has(normalized)) return;
    const nextValue = truthy.has(normalized) ? "true" : "false";
    if (nextValue === value) return;
    row[column] = nextValue;
    changes.push({
      row: index + 1,
      column,
      oldValue: value,
      newValue: nextValue,
    });
    modifiedRows.add(index + 1);
  });

  return {
    success: true,
    modifiedRows: Array.from(modifiedRows),
    changes,
    rows: nextRows,
  };
};

export const trimWhitespace = (rows: JsonRecord[], column: string): AutofixResult => {
  const nextRows = cloneRows(rows);
  const changes: AutofixResult["changes"] = [];
  const modifiedRows = new Set<number>();

  nextRows.forEach((row, index) => {
    const raw = row[column];
    if (typeof raw !== "string") return;
    const trimmed = raw.trim();
    if (trimmed === raw) return;
    row[column] = trimmed;
    changes.push({
      row: index + 1,
      column,
      oldValue: raw,
      newValue: trimmed,
    });
    modifiedRows.add(index + 1);
  });

  return {
    success: true,
    modifiedRows: Array.from(modifiedRows),
    changes,
    rows: nextRows,
  };
};

export const applyAutofix = (
  rows: JsonRecord[],
  error: CategorizedError,
): AutofixResult => {
  if (!error.autofix) {
    return { success: false, modifiedRows: [], changes: [], rows, error: "No autofix." };
  }
  const { type, params } = error.autofix;
  if (type === "swap_columns") {
    return swapColumns(rows, String(params["col1"]), String(params["col2"]));
  }
  if (type === "convert_date_format") {
    return convertDateFormat(
      rows,
      String(params["column"]),
      String(params["fromFormat"]),
      String(params["toFormat"]),
    );
  }
  if (type === "normalize_boolean") {
    return normalizeBoolean(
      rows,
      String(params["column"]),
      (params["trueValues"] as string[]) ?? ["true", "yes", "1"],
      (params["falseValues"] as string[]) ?? ["false", "no", "0"],
    );
  }
  if (type === "trim_whitespace") {
    return trimWhitespace(rows, String(params["column"]));
  }
  return {
    success: false,
    modifiedRows: [],
    changes: [],
    rows,
    error: "Unsupported autofix.",
  };
};
