import { i18nConfig, type SupportedLanguage } from "./config";
import i18n from "./i18n";

/**
 * Ensures the i18n instance is properly configured for the current request
 * This should be called once per request in server-side code
 */
export async function createRequestScopedI18n(language: SupportedLanguage) {
  // On both client and server, ensure the main i18n instance has the correct language
  if (i18n.language !== language) {
    await i18n.changeLanguage(language);
  }

  if (i18nConfig.debug) {
    console.info("[i18n] ensured language for request", {
      language,
      currentLanguage: i18n.language,
      languages: i18n.languages,
    });
  }

  return i18n;
}

/**
 * Gets the current i18n instance
 */
export function getRequestScopedI18n() {
  return i18n;
}
