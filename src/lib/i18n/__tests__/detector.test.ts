import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { i18nConfig } from "../config";
import {
  detectLanguage,
  detectLanguageFromBrowser,
  detectLanguageFromPath,
  getLanguageFromStorage,
  getLocalizedUrl,
  storeLanguagePreference,
} from "../detector";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Mock document.cookie
const cookieMock = {
  value: "",
  get: () => cookieMock.value,
  set: (value: string) => {
    cookieMock.value = value;
  },
};

// Mock navigator
const navigatorMock = {
  languages: ["en-US", "en"],
};

describe("Language Detector", () => {
  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    // Setup document.cookie mock
    Object.defineProperty(document, "cookie", {
      get: () => cookieMock.get(),
      set: (value: string) => cookieMock.set(value),
      configurable: true,
    });

    // Setup navigator mock
    Object.defineProperty(window, "navigator", {
      value: navigatorMock,
      writable: true,
    });

    // Clear all mocks
    localStorageMock.clear();
    cookieMock.set("");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("detectLanguageFromBrowser", () => {
    it("should return English from browser languages", () => {
      Object.defineProperty(window.navigator, "languages", {
        value: ["en-US", "en"],
        writable: true,
        configurable: true,
      });
      expect(detectLanguageFromBrowser()).toBe("en");
    });

    it("should return German from browser languages", () => {
      Object.defineProperty(window.navigator, "languages", {
        value: ["de-DE", "de"],
        writable: true,
        configurable: true,
      });
      expect(detectLanguageFromBrowser()).toBe("de");
    });

    it("should return Polish from browser languages", () => {
      Object.defineProperty(window.navigator, "languages", {
        value: ["pl-PL", "pl"],
        writable: true,
        configurable: true,
      });
      expect(detectLanguageFromBrowser()).toBe("pl");
    });

    it("should return fallback language for unsupported languages", () => {
      Object.defineProperty(window.navigator, "languages", {
        value: ["fr-FR", "es"],
        writable: true,
        configurable: true,
      });
      expect(detectLanguageFromBrowser()).toBe(i18nConfig.defaultLanguage);
    });

    it("should return exact match when available", () => {
      Object.defineProperty(window.navigator, "languages", {
        value: ["en", "de"],
        writable: true,
        configurable: true,
      });
      expect(detectLanguageFromBrowser()).toBe("en");
    });

    it("should return default language in server environment", () => {
      // Mock server environment
      Object.defineProperty(window, "navigator", {
        value: undefined,
        writable: true,
      });

      expect(detectLanguageFromBrowser()).toBe(i18nConfig.defaultLanguage);
    });
  });

  describe("detectLanguageFromPath", () => {
    it("should detect language from URL path", () => {
      expect(detectLanguageFromPath("/de/games")).toBe("de");
      expect(detectLanguageFromPath("/pl/events")).toBe("pl");
      expect(detectLanguageFromPath("/en/dashboard")).toBe("en");
    });

    it("should return null for paths without language prefix", () => {
      expect(detectLanguageFromPath("/games")).toBe(null);
      expect(detectLanguageFromPath("/events")).toBe(null);
      expect(detectLanguageFromPath("/")).toBe(null);
    });

    it("should return null for unsupported language in path", () => {
      expect(detectLanguageFromPath("/fr/games")).toBe(null);
      expect(detectLanguageFromPath("/es/events")).toBe(null);
    });

    it("should handle empty path", () => {
      expect(detectLanguageFromPath("")).toBe(null);
    });
  });

  describe("getLanguageFromStorage", () => {
    it("should return language from localStorage", () => {
      localStorageMock.setItem("i18nextLng", "de");
      expect(getLanguageFromStorage()).toBe("de");
    });

    it("should return language from cookie when localStorage is empty", () => {
      cookieMock.set("i18next=pl");
      expect(getLanguageFromStorage()).toBe("pl");
    });

    it("should prioritize localStorage over cookie", () => {
      localStorageMock.setItem("i18nextLng", "en");
      cookieMock.set("i18next=de");
      expect(getLanguageFromStorage()).toBe("en");
    });

    it("should return null for invalid language in storage", () => {
      localStorageMock.setItem("i18nextLng", "fr");
      expect(getLanguageFromStorage()).toBe(null);
    });

    it("should return null in server environment", () => {
      Object.defineProperty(window, "localStorage", {
        value: undefined,
        writable: true,
      });

      expect(getLanguageFromStorage()).toBe(null);
    });
  });

  describe("detectLanguage", () => {
    it("should prioritize path over other methods", () => {
      const result = detectLanguage("/de/games");
      expect(result).toBe("de");
    });

    it("should use browser detection when no path", () => {
      Object.defineProperty(window.navigator, "languages", {
        value: ["pl-PL"],
        writable: true,
        configurable: true,
      });
      const result = detectLanguage("/games");
      expect(result).toBe("pl");
    });

    it("should respect user preferences", () => {
      const userPreferences = {
        preferredLanguage: "de" as const,
        fallbackLanguage: "en" as const,
        autoDetectEnabled: true,
      };

      const result = detectLanguage("/games", userPreferences);
      expect(result).toBe("de");
    });

    it("should fallback to default language", () => {
      // Clear any stored language from previous tests
      localStorageMock.clear();
      cookieMock.set("");

      // Disable browser detection by setting autoDetectEnabled to false
      const userPreferences = {
        preferredLanguage: "en" as const,
        fallbackLanguage: "en" as const,
        autoDetectEnabled: false, // Disable browser detection
      };

      const result = detectLanguage("/games", userPreferences);
      expect(result).toBe(i18nConfig.defaultLanguage);
    });
  });

  describe("storeLanguagePreference", () => {
    it("should store language in localStorage", () => {
      storeLanguagePreference("de");
      expect(localStorageMock.setItem).toHaveBeenCalledWith("i18nextLng", "de");
    });

    it("should store language in cookie", () => {
      storeLanguagePreference("pl");
      expect(document.cookie).toContain("i18next=pl");
    });

    it("should work in server environment without errors", () => {
      Object.defineProperty(window, "localStorage", {
        value: undefined,
        writable: true,
      });

      expect(() => storeLanguagePreference("en")).not.toThrow();
    });
  });

  describe("getLocalizedUrl", () => {
    it("should add language prefix for non-default languages", () => {
      const result = getLocalizedUrl("/games", "de");
      expect(result).toBe("/de/games");
    });

    it("should not add prefix for default language", () => {
      const result = getLocalizedUrl("/games", "en");
      expect(result).toBe("/games");
    });

    it("should remove current language prefix", () => {
      const result = getLocalizedUrl("/de/games", "pl", "de");
      expect(result).toBe("/pl/games");
    });

    it("should handle root path", () => {
      const result = getLocalizedUrl("/", "de");
      expect(result).toBe("/de");
    });

    it("should handle nested paths", () => {
      const result = getLocalizedUrl("/events/123/details", "de");
      expect(result).toBe("/de/events/123/details");
    });
  });
});
