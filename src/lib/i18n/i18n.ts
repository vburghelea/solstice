import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import { i18nConfig } from "./config";

// Import English translations (fallback)
import adminEn from "./locales/en/admin.json";
import authEn from "./locales/en/auth.json";
import campaignsEn from "./locales/en/campaigns.json";
import commonEn from "./locales/en/common.json";
import errorsEn from "./locales/en/errors.json";
import eventsEn from "./locales/en/events.json";
import formsEn from "./locales/en/forms.json";
import gamesEn from "./locales/en/games.json";
import membershipEn from "./locales/en/membership.json";
import navigationEn from "./locales/en/navigation.json";
import playerEn from "./locales/en/player.json";
import profileEn from "./locales/en/profile.json";
import settingsEn from "./locales/en/settings.json";
import teamsEn from "./locales/en/teams.json";

// Resources with English as fallback
const resources = {
  en: {
    common: commonEn,
    auth: authEn,
    navigation: navigationEn,
    games: gamesEn,
    events: eventsEn,
    teams: teamsEn,
    player: playerEn,
    forms: formsEn,
    errors: errorsEn,
    admin: adminEn,
    campaigns: campaignsEn,
    membership: membershipEn,
    settings: settingsEn,
    profile: profileEn,
  },
};

// Initialize i18n
i18n
  .use(Backend) // Load translations from public/locales
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    // Fallback configuration
    fallbackLng: i18nConfig.fallbackLanguage,

    // Default namespace
    defaultNS: "common",

    // Available namespaces
    ns: i18nConfig.namespaces,

    // Debug in development
    debug: i18nConfig.debug,

    // Options for language detector
    detection: i18nConfig.detection,

    // Interpolation configuration
    interpolation: i18nConfig.interpolation,

    // React configuration
    react: i18nConfig.react,

    // Performance optimizations
    load: "languageOnly", // Only load 'en', 'de', 'pl' (not 'en-US', 'de-DE', etc.)
    lowerCaseLng: true, // Convert language codes to lowercase

    // Error handling
    missingKeyHandler: (lngs: readonly string[], ns: string, key: string) => {
      if (i18nConfig.debug) {
        console.warn(
          `Missing translation key: ${key} for languages: ${lngs.join(", ")}, namespace: ${ns}`,
        );
      }
    },

    // Save missing keys (useful for development)
    saveMissing: i18nConfig.debug,

    // Use fallback resources
    resources,
  });

export default i18n;

// Export types for use throughout the application
export type { i18n, TFunction } from "i18next";
