/**
 * Server-side translation utilities
 * Allows translation functions to be used in server-side code (server functions, API routes, etc.)
 */

import { i18nConfig } from "./config";

// Import all available translation files (explicit imports for reliability)
// These are the files that actually exist in the project
import enAdmin from "~/lib/i18n/locales/en/admin.json";
import enAuth from "~/lib/i18n/locales/en/auth.json";
import enCampaigns from "~/lib/i18n/locales/en/campaigns.json";
import enCommon from "~/lib/i18n/locales/en/common.json";
import enEvents from "~/lib/i18n/locales/en/events.json";
import enGames from "~/lib/i18n/locales/en/games.json";
import enProfile from "~/lib/i18n/locales/en/profile.json";
import enRoles from "~/lib/i18n/locales/en/roles.json";
import enSettings from "~/lib/i18n/locales/en/settings.json";

import deAdmin from "~/lib/i18n/locales/de/admin.json";
import deAuth from "~/lib/i18n/locales/de/auth.json";
import deCampaigns from "~/lib/i18n/locales/de/campaigns.json";
import deCommon from "~/lib/i18n/locales/de/common.json";
import deEvents from "~/lib/i18n/locales/de/events.json";
import deGames from "~/lib/i18n/locales/de/games.json";
import deProfile from "~/lib/i18n/locales/de/profile.json";
import deRoles from "~/lib/i18n/locales/de/roles.json";
import deSettings from "~/lib/i18n/locales/de/settings.json";

import plAdmin from "~/lib/i18n/locales/pl/admin.json";
import plAuth from "~/lib/i18n/locales/pl/auth.json";
import plCampaigns from "~/lib/i18n/locales/pl/campaigns.json";
import plCommon from "~/lib/i18n/locales/pl/common.json";
import plEvents from "~/lib/i18n/locales/pl/events.json";
import plGames from "~/lib/i18n/locales/pl/games.json";
import plProfile from "~/lib/i18n/locales/pl/profile.json";
import plRoles from "~/lib/i18n/locales/pl/roles.json";
import plSettings from "~/lib/i18n/locales/pl/settings.json";

/**
 * Create a dynamic translation mapping that's built based on config
 * This approach uses explicit imports but builds the structure completely dynamically
 */
const createDynamicTranslationMap = () => {
  // All available translation files (this is the only hardcoded part)
  const availableTranslations = {
    en: {
      admin: enAdmin,
      common: enCommon,
      auth: enAuth,
      games: enGames,
      events: enEvents,
      settings: enSettings,
      profile: enProfile,
      campaigns: enCampaigns,
      roles: enRoles,
    },
    de: {
      admin: deAdmin,
      common: deCommon,
      auth: deAuth,
      games: deGames,
      events: deEvents,
      settings: deSettings,
      profile: deProfile,
      campaigns: deCampaigns,
      roles: deRoles,
    },
    pl: {
      admin: plAdmin,
      common: plCommon,
      auth: plAuth,
      games: plGames,
      events: plEvents,
      settings: plSettings,
      profile: plProfile,
      campaigns: plCampaigns,
      roles: plRoles,
    },
  };

  // Build filtered structure based purely on config (dynamic!)
  const filteredTranslations: Record<
    string,
    Record<string, Record<string, unknown>>
  > = {};

  for (const locale of i18nConfig.supportedLanguages) {
    filteredTranslations[locale] = {};

    for (const namespace of i18nConfig.namespaces) {
      const localeData = availableTranslations[
        locale as keyof typeof availableTranslations
      ] as Record<string, Record<string, unknown>> | undefined;
      const fallbackData = availableTranslations[
        i18nConfig.defaultLanguage as keyof typeof availableTranslations
      ] as Record<string, Record<string, unknown>> | undefined;

      if (localeData?.[namespace]) {
        filteredTranslations[locale][namespace] = localeData[namespace];
      } else if (fallbackData?.[namespace]) {
        filteredTranslations[locale][namespace] = fallbackData[namespace];
      } else {
        filteredTranslations[locale][namespace] = {};
      }
    }
  }

  return filteredTranslations;
};

// Build the dynamic translation map once at startup
const translations = createDynamicTranslationMap();

/**
 * Deep get function to access nested translation keys
 * Supports dot notation like "validation.email_required"
 */
function deepGet(obj: Record<string, unknown>, path: string): string {
  return (
    (path.split(".").reduce((current: unknown, key: string): unknown => {
      if (current && typeof current === "object" && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj) as string) || path
  );
}

/**
 * Server-side translation function
 * @param locale - The locale to use (defaults to "en")
 * @param namespace - The namespace to use
 * @param key - The translation key (supports dot notation)
 * @param options - Interpolation options
 * @returns The translated string
 */
export function getServerTranslation(
  locale: string = i18nConfig.defaultLanguage,
  namespace: string,
  key: string,
  options?: Record<string, string | number>,
): string {
  const translationsForLocale = translations[locale];
  if (!translationsForLocale || !translationsForLocale[namespace]) {
    // Fallback to default language if locale/namespace not found
    const fallbackTranslations = translations[i18nConfig.defaultLanguage]?.[namespace];
    if (!fallbackTranslations) {
      return key; // Ultimate fallback
    }

    const translation = deepGet(fallbackTranslations, key);

    // Handle interpolation
    if (options && typeof translation === "string") {
      return translation.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return String(options[varName] || match);
      });
    }

    return translation || key;
  }

  // Main case: use the requested locale and namespace
  const translation = deepGet(translationsForLocale[namespace], key);

  // Handle interpolation
  if (options && typeof translation === "string") {
    return translation.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return String(options[varName] || match);
    });
  }

  return translation || key;
}

/**
 * Create a server-side translation function for a specific namespace
 * @param locale - The locale to use
 * @param namespace - The namespace to use
 * @returns A translation function for the specified namespace
 */
export function createServerTranslationFunction(
  locale: string = i18nConfig.defaultLanguage,
  namespace: string,
) {
  return (key: string, options?: Record<string, string | number>) =>
    getServerTranslation(locale, namespace, key, options);
}

/**
 * Dynamically create translation functions for all namespaces
 */
export const createTranslationFunctions = () => {
  const translationFunctions: Record<
    string,
    (key: string, options?: Record<string, string | number>) => string
  > = {};

  // Create a function for each namespace from config
  for (const namespace of i18nConfig.namespaces) {
    const functionName = `t${namespace.charAt(0).toUpperCase() + namespace.slice(1)}`;
    translationFunctions[functionName] = (
      key: string,
      options?: Record<string, string | number>,
    ) => getServerTranslation(i18nConfig.defaultLanguage, namespace, key, options);
  }

  return translationFunctions;
};

// Generate all namespace translation functions dynamically
const translationFunctions = createTranslationFunctions();

/**
 * Default translation function (default language, common namespace)
 */
export const t = (key: string, options?: Record<string, string | number>) =>
  getServerTranslation(i18nConfig.defaultLanguage, "common", key, options);

// Dynamically export namespace translation functions based on config
// This ensures we only export functions for namespaces that actually exist in the config
export const tAdmin = translationFunctions["tAdmin"];
export const tCommon = translationFunctions["tCommon"];
export const tAuth = translationFunctions["tAuth"];
export const tGames = translationFunctions["tGames"];
export const tEvents = translationFunctions["tEvents"];
export const tSettings = translationFunctions["tSettings"];
export const tProfile = translationFunctions["tProfile"];
export const tCampaigns = translationFunctions["tCampaigns"];
export const tRoles = translationFunctions["tRoles"];

// For any additional namespaces that might be added to config in the future,
// we can create a dynamic export object
export const translationHelpers = translationFunctions;

/**
 * Type-safe translation function for server-side schemas
 * Matches the client-side TranslationFunction interface
 */
export type ServerTranslationFunction = (
  key: string,
  options?: Record<string, unknown>,
) => string;

/**
 * Get a server-side translation function that matches the client interface
 * @param namespace - The namespace to use
 * @param locale - The locale to use (defaults to defaultLanguage)
 * @returns A translation function compatible with client-side interface
 */
export function getServerTranslationFunction(
  namespace: string,
  locale: string = i18nConfig.defaultLanguage,
): ServerTranslationFunction {
  return (key: string, options?: Record<string, unknown>) =>
    getServerTranslation(
      locale,
      namespace,
      key,
      options as Record<string, string | number>,
    );
}
