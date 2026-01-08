/**
 * Pattern detection utilities for import analysis.
 *
 * These functions detect common data patterns in import values to:
 * - Identify likely column types
 * - Detect mismatched mappings
 * - Calculate autofix confidence
 */

// Email pattern: basic RFC-compliant check
export const isEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

// ISO date: YYYY-MM-DD
export const isIsoDate = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value.trim());

// US date: M/D/YYYY or MM/DD/YYYY
export const isUsDate = (value: string): boolean =>
  /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value.trim());

// European date: D.M.YYYY or DD.MM.YYYY
export const isEuDate = (value: string): boolean =>
  /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(value.trim());

// Any common date format
export const isDateLike = (value: string): boolean =>
  isIsoDate(value) || isUsDate(value) || isEuDate(value);

// Number: integers and decimals, with optional thousands separators
export const isNumber = (value: string): boolean => {
  const cleaned = value.trim();
  // Allow negative, thousands separators, decimal point
  return /^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(cleaned) || /^-?\d+(\.\d+)?$/.test(cleaned);
};

// Boolean-like values
const BOOLEAN_TRUE = new Set(["true", "yes", "y", "1", "on", "enabled"]);
const BOOLEAN_FALSE = new Set(["false", "no", "n", "0", "off", "disabled"]);
export const isBoolean = (value: string): boolean => {
  const lower = value.trim().toLowerCase();
  return BOOLEAN_TRUE.has(lower) || BOOLEAN_FALSE.has(lower);
};

// Phone number: various formats, minimum 7 digits
export const isPhone = (value: string): boolean => {
  const cleaned = value.trim();
  // Match common phone patterns: +1 (123) 456-7890, 123-456-7890, etc.
  if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(cleaned)) return false;
  // Must have at least 7 digits
  const digits = cleaned.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
};

// Currency: $, €, £, ¥ with proper formatting
export const isCurrency = (value: string): boolean => {
  const cleaned = value.trim();
  // Match: $1,234.56, €123.45, 1234.56$, etc.
  return (
    /^[$€£¥₹CAD]?\s*-?\d{1,3}(,\d{3})*(\.\d{1,2})?$/.test(cleaned) ||
    /^-?\d{1,3}(,\d{3})*(\.\d{1,2})?\s*[$€£¥₹]?$/.test(cleaned)
  );
};

// Percentage: 75%, 0.75, 75.5%
export const isPercentage = (value: string): boolean => {
  const cleaned = value.trim();
  return (
    /^-?\d+(\.\d+)?%$/.test(cleaned) || // Explicit percent sign
    /^0\.\d+$/.test(cleaned)
  ); // Decimal form (0.XX)
};

// URL: http/https links
export const isUrl = (value: string): boolean => {
  const cleaned = value.trim().toLowerCase();
  return /^https?:\/\/[^\s]+\.[^\s]+/.test(cleaned);
};

// Postal code: US (12345, 12345-6789) and Canada (A1A 1A1)
export const isPostalCode = (value: string): boolean => {
  const cleaned = value.trim().toUpperCase();
  // Canada: A1A 1A1 or A1A1A1
  if (/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(cleaned)) return true;
  // US: 12345 or 12345-6789
  if (/^\d{5}(-\d{4})?$/.test(cleaned)) return true;
  return false;
};

// UUID: standard UUID format
export const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());

/**
 * All pattern detectors mapped by type.
 */
export const patterns = {
  email: isEmail,
  isoDate: isIsoDate,
  usDate: isUsDate,
  euDate: isEuDate,
  dateLike: isDateLike,
  number: isNumber,
  boolean: isBoolean,
  phone: isPhone,
  currency: isCurrency,
  percentage: isPercentage,
  url: isUrl,
  postalCode: isPostalCode,
  uuid: isUuid,
} as const;

export type PatternType = keyof typeof patterns;

/**
 * Analyze values to determine pattern match ratios.
 */
export function analyzePatterns(values: string[]): Record<PatternType, number> {
  const nonEmpty = values.filter((v) => v && v.trim());
  if (nonEmpty.length === 0) {
    return Object.fromEntries(Object.keys(patterns).map((k) => [k, 0])) as Record<
      PatternType,
      number
    >;
  }

  const total = nonEmpty.length;
  return Object.fromEntries(
    Object.entries(patterns).map(([key, detector]) => {
      const matches = nonEmpty.filter(detector).length;
      return [key, matches / total];
    }),
  ) as Record<PatternType, number>;
}

/**
 * Find the best matching pattern for a set of values.
 */
export function detectBestPattern(
  values: string[],
  threshold = 0.7,
): { pattern: PatternType; ratio: number } | null {
  const ratios = analyzePatterns(values);
  let best: { pattern: PatternType; ratio: number } | null = null;

  for (const [pattern, ratio] of Object.entries(ratios)) {
    if (ratio >= threshold && (!best || ratio > best.ratio)) {
      best = { pattern: pattern as PatternType, ratio };
    }
  }

  return best;
}

/**
 * Check if column header hints at a specific type.
 */
export function getHeaderHint(header: string): PatternType | null {
  const lower = header.toLowerCase().replace(/[^a-z]/g, "");

  // Direct matches
  if (lower.includes("email") || lower.includes("mail")) return "email";
  if (lower.includes("phone") || lower.includes("tel") || lower.includes("mobile"))
    return "phone";
  if (lower.includes("date") || lower.includes("time") || lower.includes("dob"))
    return "dateLike";
  if (lower.includes("url") || lower.includes("link") || lower.includes("website"))
    return "url";
  if (lower.includes("zip") || lower.includes("postal")) return "postalCode";
  if (lower.includes("percent") || lower.includes("rate")) return "percentage";
  if (lower.includes("price") || lower.includes("cost") || lower.includes("amount"))
    return "currency";
  if (lower.includes("uuid") || lower.includes("guid")) return "uuid";
  if (lower === "id" || lower.endsWith("id")) return "uuid";

  return null;
}

/**
 * Calculate confidence score for an autofix suggestion.
 */
export function calculateConfidence(params: {
  patternMatchRatio: number;
  headerHintMatch: boolean;
  conflictingPatterns: number;
  sampleSize: number;
}): number {
  // Base confidence from pattern match ratio (60% weight)
  let confidence = params.patternMatchRatio * 0.6;

  // Bonus for header hint matching (up to +20%)
  if (params.headerHintMatch) {
    confidence += 0.2;
  }

  // Penalty for conflicting patterns (multiple patterns match well)
  if (params.conflictingPatterns > 1) {
    confidence -= 0.15;
  }

  // Penalty for small sample size
  if (params.sampleSize < 5) {
    confidence -= 0.1;
  } else if (params.sampleSize >= 20) {
    // Bonus for large sample
    confidence += 0.05;
  }

  return Math.max(0, Math.min(1, confidence));
}
