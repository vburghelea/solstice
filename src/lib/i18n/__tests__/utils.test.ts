import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupportedLanguage } from "../config";
import {
  createDateFormatter,
  DATE_FORMATS,
  formatDateLocalized,
  formatDateWithPattern,
  formatDistanceToNowLocalized,
  getDateLocale,
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

  describe("Date Formatting Utilities", () => {
    const testDate = new Date(2023, 0, 1, 12, 0, 0); // January 1, 2023, 12:00 PM

    describe("getDateLocale", () => {
      it("should return undefined for English (default)", () => {
        const locale = getDateLocale("en");
        expect(locale).toBeUndefined();
      });

      it("should return German locale for German", () => {
        const locale = getDateLocale("de");
        expect(locale).toBeDefined();
        expect(locale?.code).toBe("de");
      });

      it("should return Polish locale for Polish", () => {
        const locale = getDateLocale("pl");
        expect(locale).toBeDefined();
        expect(locale?.code).toBe("pl");
      });

      it("should return undefined for unsupported language", () => {
        const locale = getDateLocale("fr" as SupportedLanguage);
        expect(locale).toBeUndefined();
      });
    });

    describe("formatDistanceToNowLocalized", () => {
      // Mock the current date for consistent testing
      const mockNow = new Date(2023, 0, 1, 15, 0, 0); // 3:00 PM

      beforeEach(() => {
        // Mock Date.now() to return a consistent timestamp
        vi.useFakeTimers();
        vi.setSystemTime(mockNow);
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it("should format time in English by default", () => {
        const pastDate = new Date(2023, 0, 1, 13, 0, 0); // 1:00 PM (2 hours ago)
        const result = formatDistanceToNowLocalized(pastDate);
        expect(result).toBe("about 2 hours ago");
      });

      it("should format time in German when language is de", () => {
        const pastDate = new Date(2023, 0, 1, 13, 0, 0); // 1:00 PM (2 hours ago)
        const result = formatDistanceToNowLocalized(pastDate, "de");
        expect(result).toMatch(/vor/); // German relative time contains "vor"
      });

      it("should format time in Polish when language is pl", () => {
        const pastDate = new Date(2023, 0, 1, 13, 0, 0); // 1:00 PM (2 hours ago)
        const result = formatDistanceToNowLocalized(pastDate, "pl");
        expect(result).toMatch(/temu/); // Polish relative time contains "temu"
      });

      it("should support custom options", () => {
        const pastDate = new Date(2023, 0, 1, 13, 0, 0); // 1:00 PM (2 hours ago)
        const result = formatDistanceToNowLocalized(pastDate, "en", { addSuffix: false });
        expect(result).toBe("about 2 hours");
      });
    });

    describe("formatDateLocalized", () => {
      it("should format date in English by default", () => {
        const result = formatDateLocalized(testDate, "MMMM d, yyyy");
        expect(result).toBe("January 1, 2023");
      });

      it("should format date in German when language is de", () => {
        const result = formatDateLocalized(testDate, "MMMM d, yyyy", "de");
        expect(result).toBe("Januar 1, 2023");
      });

      it("should format date in Polish when language is pl", () => {
        const result = formatDateLocalized(testDate, "MMMM d, yyyy", "pl");
        expect(result).toBe("stycznia 1, 2023");
      });
    });

    describe("formatDateWithPattern", () => {
      it("should format date using SHORT pattern", () => {
        const result = formatDateWithPattern(testDate, "SHORT");
        expect(result).toBe("Jan 1, 2023");
      });

      it("should format date using MEDIUM pattern in German", () => {
        const result = formatDateWithPattern(testDate, "MEDIUM", "de");
        expect(result).toBe("Januar 1, 2023");
      });

      it("should format date using LONG pattern in Polish", () => {
        const result = formatDateWithPattern(testDate, "LONG", "pl");
        expect(result).toMatch(/stycznia/); // Contains month name in Polish
      });
    });

    describe("createDateFormatter", () => {
      it("should create a formatter for English", () => {
        const formatter = createDateFormatter("en");
        expect(formatter.format(testDate, "MMMM d, yyyy")).toBe("January 1, 2023");
        expect(formatter.formatWithPattern(testDate, "SHORT")).toBe("Jan 1, 2023");
      });

      it("should create a formatter for German", () => {
        const formatter = createDateFormatter("de");
        expect(formatter.format(testDate, "MMMM d, yyyy")).toBe("Januar 1, 2023");
        expect(formatter.formatWithPattern(testDate, "SHORT")).toBe("Jan. 1, 2023");
      });

      it("should create a formatter for Polish", () => {
        const formatter = createDateFormatter("pl");
        expect(formatter.format(testDate, "MMMM d, yyyy")).toBe("stycznia 1, 2023");
        expect(formatter.formatWithPattern(testDate, "SHORT")).toBe("sty 1, 2023");
      });
    });

    describe("DATE_FORMATS constants", () => {
      it("should have all expected format patterns", () => {
        expect(DATE_FORMATS).toHaveProperty("SHORT");
        expect(DATE_FORMATS).toHaveProperty("MEDIUM");
        expect(DATE_FORMATS).toHaveProperty("LONG");
        expect(DATE_FORMATS).toHaveProperty("FULL");
        expect(DATE_FORMATS).toHaveProperty("TIME_ONLY");
        expect(DATE_FORMATS).toHaveProperty("DATE_ONLY");
        expect(DATE_FORMATS).toHaveProperty("DATETIME_SHORT");
      });

      it("should have valid date format strings", () => {
        Object.values(DATE_FORMATS).forEach((format) => {
          expect(typeof format).toBe("string");
          expect(format.length).toBeGreaterThan(0);
        });
      });
    });
  });
});
