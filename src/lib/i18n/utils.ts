import { SupportedLanguage } from "./config";
import { LanguageInfo } from "./types";

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
