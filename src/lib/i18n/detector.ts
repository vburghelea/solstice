import { SupportedLanguage, i18nConfig } from "./config";
import { UserLanguagePreferences } from "./types";

/**
 * Detect language from browser Accept-Language header
 */
export function detectLanguageFromBrowser(): SupportedLanguage {
  if (typeof window === "undefined" || !navigator) return i18nConfig.defaultLanguage;

  const browserLanguages = navigator.languages || [navigator.language];

  for (const browserLang of browserLanguages) {
    // Try exact match first (e.g., 'en', 'de', 'pl')
    const exactMatch = browserLang.split("-")[0] as SupportedLanguage;
    if (i18nConfig.supportedLanguages.includes(exactMatch)) {
      return exactMatch;
    }

    // Try full match (e.g., 'en-US', 'de-DE', 'pl-PL')
    if (i18nConfig.supportedLanguages.includes(browserLang as SupportedLanguage)) {
      return browserLang as SupportedLanguage;
    }
  }

  return i18nConfig.defaultLanguage;
}

/**
 * Get language from URL path
 */
export function detectLanguageFromPath(path: string): SupportedLanguage | null {
  const pathSegments = path.split("/").filter(Boolean);
  const firstSegment = pathSegments[0];

  if (i18nConfig.supportedLanguages.includes(firstSegment as SupportedLanguage)) {
    return firstSegment as SupportedLanguage;
  }

  return null;
}

/**
 * Get language from localStorage
 */
export function getLanguageFromStorage(): SupportedLanguage | null {
  if (typeof window === "undefined" || !localStorage) return null;

  // First try localStorage
  const stored = localStorage.getItem("i18nextLng");
  if (stored && i18nConfig.supportedLanguages.includes(stored as SupportedLanguage)) {
    return stored as SupportedLanguage;
  }

  // Fallback to cookie
  return getLanguageFromCookie();
}

/**
 * Get language from cookie
 */
export function getLanguageFromCookie(): SupportedLanguage | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "i18next") {
      const cleanedValue = value.replace(/["']/g, "");
      if (i18nConfig.supportedLanguages.includes(cleanedValue as SupportedLanguage)) {
        return cleanedValue as SupportedLanguage;
      }
    }
  }

  return null;
}

/**
 * Combine detection methods with user preferences
 */
export function detectLanguage(
  path: string,
  userPreferences?: UserLanguagePreferences,
): SupportedLanguage {
  // Priority 1: URL path
  const pathLanguage = detectLanguageFromPath(path);
  if (pathLanguage) return pathLanguage;

  // Priority 2: User preferences (if provided)
  if (userPreferences) {
    if (userPreferences.autoDetectEnabled) {
      return userPreferences.preferredLanguage;
    }
  }

  // Priority 3: Storage (localStorage/cookie)
  const storageLanguage = getLanguageFromStorage() || getLanguageFromCookie();
  if (storageLanguage) return storageLanguage;

  // Priority 4: Browser detection (unless explicitly disabled)
  if (userPreferences?.autoDetectEnabled !== false) {
    return detectLanguageFromBrowser();
  }

  // Fallback
  return i18nConfig.defaultLanguage;
}

/**
 * Store language preference
 */
export function storeLanguagePreference(language: SupportedLanguage): void {
  if (typeof window === "undefined" || !localStorage) return;

  // Store in localStorage
  localStorage.setItem("i18nextLng", language);

  // Store in cookie with 1 year expiry
  if (document) {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `i18next=${language}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }
}

/**
 * Get localized URL for a given language
 */
export function getLocalizedUrl(
  originalUrl: string,
  targetLanguage: SupportedLanguage,
  currentLanguage?: SupportedLanguage,
): string {
  const segments = originalUrl.split("/").filter(Boolean);

  // Remove current language prefix if it exists
  if (currentLanguage && segments[0] === currentLanguage) {
    segments.shift();
  }

  // Add target language prefix if it's not the default language
  if (targetLanguage !== i18nConfig.defaultLanguage) {
    segments.unshift(targetLanguage);
  }

  return `/${segments.join("/")}`;
}

/**
 * Get current language from URL or other detection methods
 */
export function getCurrentLanguage(
  path: string,
  userPreferences?: UserLanguagePreferences,
): SupportedLanguage {
  return detectLanguage(path, userPreferences);
}
