import { SupportedLanguage } from "./config";
import { LanguageInfo } from "./types";

// Import date-fns locales for supported languages
import { de } from "date-fns/locale/de";
import { pl } from "date-fns/locale/pl";

// Import date-fns functions
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
  formatDistanceToNow,
  formatDistanceToNowStrict,
  formatRelative,
  isFuture,
  isPast,
  isValid,
  parseISO,
  type Locale,
} from "date-fns";

// Re-export commonly used date-fns functions for convenience
export type { Locale } from "date-fns";
export {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isFuture,
  isPast,
  isValid,
  parseISO,
};

/**
 * Get language information for all supported languages
 */
export function getSupportedLanguages(): LanguageInfo[] {
  return [
    {
      code: "en",
      name: "English",
      nativeName: "English",
      flag: "🇬🇧",
      isRTL: false,
    },
    {
      code: "de",
      name: "German",
      nativeName: "Deutsch",
      flag: "🇩🇪",
      isRTL: false,
    },
    {
      code: "pl",
      name: "Polish",
      nativeName: "Polski",
      flag: "🇵🇱",
      isRTL: false,
    },
  ];
}

/**
 * Get language info by code
 */
export function getLanguageInfo(code: SupportedLanguage): LanguageInfo | undefined {
  return getSupportedLanguages().find((lang) => lang.code === code);
}

/**
 * Check if a language is RTL (Right-to-Left)
 */
export function isLanguageRTL(language: SupportedLanguage): boolean {
  const langInfo = getLanguageInfo(language);
  return langInfo?.isRTL ?? false;
}

/**
 * Format a translation key with interpolation
 */
export function formatTranslation(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key]?.toString() || match;
  });
}

/**
 * Pluralization helper for English-like languages
 * Note: This is a simplified version. For complex pluralization rules,
 * you would use i18next's built-in pluralization
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : plural || singular + "s";
}

/**
 * Get relative time string
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Validate that all required translation keys exist
 */
export function validateTranslations(
  translations: Record<string, unknown>,
  namespace: string,
  requiredKeys: string[],
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  const namespaceTranslations = translations[namespace] || {};

  for (const key of requiredKeys) {
    if (!hasNestedProperty(namespaceTranslations, key)) {
      missing.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Check if a nested property exists in an object
 */
function hasNestedProperty(obj: unknown, path: string): boolean {
  return path.split(".").every((part) => {
    if (obj && typeof obj === "object" && part in obj) {
      obj = (obj as Record<string, unknown>)[part];
      return true;
    }
    return false;
  });
}

/**
 * Extract translation keys from a component tree (simplified)
 * In a real implementation, you would use AST parsing
 */
export function extractTranslationKeys(sourceCode: string): string[] {
  const keys: string[] = [];

  // Match t('key') patterns
  const tCallPattern = /t\(['"`]([^'"`]+)['"`]/g;
  let match;

  while ((match = tCallPattern.exec(sourceCode)) !== null) {
    keys.push(match[1]);
  }

  return [...new Set(keys)]; // Remove duplicates
}

/**
 * Get the default namespace for a feature
 */
export function getDefaultNamespace(feature: string): string {
  const namespaceMap: Record<string, string> = {
    auth: "auth",
    games: "games",
    events: "events",
    teams: "teams",
    navigation: "navigation",
    forms: "forms",
    errors: "errors",
  };

  return namespaceMap[feature] || "common";
}

/**
 * Sanitize translation keys for use in filenames/identifiers
 */
export function sanitizeTranslationKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
}

/**
 * Convert kebab-case to camelCase for translation keys
 */
export function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase to kebab-case for translation keys
 */
export function camelToKebabCase(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();
}

// ============================================================================
// DATE FORMATTING UTILITIES
// ============================================================================

/**
 * Get the appropriate date-fns locale for a supported language
 * @param language - The language code
 * @returns The date-fns locale object or undefined for English (default)
 */
export function getDateLocale(language?: SupportedLanguage): Locale | undefined {
  switch (language) {
    case "de":
      return de;
    case "pl":
      return pl;
    case "en":
    default:
      return undefined; // English is the default in date-fns
  }
}

/**
 * Format distance to now with locale support
 * @param date - The date to format
 * @param language - The language code for localization
 * @param options - Additional formatting options
 * @returns Localized relative time string
 */
export function formatDistanceToNowLocalized(
  date: Date | number,
  language?: SupportedLanguage,
  options?: { addSuffix?: boolean },
): string {
  const locale = getDateLocale(language);
  const baseOptions = { addSuffix: true, ...options };

  if (locale) {
    return formatDistanceToNow(date, { ...baseOptions, locale });
  }
  return formatDistanceToNow(date, baseOptions);
}

/**
 * Format distance to now (strict version) with locale support
 * @param date - The date to format
 * @param language - The language code for localization
 * @param options - Additional formatting options
 * @returns Localized relative time string (strict format)
 */
export function formatDistanceToNowStrictLocalized(
  date: Date | number,
  language?: SupportedLanguage,
  options?: { addSuffix?: boolean },
): string {
  const locale = getDateLocale(language);
  const baseOptions = { addSuffix: false, ...options };

  if (locale) {
    return formatDistanceToNowStrict(date, { ...baseOptions, locale });
  }
  return formatDistanceToNowStrict(date, baseOptions);
}

/**
 * Format relative time with locale support
 * @param date - The date to format
 * @param language - The language code for localization
 * @param baseDate - The reference date (defaults to now)
 * @returns Localized relative time string
 */
export function formatRelativeLocalized(
  date: Date | number,
  language?: SupportedLanguage,
  baseDate: Date = new Date(),
): string {
  const locale = getDateLocale(language);

  if (locale) {
    return formatRelative(date, baseDate, { locale });
  }
  return formatRelative(date, baseDate);
}

/**
 * Format a date with locale support
 * @param date - The date to format
 * @param formatStr - The format string (compatible with date-fns format)
 * @param language - The language code for localization
 * @returns Localized formatted date string
 */
export function formatDateLocalized(
  date: Date | number,
  formatStr: string,
  language?: SupportedLanguage,
): string {
  const locale = getDateLocale(language);

  if (locale) {
    return format(date, formatStr, { locale });
  }
  return format(date, formatStr);
}

/**
 * Common date formatting patterns for the platform
 */
export const DATE_FORMATS = {
  SHORT: "MMM d, yyyy", // e.g., "Jan 1, 2023"
  MEDIUM: "MMMM d, yyyy", // e.g., "January 1, 2023"
  LONG: "MMMM d, yyyy 'at' h:mm a", // e.g., "January 1, 2023 at 3:45 PM"
  FULL: "EEEE, MMMM d, yyyy 'at' h:mm a", // e.g., "Sunday, January 1, 2023 at 3:45 PM"
  TIME_ONLY: "h:mm a", // e.g., "3:45 PM"
  DATE_ONLY: "yyyy-MM-dd", // e.g., "2023-01-01"
  DATETIME_SHORT: "MM/dd/yyyy HH:mm", // e.g., "01/01/2023 15:45"
} as const;

/**
 * Format a date using platform-standard patterns
 * @param date - The date to format
 * @param pattern - The format pattern from DATE_FORMATS
 * @param language - The language code for localization
 * @returns Localized formatted date string
 */
export function formatDateWithPattern(
  date: Date | number,
  pattern: keyof typeof DATE_FORMATS,
  language?: SupportedLanguage,
): string {
  return formatDateLocalized(date, DATE_FORMATS[pattern], language);
}

/**
 * Enhanced relative time function that replaces the basic getRelativeTime
 * @param date - The date to format
 * @param language - The language code for localization
 * @returns Localized relative time string
 */
export function getRelativeTimeLocalized(
  date: Date | string,
  language?: SupportedLanguage,
): string {
  const targetDate = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNowLocalized(targetDate, language);
}

/**
 * Create a date formatter function for a specific language
 * Useful for components that need to format multiple dates with the same locale
 * @param language - The language code
 * @returns An object with formatting functions bound to the specified language
 */
export function createDateFormatter(language?: SupportedLanguage) {
  return {
    formatDistanceToNow: (date: Date | number, options?: { addSuffix?: boolean }) =>
      formatDistanceToNowLocalized(date, language, options),
    formatDistanceToNowStrict: (date: Date | number, options?: { addSuffix?: boolean }) =>
      formatDistanceToNowStrictLocalized(date, language, options),
    formatRelative: (date: Date | number, baseDate?: Date) =>
      formatRelativeLocalized(date, language, baseDate),
    format: (date: Date | number, formatStr: string) =>
      formatDateLocalized(date, formatStr, language),
    formatWithPattern: (date: Date | number, pattern: keyof typeof DATE_FORMATS) =>
      formatDateWithPattern(date, pattern, language),
    getRelativeTime: (date: Date | string) => getRelativeTimeLocalized(date, language),
  };
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Basic Usage:
import { formatDistanceToNowLocalized } from "~/lib/i18n/utils";
import { useAdminTranslation } from "~/hooks/useTypedTranslation";

function MyComponent() {
  const { currentLanguage } = useAdminTranslation();
  const createdAt = new Date(2023, 0, 1);

  return (
    <span>
      Created {formatDistanceToNowLocalized(createdAt, currentLanguage)}
    </span>
  );
}

// Using the formatter (better for multiple dates):
import { createDateFormatter } from "~/lib/i18n/utils";

function MyComponent() {
  const { currentLanguage } = useAdminTranslation();
  const formatter = createDateFormatter(currentLanguage);
  const createdAt = new Date(2023, 0, 1);
  const updatedAt = new Date(2023, 0, 15);

  return (
    <div>
      <p>Created: {formatter.formatWithPattern(createdAt, "MEDIUM")}</p>
      <p>Updated: {formatter.formatDistanceToNow(updatedAt)}</p>
    </div>
  );
}

// Using platform patterns:
function MyComponent() {
  const { currentLanguage } = useAdminTranslation();
  const eventDate = new Date(2023, 0, 1, 14, 30);

  return (
    <span>
      Event starts {formatDateWithPattern(eventDate, "LONG", currentLanguage)}
    </span>
  );
}
*/
