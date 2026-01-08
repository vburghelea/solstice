import { createId } from "@paralleldrive/cuid2";
import type { FormDefinition } from "~/features/forms/forms.schemas";
import { validateFormPayload } from "~/features/forms/forms.utils";
import {
  buildImportFieldLookup,
  type ImportFieldLookup,
  type ImportParseError,
  parseImportRow,
} from "~/features/imports/imports.utils";
import type { JsonRecord } from "~/shared/lib/json";

export type ErrorCategory =
  | "structural"
  | "data_quality"
  | "completeness"
  | "referential";

export type AutofixType =
  | "swap_columns"
  | "convert_date_format"
  | "normalize_boolean"
  | "trim_whitespace"
  | "map_column";

export interface CategorizedError {
  id: string;
  category: ErrorCategory;
  severity: "error" | "warning";
  code: string;
  summary: string;
  details: string;
  affectedRows: number[];
  affectedColumns: string[];
  sampleValues: string[];
  autofix?: {
    type: AutofixType;
    confidence: number;
    preview: string;
    params: Record<string, unknown>;
  };
}

export interface AnalysisResult {
  errors: CategorizedError[];
  warnings: CategorizedError[];
  stats: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
  };
  canProceed: boolean;
  suggestedAutofixes: string[];
}

type RowIssue = {
  rowNumber: number;
  fieldKey: string | null;
  errorType: string;
  message: string;
  rawValue: string | null;
};

const toKey = (fieldKey: string | null, errorType: string) =>
  `${fieldKey ?? "row"}:${errorType}`;

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isUsDate = (value: string) => /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value);
const isNumberLike = (value: string) =>
  /^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(value.trim()) || /^-?\d+(\.\d+)?$/.test(value);
const isBooleanLike = (value: string) =>
  ["true", "false", "yes", "no", "y", "n", "1", "0"].includes(value.toLowerCase());

const detectDateFormatMismatch = (
  rows: JsonRecord[],
  mapping: Record<string, string>,
  fieldLookup: ImportFieldLookup,
): CategorizedError[] => {
  const errors: CategorizedError[] = [];
  Object.entries(mapping).forEach(([header, fieldKey]) => {
    if (!fieldKey) return;
    const field = fieldLookup.get(fieldKey);
    if (!field || field.type !== "date") return;
    const values = rows
      .map((row) => row[header])
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);
    if (values.length === 0) return;
    const usDateCount = values.filter(isUsDate).length;
    const isoDateCount = values.filter(isIsoDate).length;
    if (usDateCount > 0 && isoDateCount === 0) {
      errors.push({
        id: createId(),
        category: "data_quality",
        severity: "error",
        code: "DATE_FORMAT_MISMATCH",
        summary: `Date format mismatch in "${field.label}"`,
        details: `Expected YYYY-MM-DD. Detected MM/DD/YYYY in ${usDateCount} rows.`,
        affectedRows: [],
        affectedColumns: [header],
        sampleValues: values.slice(0, 3),
        autofix: {
          type: "convert_date_format",
          confidence: 0.9,
          preview: `Convert ${usDateCount} values from MM/DD/YYYY to YYYY-MM-DD`,
          params: {
            column: header,
            fromFormat: "MM/dd/yyyy",
            toFormat: "yyyy-MM-dd",
          },
        },
      });
    }
  });
  return errors;
};

const detectMappingMismatch = (
  rows: JsonRecord[],
  mapping: Record<string, string>,
  fieldLookup: ImportFieldLookup,
): CategorizedError[] => {
  const errors: CategorizedError[] = [];
  const columnStats = Object.entries(mapping)
    .filter(([, fieldKey]) => Boolean(fieldKey))
    .map(([header, fieldKey]) => {
      const values = rows
        .map((row) => row[header])
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean);
      const total = values.length || 1;
      return {
        header,
        fieldKey: fieldKey ?? "",
        matches: {
          email: values.filter(isEmail).length / total,
          date: values.filter(isIsoDate).length / total,
          usDate: values.filter(isUsDate).length / total,
          number: values.filter(isNumberLike).length / total,
          boolean: values.filter(isBooleanLike).length / total,
        },
      };
    });

  columnStats.forEach((stat) => {
    const field = fieldLookup.get(stat.fieldKey);
    if (!field) return;
    if (field.type === "email" && stat.matches.email < 0.2) {
      const candidate = columnStats.find(
        (other) => other.fieldKey !== stat.fieldKey && other.matches.email > 0.8,
      );
      if (candidate) {
        errors.push({
          id: createId(),
          category: "structural",
          severity: "error",
          code: "MAPPING_MISMATCH",
          summary: `Column "${stat.header}" does not look like emails`,
          details: `Values in "${candidate.header}" look like emails. Swap mappings?`,
          affectedRows: [],
          affectedColumns: [stat.header, candidate.header],
          sampleValues: [],
          autofix: {
            type: "map_column",
            confidence: 0.85,
            preview: `Swap mapping between "${stat.header}" and "${candidate.header}"`,
            params: {
              from: stat.header,
              to: candidate.header,
            },
          },
        });
      }
    }
    if (field.type === "date" && stat.matches.date < 0.2 && stat.matches.usDate < 0.2) {
      const candidate = columnStats.find(
        (other) =>
          other.fieldKey !== stat.fieldKey &&
          (other.matches.date > 0.8 || other.matches.usDate > 0.8),
      );
      if (candidate) {
        errors.push({
          id: createId(),
          category: "structural",
          severity: "error",
          code: "MAPPING_MISMATCH",
          summary: `Column "${stat.header}" does not look like dates`,
          details: `Values in "${candidate.header}" look like dates. Swap mappings?`,
          affectedRows: [],
          affectedColumns: [stat.header, candidate.header],
          sampleValues: [],
          autofix: {
            type: "map_column",
            confidence: 0.85,
            preview: `Swap mapping between "${stat.header}" and "${candidate.header}"`,
            params: {
              from: stat.header,
              to: candidate.header,
            },
          },
        });
      }
    }
  });

  return errors;
};

export const analyzeImport = (params: {
  headers: string[];
  rows: JsonRecord[];
  schema: FormDefinition;
  mapping: Record<string, string>;
  rawErrors?: ImportParseError[];
  organizationId?: string;
}): AnalysisResult => {
  const fieldLookup = buildImportFieldLookup(params.schema);
  const issues: RowIssue[] = [];

  params.rows.forEach((row, index) => {
    const { payload, parseErrors } = parseImportRow(row, params.mapping, fieldLookup);
    const validation = validateFormPayload(params.schema, payload);
    const rowNumber = index + 1;

    parseErrors.forEach((error) => {
      issues.push({
        rowNumber,
        fieldKey: error.fieldKey,
        errorType: error.errorType,
        message: error.message,
        rawValue: error.rawValue,
      });
    });

    validation.validationErrors.forEach((error) => {
      issues.push({
        rowNumber,
        fieldKey: error.field,
        errorType: "validation",
        message: error.message,
        rawValue: String(payload[error.field] ?? ""),
      });
    });

    validation.missingFields.forEach((fieldKey) => {
      issues.push({
        rowNumber,
        fieldKey,
        errorType: "required",
        message: "Missing required field",
        rawValue: String(payload[fieldKey] ?? ""),
      });
    });

    if (params.organizationId && payload["organizationId"]) {
      if (String(payload["organizationId"]) !== params.organizationId) {
        issues.push({
          rowNumber,
          fieldKey: "organizationId",
          errorType: "referential",
          message: "Organization ID does not match selected organization",
          rawValue: String(payload["organizationId"]),
        });
      }
    }
  });

  const structuralErrors: CategorizedError[] = [];
  const mappedFields = new Set(Object.values(params.mapping).filter(Boolean));
  params.schema.fields.forEach((field) => {
    if (!field.required) return;
    if (mappedFields.has(field.key)) return;
    structuralErrors.push({
      id: createId(),
      category: "structural",
      severity: "error",
      code: "REQUIRED_FIELD_NOT_MAPPED",
      summary: `Missing required column for "${field.label}"`,
      details: "Map an existing column or add the column to your upload.",
      affectedRows: [],
      affectedColumns: [],
      sampleValues: [],
    });
  });

  structuralErrors.push(
    ...detectMappingMismatch(params.rows, params.mapping, fieldLookup),
  );

  const dateMismatchErrors = detectDateFormatMismatch(
    params.rows,
    params.mapping,
    fieldLookup,
  );

  const grouped = new Map<string, CategorizedError>();

  issues.forEach((issue) => {
    const category: ErrorCategory =
      issue.errorType === "required"
        ? "completeness"
        : issue.errorType === "referential"
          ? "referential"
          : "data_quality";
    const key = `${category}:${toKey(issue.fieldKey, issue.errorType)}`;
    const existing = grouped.get(key);
    const column = issue.fieldKey
      ? Object.entries(params.mapping).find(
          ([, fieldKey]) => fieldKey === issue.fieldKey,
        )?.[0]
      : null;
    if (!existing) {
      grouped.set(key, {
        id: createId(),
        category,
        severity: category === "data_quality" ? "error" : "warning",
        code: issue.errorType.toUpperCase(),
        summary: issue.message,
        details: issue.message,
        affectedRows: [issue.rowNumber],
        affectedColumns: column ? [column] : [],
        sampleValues: issue.rawValue ? [issue.rawValue] : [],
      });
    } else {
      existing.affectedRows.push(issue.rowNumber);
      if (issue.rawValue && existing.sampleValues.length < 3) {
        existing.sampleValues.push(issue.rawValue);
      }
    }
  });

  dateMismatchErrors.forEach((error) => {
    grouped.set(`data_quality:${error.code}:${error.summary}`, error);
  });

  const errors = [...structuralErrors, ...grouped.values()];
  const warnings: CategorizedError[] = [];

  const suggestedAutofixes = errors
    .filter((error) => error.autofix && error.autofix.confidence >= 0.8)
    .map((error) => error.id);

  const errorRows = new Set<number>();
  errors.forEach((error) => {
    error.affectedRows.forEach((row) => errorRows.add(row));
  });

  const totalRows = params.rows.length;
  const validRows = Math.max(0, totalRows - errorRows.size);

  return {
    errors,
    warnings,
    stats: {
      totalRows,
      validRows,
      errorRows: errorRows.size,
      warningRows: warnings.length,
    },
    canProceed: errors.length === 0,
    suggestedAutofixes,
  };
};
