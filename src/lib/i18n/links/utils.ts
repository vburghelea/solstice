import { i18nConfig, type SupportedLanguage } from "~/lib/i18n/config";
import { detectLanguageFromPath } from "~/lib/i18n/detector";
import type { LocalizedLinkConfig } from "./schema";

/**
 * Checks if a URL is external (outside the current domain)
 */
export function isExternalUrl(url: string): boolean {
  if (!url) return false;

  // Skip protocol-relative URLs
  if (url.startsWith("//")) return true;

  // Check for protocol
  if (url.startsWith("http://") || url.startsWith("https://")) return true;

  // Check for mailto, tel, and other protocols
  if (url.includes(":") && !url.startsWith("/")) return true;

  return false;
}

/**
 * Checks if a URL should have a language prefix
 */
export function shouldHaveLanguagePrefix(
  url: string,
  excludeLanguagePrefix = false,
): boolean {
  // External URLs never get language prefixes
  if (isExternalUrl(url)) return false;

  // Explicitly excluded
  if (excludeLanguagePrefix) return false;

  // Absolute paths starting with / (but not //)
  if (url.startsWith("/") && !url.startsWith("//")) return true;

  return false;
}

/**
 * Normalizes a path by ensuring it has proper language prefix
 */
export function normalizeLocalizedPath(
  to: string,
  currentLanguage: SupportedLanguage,
  options: {
    preserveLanguage?: boolean;
    targetLanguage?: SupportedLanguage;
    excludeLanguagePrefix?: boolean;
  } = {},
): string {
  if (!shouldHaveLanguagePrefix(to, options.excludeLanguagePrefix)) {
    return to;
  }

  const targetLanguage = options.targetLanguage || currentLanguage;

  // Remove leading slash for consistent processing
  const path = to.startsWith("/") ? to.slice(1) : to;

  // Check if path already starts with a language code
  const segments = path.split("/");
  const firstSegment = segments[0];

  if (i18nConfig.supportedLanguages.includes(firstSegment as SupportedLanguage)) {
    // Path already has language prefix
    if (options.preserveLanguage !== false && !options.targetLanguage) {
      // Keep existing language
      return to;
    } else {
      // Replace with target language
      segments[0] = targetLanguage;
      return "/" + segments.join("/");
    }
  }

  // Add language prefix if not default language or explicitly requested
  if (targetLanguage !== i18nConfig.defaultLanguage || options.preserveLanguage) {
    return `/${targetLanguage}${path.startsWith("/") ? path : `/${path}`}`;
  }

  return to.startsWith("/") ? to : `/${to}`;
}

/**
 * Validates a route configuration
 */
export function validateRouteConfig(config: LocalizedLinkConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.to) {
    errors.push("Route 'to' property is required");
  }

  if (config.params && typeof config.params !== "object") {
    errors.push("Route 'params' must be an object");
  }

  if (config.search && typeof config.search !== "object") {
    errors.push("Route 'search' must be an object");
  }

  // Check for translation key conflicts
  if (config.translationKey && typeof config.children !== "undefined") {
    errors.push("Cannot use both translationKey and children prop");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Resolves route parameters in a path
 */
export function resolveRouteParams(
  to: string,
  params?: Record<string, string | number | boolean>,
): string {
  if (!params) return to;

  let path = to;

  for (const [key, value] of Object.entries(params)) {
    const token = `$${key}`;
    if (path.includes(token)) {
      path = path.replaceAll(token, encodeURIComponent(String(value)));
    }
  }

  // Check for unresolved parameters
  if (path.includes("$")) {
    const missingParams = path.match(/\$\w+/g) || [];
    throw new Error(`Missing parameter values for: ${missingParams.join(", ")}`);
  }

  return path;
}

/**
 * Builds search parameters from an object
 */
export function buildSearchParams(
  search?: Record<string, string | number | boolean | undefined>,
): string {
  if (!search) return "";

  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === false) continue;

    if (value === true) {
      query.set(key, "1");
    } else {
      query.set(key, String(value));
    }
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Detects if a path should be excluded from language routing
 */
export function isExcludedFromLanguageRouting(path: string): boolean {
  // API routes
  if (path.startsWith("/api/")) return true;

  // Static assets
  if (path.startsWith("/static/") || path.startsWith("/assets/")) return true;

  // File downloads
  if (/\.(pdf|zip|jpg|jpeg|png|gif|svg|ico|css|js)$/i.test(path)) return true;

  // Webhook endpoints
  if (path.startsWith("/webhooks/")) return true;

  return false;
}

/**
 * Gets the optimal path for localization based on current context
 */
export function getOptimalLocalizedPath(
  to: string,
  currentPath: string,
  options: {
    preserveLanguage?: boolean;
    targetLanguage?: SupportedLanguage;
    excludeLanguagePrefix?: boolean;
  } = {},
): {
  path: string;
  language: SupportedLanguage;
  shouldLocalize: boolean;
} {
  // Detect current language from path
  const detectedLanguage =
    detectLanguageFromPath(currentPath) || i18nConfig.defaultLanguage;

  // Check if this path should be localized
  const shouldLocalize = !isExcludedFromLanguageRouting(to) && !isExternalUrl(to);

  if (!shouldLocalize) {
    return {
      path: to,
      language: detectedLanguage,
      shouldLocalize: false,
    };
  }

  const targetLanguage = options.targetLanguage || detectedLanguage;
  const localizedPath = normalizeLocalizedPath(to, targetLanguage, options);

  return {
    path: localizedPath,
    language: targetLanguage,
    shouldLocalize: true,
  };
}
