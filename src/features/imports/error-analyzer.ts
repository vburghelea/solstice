import { createId } from "@paralleldrive/cuid2";
import type { FormDefinition } from "~/features/forms/forms.schemas";
import { validateFormPayload } from "~/features/forms/forms.utils";
import {
  buildImportFieldLookup,
  type ImportFieldLookup,
  type ImportParseError,
  parseImportRow,
} from "~/features/imports/imports.utils";
import {
  analyzePatterns,
  calculateConfidence,
  getHeaderHint,
  isBoolean,
  isCurrency,
  isDateLike,
  isEmail,
  isEuDate,
  isIsoDate,
  isNumber,
  isPercentage,
  isPhone,
  isPostalCode,
  isUrl,
  isUsDate,
  isUuid,
  type PatternType,
} from "~/features/imports/pattern-detectors";
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
    confidenceReason?: string;
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

/**
 * Map form field types to their expected pattern types.
 */
const FIELD_TYPE_TO_PATTERN: Record<string, PatternType[]> = {
  email: ["email"],
  date: ["isoDate", "usDate", "euDate", "dateLike"],
  number: ["number", "currency", "percentage"],
  checkbox: ["boolean"],
  phone: ["phone"],
  text: ["phone", "url", "postalCode", "uuid"],
  url: ["url"],
  tel: ["phone"],
};

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

    const patternRatios = analyzePatterns(values);
    const usDateRatio = patternRatios.usDate;
    const euDateRatio = patternRatios.euDate;
    const isoDateRatio = patternRatios.isoDate;
    const headerHint = getHeaderHint(header);
    const usDateCount = values.filter(isUsDate).length;
    const euDateCount = values.filter(isEuDate).length;

    // Check for US date format (MM/DD/YYYY)
    if (usDateRatio > 0.5 && isoDateRatio < 0.2) {
      const confidence = calculateConfidence({
        patternMatchRatio: usDateRatio,
        headerHintMatch: headerHint === "dateLike",
        conflictingPatterns: euDateRatio > 0.3 ? 1 : 0,
        sampleSize: values.length,
      });

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
          confidence,
          confidenceReason: buildConfidenceReason({
            patternMatchRatio: usDateRatio,
            headerHintMatch: headerHint === "dateLike",
            sampleSize: values.length,
          }),
          preview: `Convert ${usDateCount} values from MM/DD/YYYY to YYYY-MM-DD`,
          params: {
            column: header,
            fromFormat: "MM/dd/yyyy",
            toFormat: "yyyy-MM-dd",
          },
        },
      });
    }

    // Check for EU date format (DD.MM.YYYY)
    if (euDateRatio > 0.5 && isoDateRatio < 0.2) {
      const confidence = calculateConfidence({
        patternMatchRatio: euDateRatio,
        headerHintMatch: headerHint === "dateLike",
        conflictingPatterns: usDateRatio > 0.3 ? 1 : 0,
        sampleSize: values.length,
      });

      errors.push({
        id: createId(),
        category: "data_quality",
        severity: "error",
        code: "DATE_FORMAT_MISMATCH",
        summary: `Date format mismatch in "${field.label}"`,
        details: `Expected YYYY-MM-DD. Detected DD.MM.YYYY in ${euDateCount} rows.`,
        affectedRows: [],
        affectedColumns: [header],
        sampleValues: values.slice(0, 3),
        autofix: {
          type: "convert_date_format",
          confidence,
          confidenceReason: buildConfidenceReason({
            patternMatchRatio: euDateRatio,
            headerHintMatch: headerHint === "dateLike",
            sampleSize: values.length,
          }),
          preview: `Convert ${euDateCount} values from DD.MM.YYYY to YYYY-MM-DD`,
          params: {
            column: header,
            fromFormat: "dd.MM.yyyy",
            toFormat: "yyyy-MM-dd",
          },
        },
      });
    }
  });
  return errors;
};

/**
 * Build a human-readable explanation for confidence score.
 */
const buildConfidenceReason = (params: {
  patternMatchRatio: number;
  headerHintMatch: boolean;
  sampleSize: number;
}): string => {
  const parts: string[] = [];
  const matchPercent = Math.round(params.patternMatchRatio * 100);
  parts.push(`${matchPercent}% pattern match`);
  if (params.headerHintMatch) {
    parts.push("column name matches type");
  }
  if (params.sampleSize < 5) {
    parts.push("small sample size");
  } else if (params.sampleSize >= 20) {
    parts.push("large sample size");
  }
  return parts.join(", ");
};

/**
 * Collect column statistics using centralized pattern analysis.
 */
interface ColumnStats {
  header: string;
  fieldKey: string;
  values: string[];
  patternRatios: Record<PatternType, number>;
  headerHint: PatternType | null;
}

const collectColumnStats = (
  rows: JsonRecord[],
  mapping: Record<string, string>,
): ColumnStats[] => {
  return Object.entries(mapping)
    .filter(([, fieldKey]) => Boolean(fieldKey))
    .map(([header, fieldKey]) => {
      const values = rows
        .map((row) => row[header])
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean);

      return {
        header,
        fieldKey: fieldKey ?? "",
        values,
        patternRatios: analyzePatterns(values),
        headerHint: getHeaderHint(header),
      };
    });
};

/**
 * Get the primary pattern types expected for a field type.
 */
const getExpectedPatterns = (fieldType: string): PatternType[] => {
  return FIELD_TYPE_TO_PATTERN[fieldType] ?? [];
};

/**
 * Check if column values match expected pattern for field type.
 */
const matchesExpectedPattern = (
  stats: ColumnStats,
  expectedPatterns: PatternType[],
  threshold = 0.5,
): boolean => {
  return expectedPatterns.some((pattern) => stats.patternRatios[pattern] >= threshold);
};

/**
 * Find the best matching pattern for a column.
 */
const findBestPattern = (
  stats: ColumnStats,
): { pattern: PatternType; ratio: number } | null => {
  let best: { pattern: PatternType; ratio: number } | null = null;
  for (const [pattern, ratio] of Object.entries(stats.patternRatios)) {
    if (ratio >= 0.5 && (!best || ratio > best.ratio)) {
      best = { pattern: pattern as PatternType, ratio };
    }
  }
  return best;
};

const detectMappingMismatch = (
  rows: JsonRecord[],
  mapping: Record<string, string>,
  fieldLookup: ImportFieldLookup,
): CategorizedError[] => {
  const errors: CategorizedError[] = [];
  const columnStats = collectColumnStats(rows, mapping);

  // Track which mismatches we've already reported to avoid duplicates
  const reportedSwaps = new Set<string>();

  columnStats.forEach((stat) => {
    const field = fieldLookup.get(stat.fieldKey);
    if (!field) return;

    const expectedPatterns = getExpectedPatterns(field.type);
    if (expectedPatterns.length === 0) return;

    // Check if current column matches expected pattern
    const matchesExpected = matchesExpectedPattern(stat, expectedPatterns, 0.2);
    if (matchesExpected) return;

    // Find the best pattern detected in this column
    const bestPattern = findBestPattern(stat);
    if (!bestPattern) return;

    // Look for another column that has expected pattern but doesn't match its own field
    const candidate = columnStats.find((other) => {
      if (other.fieldKey === stat.fieldKey) return false;

      // Check if other column has expected pattern for this field
      const hasExpectedPattern = matchesExpectedPattern(other, expectedPatterns, 0.7);
      if (!hasExpectedPattern) return false;

      // Check if other column doesn't match its own expected type
      const otherField = fieldLookup.get(other.fieldKey);
      if (!otherField) return false;
      const otherExpected = getExpectedPatterns(otherField.type);
      const otherMatchesOwn = matchesExpectedPattern(other, otherExpected, 0.5);

      return !otherMatchesOwn;
    });

    if (candidate) {
      // Avoid duplicate swaps
      const swapKey = [stat.header, candidate.header].sort().join(":");
      if (reportedSwaps.has(swapKey)) return;
      reportedSwaps.add(swapKey);

      // Calculate confidence dynamically
      const candidateRatio = expectedPatterns.reduce(
        (max, p) => Math.max(max, candidate.patternRatios[p]),
        0,
      );
      const conflictingPatterns = Object.values(stat.patternRatios).filter(
        (r) => r > 0.5,
      ).length;

      const confidence = calculateConfidence({
        patternMatchRatio: candidateRatio,
        headerHintMatch: candidate.headerHint !== null,
        conflictingPatterns,
        sampleSize: candidate.values.length,
      });

      const patternName = expectedPatterns[0] ?? field.type;
      errors.push({
        id: createId(),
        category: "structural",
        severity: "error",
        code: "MAPPING_MISMATCH",
        summary: `Column "${stat.header}" does not look like ${patternName}`,
        details: `Values in "${candidate.header}" look like ${patternName}. Swap mappings?`,
        affectedRows: [],
        affectedColumns: [stat.header, candidate.header],
        sampleValues: candidate.values.slice(0, 3),
        autofix: {
          type: "map_column",
          confidence,
          confidenceReason: buildConfidenceReason({
            patternMatchRatio: candidateRatio,
            headerHintMatch: candidate.headerHint !== null,
            sampleSize: candidate.values.length,
          }),
          preview: `Swap mapping between "${stat.header}" and "${candidate.header}"`,
          params: {
            from: stat.header,
            to: candidate.header,
          },
        },
      });
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
