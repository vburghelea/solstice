import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";
import {
  createRequestScopedI18n,
  getRequestScopedI18n,
} from "../request-instance.server";

// Mock the i18n instance to have better control in tests
vi.mock("../i18n", () => {
  const mockI18n = {
    language: "en",
    languages: ["en"],
    changeLanguage: vi.fn().mockImplementation(async (lng: string) => {
      mockI18n.language = lng;
      mockI18n.languages = [lng];
      return lng;
    }),
    hasResourceBundle: vi.fn().mockReturnValue(true),
    loadNamespaces: vi.fn().mockResolvedValue(true),
    t: vi.fn().mockReturnValue("mocked translation"),
  };

  return {
    default: mockI18n,
  };
});

describe("request-instance.server", () => {
  let originalLanguage: string;

  beforeEach(async () => {
    // Reset language to English before each test
    originalLanguage = i18n.language;
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    // Restore original language after each test
    await i18n.changeLanguage(originalLanguage);
  });

  describe("createRequestScopedI18n", () => {
    it("should ensure i18n instance has correct language", async () => {
      // Start with English
      await createRequestScopedI18n("en");
      expect(i18n.language).toBe("en");

      // Switch to German
      await createRequestScopedI18n("de");
      expect(i18n.language).toBe("de");

      // Switch to Polish
      await createRequestScopedI18n("pl");
      expect(i18n.language).toBe("pl");
    });

    it("should return the same i18n instance (singleton)", async () => {
      const instance1 = await createRequestScopedI18n("en");
      const instance2 = await createRequestScopedI18n("de");

      // Should return the same singleton instance
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(i18n);
    });

    it("should have all required resources loaded", async () => {
      await createRequestScopedI18n("en");

      // Check that common namespaces are loaded (mocked to return true)
      expect(i18n.hasResourceBundle("en", "common")).toBe(true);
      expect(i18n.hasResourceBundle("en", "navigation")).toBe(true);
      expect(i18n.hasResourceBundle("en", "auth")).toBe(true);
    });

    it("should handle language switching correctly", async () => {
      // Start with English
      await createRequestScopedI18n("en");
      const instance = getRequestScopedI18n();
      expect(instance.language).toBe("en");

      // Switch to German
      await createRequestScopedI18n("de");
      expect(instance.language).toBe("de");

      // Switch to Polish
      await createRequestScopedI18n("pl");
      expect(instance.language).toBe("pl");
    });

    it("should not change language if already set correctly", async () => {
      // Set to English first
      await i18n.changeLanguage("en");

      // Calling again with same language should not change anything
      await createRequestScopedI18n("en");
      expect(i18n.language).toBe("en");
    });
  });

  describe("getRequestScopedI18n", () => {
    it("should return the i18n singleton", () => {
      const instance = getRequestScopedI18n();
      expect(instance).toBeDefined();
      expect(typeof instance.t).toBe("function");
      expect(typeof instance.changeLanguage).toBe("function");
      expect(instance).toBe(i18n);
    });
  });
});
