import type { i18n as I18nInstance } from "i18next";
import { randomUUID } from "node:crypto";

import { i18nConfig, type SupportedLanguage } from "./config";
import i18n from "./i18n";

declare global {
  var __solsticeRequestI18nRegistry: Map<string, I18nInstance> | undefined;
}

const registry: Map<string, I18nInstance> = (globalThis.__solsticeRequestI18nRegistry ??=
  new Map<string, I18nInstance>());

async function cloneI18nInstance() {
  const cloned = await new Promise<I18nInstance>((resolve, reject) => {
    i18n.cloneInstance({ initImmediate: false }, (error, instance) => {
      if (error || !instance) {
        reject(error ?? new Error("Failed to clone i18n instance"));
        return;
      }

      resolve(instance);
    });
  });

  if (i18nConfig.debug) {
    console.info("[i18n] created request-scoped instance", {
      languages: cloned.languages,
      language: cloned.language,
    });
  }

  return cloned;
}

export async function createRequestScopedI18n(language: SupportedLanguage) {
  const instance = await cloneI18nInstance();
  await instance.changeLanguage(language);

  const key = randomUUID();
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
