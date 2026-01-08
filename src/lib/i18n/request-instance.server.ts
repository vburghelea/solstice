import type { i18n as I18nInstance, InitOptions, Resource } from "i18next";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import { i18nConfig, type SupportedLanguage } from "./config";
import baseI18n from "./i18n";

// Server-only function to generate a random ID
async function generateId(): Promise<string> {
  const { randomUUID } = await import("node:crypto");
  return randomUUID();
}

declare global {
  var __solsticeRequestI18nRegistry: Map<string, I18nInstance> | undefined;
}

const registry: Map<string, I18nInstance> = (globalThis.__solsticeRequestI18nRegistry ??=
  new Map<string, I18nInstance>());

function cloneResources(): Resource {
  const resources = baseI18n.services.resourceStore?.data ?? {};
  return JSON.parse(JSON.stringify(resources)) as Resource;
}

async function createIsolatedInstance(language: SupportedLanguage) {
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
    resources: cloneResources(),
    initImmediate: false,
  };

  await instance.init(initOptions);

  if (instance.language !== language) {
    await instance.changeLanguage(language);
  }

  return instance;
}

export async function createRequestScopedI18n(language: SupportedLanguage) {
  const instance = await createIsolatedInstance(language);

  if (i18nConfig.debug) {
    console.info("[i18n] created request-scoped instance", {
      languages: instance.languages,
      language: instance.language,
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
