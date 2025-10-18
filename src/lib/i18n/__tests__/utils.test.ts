import { describe, expect, it } from "vitest";
import type { SupportedLanguage } from "../config";
import {
  getLanguageInfo,
  getSupportedLanguages,
  isLanguageRTL,
  validateTranslations,
} from "../utils";

describe("i18n Utils", () => {
  describe("getSupportedLanguages", () => {
    it("should return all supported languages", () => {
      const languages = getSupportedLanguages();
      expect(languages).toHaveLength(3);

      const codes = languages.map((lang) => lang.code);
      expect(codes).toContain("en");
      expect(codes).toContain("de");
      expect(codes).toContain("pl");
    });

    it("should include required properties for each language", () => {
      const languages = getSupportedLanguages();
      languages.forEach((lang) => {
        expect(lang).toHaveProperty("code");
        expect(lang).toHaveProperty("name");
        expect(lang).toHaveProperty("nativeName");
        expect(lang).toHaveProperty("flag");
        expect(lang).toHaveProperty("isRTL");
        expect(typeof lang.isRTL).toBe("boolean");
      });
    });

    it("should have correct flag emojis", () => {
      const languages = getSupportedLanguages();
      const languageMap = new Map(languages.map((lang) => [lang.code, lang]));

      expect(languageMap.get("en")?.flag).toBe("🇬🇧");
      expect(languageMap.get("de")?.flag).toBe("🇩🇪");
      expect(languageMap.get("pl")?.flag).toBe("🇵🇱");
    });
  });

  describe("getLanguageInfo", () => {
    it("should return correct language info for supported languages", () => {
      const enInfo = getLanguageInfo("en");
      expect(enInfo?.code).toBe("en");
      expect(enInfo?.name).toBe("English");
      expect(enInfo?.nativeName).toBe("English");
      expect(enInfo?.flag).toBe("🇬🇧");
      expect(enInfo?.isRTL).toBe(false);

      const deInfo = getLanguageInfo("de");
      expect(deInfo?.code).toBe("de");
      expect(deInfo?.name).toBe("German");
      expect(deInfo?.nativeName).toBe("Deutsch");
      expect(deInfo?.flag).toBe("🇩🇪");
      expect(deInfo?.isRTL).toBe(false);

      const plInfo = getLanguageInfo("pl");
      expect(plInfo?.code).toBe("pl");
      expect(plInfo?.name).toBe("Polish");
      expect(plInfo?.nativeName).toBe("Polski");
      expect(plInfo?.flag).toBe("🇵🇱");
      expect(plInfo?.isRTL).toBe(false);
    });

    it("should return undefined for unsupported language", () => {
      const frInfo = getLanguageInfo("fr" as SupportedLanguage);
      expect(frInfo).toBeUndefined();
    });
  });

  describe("isLanguageRTL", () => {
    it("should return false for supported languages", () => {
      expect(isLanguageRTL("en")).toBe(false);
      expect(isLanguageRTL("de")).toBe(false);
      expect(isLanguageRTL("pl")).toBe(false);
    });
  });

  describe("validateTranslations", () => {
    it("should validate complete translations", () => {
      const enTranslations = {
        buttons: {
          save: "Save",
          cancel: "Cancel",
        },
        auth: {
          login: {
            title: "Login",
          },
        },
      };

      // Validate only auth namespace keys
      const result = validateTranslations(enTranslations, "auth", ["login.title"]);
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it("should detect missing keys", () => {
      const enTranslations = {
        buttons: {
          save: "Save",
        },
        auth: {
          login: {
            title: "Login",
          },
        },
      };

      const result = validateTranslations(enTranslations, "auth", [
        "buttons.save",
        "buttons.cancel",
        "auth.login.title",
      ]);
      expect(result.valid).toBe(false);
      expect(result.missing).toContain("buttons.cancel");
    });

    it("should detect empty values", () => {
      const enTranslations = {
        buttons: {
          save: "Save",
          cancel: "",
        },
        auth: {
          login: {
            title: "Login",
          },
        },
      };

      const result = validateTranslations(enTranslations, "auth", [
        "buttons.save",
        "buttons.cancel",
        "auth.login.title",
      ]);
      expect(result.valid).toBe(false);
      expect(result.missing).toContain("buttons.cancel");
    });
  });
});
