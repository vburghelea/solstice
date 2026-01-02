import type { DatasetField, FormatOptions } from "../bi.types";
import type { PivotMeasureMeta } from "../engine/pivot-aggregator";
import { getMetric } from "../semantic/metrics.config";

export type MeasureFormatter = (value: number | null) => string;

const resolveLocale = (locale?: string) =>
  locale ?? (typeof navigator !== "undefined" ? navigator.language : "en-US");

const applySeparators = (value: string, separator?: string) => {
  if (!separator || separator === ",") return value;
  return value.replace(/,/g, separator);
};

const resolveFormat = (
  measure: PivotMeasureMeta,
  fieldsById: Map<string, DatasetField>,
): { formatType?: DatasetField["formatType"]; formatOptions?: FormatOptions } => {
  const metricId = measure.key.startsWith("metric:") ? measure.key.slice(7) : null;
  const metric = metricId ? getMetric(metricId) : undefined;
  const resolved: {
    formatType?: DatasetField["formatType"];
    formatOptions?: FormatOptions;
  } = {};
  if (metric?.formatType || metric?.formatOptions) {
    if (metric.formatType) resolved.formatType = metric.formatType;
    if (metric.formatOptions) resolved.formatOptions = metric.formatOptions;
    return resolved;
  }

  const field = measure.field ? fieldsById.get(measure.field) : undefined;
  if (field?.formatType) resolved.formatType = field.formatType;
  if (field?.formatOptions) resolved.formatOptions = field.formatOptions;
  return resolved;
};

export const formatMeasureValue = (
  value: number | null,
  formatType?: DatasetField["formatType"],
  formatOptions?: FormatOptions,
): string => {
  if (value === null || value === undefined) return "-";
  if (!Number.isFinite(value)) return "-";

  const decimals = formatOptions?.decimals ?? (Number.isInteger(value) ? 0 : 2);

  const locale = resolveLocale();

  if (formatType === "percent") {
    const formatter = new Intl.NumberFormat(locale, {
      style: "percent",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return formatter.format(value);
  }

  if (formatType === "currency") {
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: formatOptions?.currency ?? "USD",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return formatter.format(value);
  }

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  });
  const formatted = applySeparators(
    formatter.format(value),
    formatOptions?.thousandsSeparator,
  );
  const prefixed = formatOptions?.prefix
    ? `${formatOptions.prefix}${formatted}`
    : formatted;
  return formatOptions?.suffix ? `${prefixed}${formatOptions.suffix}` : prefixed;
};

export const buildMeasureFormatters = (
  measures: PivotMeasureMeta[],
  fieldsById: Map<string, DatasetField>,
): Map<string, MeasureFormatter> => {
  const formatters = new Map<string, MeasureFormatter>();
  for (const measure of measures) {
    const { formatType, formatOptions } = resolveFormat(measure, fieldsById);
    formatters.set(measure.key, (value) =>
      formatMeasureValue(value, formatType, formatOptions),
    );
  }
  return formatters;
};

export const formatDimensionValue = (
  value: unknown,
  field?: DatasetField,
  locale?: string,
): string => {
  if (value === null || value === undefined || value === "") return "-";
  const resolvedLocale = resolveLocale(locale);

  if (field?.enumValues) {
    const match = field.enumValues.find((entry) => entry.value === String(value));
    return match?.label ?? String(value);
  }

  const isDateField = field?.formatType === "date" || field?.dataType === "date";
  const isDateTimeField =
    field?.formatType === "datetime" || field?.dataType === "datetime";

  if (isDateField || isDateTimeField) {
    const date =
      value instanceof Date
        ? value
        : new Date(typeof value === "string" ? value : String(value));
    if (!Number.isNaN(date.getTime())) {
      return isDateTimeField
        ? date.toLocaleString(resolvedLocale)
        : date.toLocaleDateString(resolvedLocale);
    }
  }

  return String(value);
};
