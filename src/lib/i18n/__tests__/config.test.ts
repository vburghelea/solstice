import { describe, expect, it } from "vitest";
import { i18nConfig } from "../config";

describe("i18n Configuration", () => {
  it("should have supported languages", () => {
    expect(i18nConfig.supportedLanguages).toContain("en");
    expect(i18nConfig.supportedLanguages).toContain("de");
    expect(i18nConfig.supportedLanguages).toContain("pl");
    expect(i18nConfig.supportedLanguages).toHaveLength(3);
  });

  it("should have correct default language", () => {
    expect(i18nConfig.defaultLanguage).toBe("en");
  });

  it("should have correct fallback language", () => {
    expect(i18nConfig.fallbackLanguage).toBe("en");
  });

  it("should have required namespaces", () => {
    const expectedNamespaces = [
      "common",
      "auth",
      "navigation",
      "games",
      "events",
      "teams",
      "forms",
      "errors",
    ];
    expectedNamespaces.forEach((ns) => {
      expect(i18nConfig.namespaces).toContain(ns);
    });
  });

  it("should disable escapeValue for React", () => {
    expect(i18nConfig.interpolation?.escapeValue).toBe(false);
  });

  it("should have correct backend configuration", () => {
    expect(i18nConfig.backend?.loadPath).toBe("/locales/{{lng}}/{{ns}}.json");
  });

  it("should have detection configuration", () => {
    expect(i18nConfig.detection?.order).toContain("path");
    expect(i18nConfig.detection?.order).toContain("cookie");
    expect(i18nConfig.detection?.order).toContain("localStorage");
    expect(i18nConfig.detection?.order).toContain("navigator");
    expect(i18nConfig.detection?.order).toContain("htmlTag");
  });

  it("should have correct React configuration", () => {
    expect(i18nConfig.react?.useSuspense).toBe(false);
    expect(i18nConfig.react?.bindI18n).toBe("languageChanged");
  });
});
