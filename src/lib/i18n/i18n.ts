import i18n, { type Resource, type ResourceLanguage } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { i18nConfig, type SupportedLanguage } from "./config";

type LocaleModule = { default: Record<string, unknown> };

const resourceModules = import.meta.glob("./locales/*/*.json", {
  eager: true,
}) as Record<string, LocaleModule>;

const bundledResources = Object.entries(resourceModules).reduce(
  (acc, [path, module]) => {
    const match = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/);
    if (!match) return acc;
    const [, language, namespace] = match;
    acc[language] ??= {};
    acc[language]![namespace] = module.default;
    return acc;
  },
  {} as Record<string, Record<string, unknown>>,
);

const isServer = typeof window === "undefined";

// Prevent duplicate initialization when this module is imported more than once.
if (!i18n.isInitialized) {
  if (isServer && i18nConfig.debug) {
    console.info("[i18n] bundled resource languages", Object.keys(bundledResources));
  }

  let backendConfig: Record<string, unknown> = { ...i18nConfig.backend };
  const resources = JSON.parse(JSON.stringify(bundledResources)) as Resource;

  if (isServer) {
    const [{ default: FsBackend }, pathModule, fs] = await Promise.all([
      import("i18next-fs-backend"),
      import("node:path"),
      import("node:fs/promises"),
    ]);
    const { resolve, join } = pathModule as {
      resolve: (...args: string[]) => string;
      join: (...args: string[]) => string;
    };

    i18n.use(FsBackend);
    backendConfig = {
      loadPath: resolve(process.cwd(), "src/lib/i18n/locales/{{lng}}/{{ns}}.json"),
    };

    const localesRoot = resolve(process.cwd(), "src/lib/i18n/locales");

    for (const language of i18nConfig.supportedLanguages) {
      if (!resources[language]) {
        resources[language] = {};
      }

      for (const namespace of i18nConfig.namespaces) {
        if (!resources[language]) {
          resources[language] = {} as ResourceLanguage;
        }

        if ((resources[language] as ResourceLanguage)[namespace]) continue;
        const filePath = join(localesRoot, language, `${namespace}.json`);
        try {
          const content = await fs.readFile(filePath, "utf-8");
          (resources[language] as ResourceLanguage)[namespace] = JSON.parse(content);
        } catch (error) {
          if (i18nConfig.debug) {
            console.warn("[i18n] missing locale file", {
              language,
              namespace,
              filePath,
              error,
            });
          }
        }
      }
    }
  } else {
    const { default: HttpBackend } = await import("i18next-http-backend");
    i18n.use(HttpBackend);
  }

  await i18n
    .use(LanguageDetector) // Detect user language
    .use(initReactI18next) // Pass i18n instance to react-i18next
    .init({
      initImmediate: !isServer,

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

      backend: backendConfig,

      ...(isServer && { preload: i18nConfig.supportedLanguages }),

      // Performance optimizations
      load: "languageOnly", // Only load 'en', 'de', 'pl' (not 'en-US', 'de-DE', etc.)
      lowerCaseLng: true, // Convert language codes to lowercase
      supportedLngs: i18nConfig.supportedLanguages,

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

  if (isServer) {
    await i18n.loadLanguages(i18nConfig.supportedLanguages);

    const snapshot = i18nConfig.supportedLanguages.reduce(
      (acc, lng) => ({
        ...acc,
        [lng]: {
          navigation: i18n.hasResourceBundle(lng, "navigation"),
          common: i18n.hasResourceBundle(lng, "common"),
          about: i18n.hasResourceBundle(lng, "about"),
        },
      }),
      {} as Record<SupportedLanguage, Record<string, boolean>>,
    );

    console.info("[i18n] server initialization complete", {
      language: i18n.language,
      languages: i18n.languages,
      loaded: snapshot,
    });

    i18n.on("loaded", (loaded) => {
      console.info("[i18n] resources loaded", loaded);
    });
    i18n.on("failedLoading", (lng, ns, msg) => {
      console.error("[i18n] resource load failed", { lng, ns, msg });
    });
    i18n.on("languageChanged", (lng) => {
      console.info("[i18n] language changed", {
        lng,
        hasCommon: i18n.hasResourceBundle(lng, "common"),
        hasNavigation: i18n.hasResourceBundle(lng, "navigation"),
        known: i18n.languages,
      });
    });
  }
}

export default i18n;

// Export types for use throughout the application
export type { i18n, TFunction } from "i18next";
