import type { i18n as I18nInstance, InitOptions } from "i18next";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import { i18nConfig, type SupportedLanguage } from "./config";
import baseI18n from "./i18n";

// Server-only function to generate a random ID
async function generateId(): Promise<string> {
  const { randomUUID } = await import("node:crypto");
  return randomUUID();
}

// ============================================================================
// PERFORMANCE OPTIMIZATION: Cached Instance Pool
// ============================================================================
// Instead of creating a new i18n instance per request (expensive), we pre-create
// and cache one instance per supported language at startup. Each instance is:
// - Created once, reused infinitely
// - Immutable (language never changes after creation)
// - Safe for concurrent requests (no shared mutable state)
//
// This eliminates the ~900KB JSON.parse(JSON.stringify()) clone on every request.
// ============================================================================

declare global {
  var __solsticeRequestI18nRegistry: Map<string, I18nInstance> | undefined;
  var __solsticeI18nInstancePool: Map<SupportedLanguage, I18nInstance> | undefined;
}

// Registry for tracking instances used in the current request lifecycle
const registry: Map<string, I18nInstance> = (globalThis.__solsticeRequestI18nRegistry ??=
  new Map<string, I18nInstance>());

// Pool of pre-initialized i18n instances, one per language
const instancePool: Map<SupportedLanguage, I18nInstance> =
  (globalThis.__solsticeI18nInstancePool ??= new Map<SupportedLanguage, I18nInstance>());

// Get resources from the base i18n instance (already loaded)
const sharedResources = baseI18n.services.resourceStore?.data ?? {};

async function createIsolatedInstance(
  language: SupportedLanguage,
): Promise<I18nInstance> {
  const instance = createInstance();
  instance.use(initReactI18next);

  const sharedOptions = {
    ...(baseI18n.options ?? {}),
  } as InitOptions & Record<string, unknown>;

  delete sharedOptions.backend;
  delete sharedOptions.detection;

  const initOptions: InitOptions = {
    ...sharedOptions,
    lng: language,
    fallbackLng: i18nConfig.fallbackLanguage,
    supportedLngs: i18nConfig.supportedLanguages,
    // Use shared resources reference instead of cloning
    // Safe because resources are never mutated
    resources: sharedResources,
    initImmediate: false,
  };

  await instance.init(initOptions);

  // Verify language is set correctly
  if (instance.language !== language) {
    await instance.changeLanguage(language);
  }

  return instance;
}

/**
 * Get or create a cached i18n instance for the specified language.
 * Instances are created once and reused across all requests for that language.
 */
async function getOrCreateInstance(language: SupportedLanguage): Promise<I18nInstance> {
  let instance = instancePool.get(language);

  if (!instance) {
    if (i18nConfig.debug) {
      console.info("[i18n] creating and caching new instance for language:", language);
    }

    instance = await createIsolatedInstance(language);
    instancePool.set(language, instance);

    if (i18nConfig.debug) {
      console.info("[i18n] instance pool size:", instancePool.size);
    }
  }

  return instance;
}

/**
 * Create a request-scoped i18n instance for the given language.
 * This returns a key that can be used to retrieve the instance later in the request.
 *
 * Performance: Uses cached instances instead of creating new ones per request.
 * Isolation: Each request gets its own key to retrieve the correct instance.
 */
export async function createRequestScopedI18n(language: SupportedLanguage) {
  const instance = await getOrCreateInstance(language);

  if (i18nConfig.debug) {
    console.info("[i18n] using cached instance for request", {
      language,
      languages: instance.languages,
      instanceLanguage: instance.language,
    });
  }

  const key = await generateId();
  registry.set(key, instance);

  return { key, instance } as const;
}

export function consumeRequestScopedI18n(key: string) {
  const instance = registry.get(key) ?? null;
  if (instance) {
    registry.delete(key);
  }

  return instance;
}
