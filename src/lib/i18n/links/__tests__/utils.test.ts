import { describe, expect, it } from "vitest";
import type { SupportedLanguage } from "~/lib/i18n/config";
import type { LocalizedLinkConfig } from "../schema";
import {
  buildSearchParams,
  getOptimalLocalizedPath,
  isExcludedFromLanguageRouting,
  isExternalUrl,
  normalizeLocalizedPath,
  resolveRouteParams,
  shouldHaveLanguagePrefix,
  validateRouteConfig,
} from "../utils";

describe("Link Utils", () => {
  describe("isExternalUrl", () => {
    it("detects external URLs with protocols", () => {
      expect(isExternalUrl("https://example.com")).toBe(true);
      expect(isExternalUrl("http://example.com")).toBe(true);
      expect(isExternalUrl("mailto:test@example.com")).toBe(true);
      expect(isExternalUrl("tel:+1234567890")).toBe(true);
      expect(isExternalUrl("ftp://files.example.com")).toBe(true);
    });

    it("detects protocol-relative URLs", () => {
      expect(isExternalUrl("//cdn.example.com")).toBe(true);
      expect(isExternalUrl("//example.com")).toBe(true);
    });

    it("identifies internal URLs", () => {
      expect(isExternalUrl("/player/games")).toBe(false);
      expect(isExternalUrl("/games")).toBe(false);
      expect(isExternalUrl("/")).toBe(false);
      expect(isExternalUrl("player/games")).toBe(false);
    });

    it("handles edge cases", () => {
      expect(isExternalUrl("")).toBe(false);
      expect(isExternalUrl("/")).toBe(false);
      expect(isExternalUrl("#")).toBe(false);
      expect(isExternalUrl("?query=param")).toBe(false);
    });
  });

  describe("shouldHaveLanguagePrefix", () => {
    it("returns true for internal absolute paths", () => {
      expect(shouldHaveLanguagePrefix("/player/games")).toBe(true);
      expect(shouldHaveLanguagePrefix("/games")).toBe(true);
      expect(shouldHaveLanguagePrefix("/")).toBe(true);
    });

    it("returns false for external URLs", () => {
      expect(shouldHaveLanguagePrefix("https://example.com")).toBe(false);
      expect(shouldHaveLanguagePrefix("mailto:test@example.com")).toBe(false);
    });

    it("respects exclude flag", () => {
      expect(shouldHaveLanguagePrefix("/player/games", false)).toBe(true);
      expect(shouldHaveLanguagePrefix("/player/games", true)).toBe(false);
    });

    it("handles relative paths", () => {
      expect(shouldHaveLanguagePrefix("player/games")).toBe(false);
      expect(shouldHaveLanguagePrefix("games")).toBe(false);
    });
  });

  describe("normalizeLocalizedPath", () => {
    const currentLanguage: SupportedLanguage = "de";

    it("adds language prefix for non-default languages", () => {
      expect(normalizeLocalizedPath("/player/games", currentLanguage)).toBe(
        "/de/player/games",
      );
      expect(normalizeLocalizedPath("/games", currentLanguage)).toBe("/de/games");
    });

    it("preserves existing language prefix", () => {
      expect(normalizeLocalizedPath("/de/player/games", currentLanguage)).toBe(
        "/de/player/games",
      );
      expect(normalizeLocalizedPath("/en/player/games", currentLanguage)).toBe(
        "/en/player/games",
      );
    });

    it("does not add prefix for default language", () => {
      expect(normalizeLocalizedPath("/player/games", "en" as SupportedLanguage)).toBe(
        "/player/games",
      );
    });

    it("replaces language prefix when targetLanguage is specified", () => {
      expect(
        normalizeLocalizedPath("/de/player/games", currentLanguage, {
          targetLanguage: "pl" as SupportedLanguage,
        }),
      ).toBe("/pl/player/games");
    });

    it("respects excludeLanguagePrefix flag", () => {
      expect(
        normalizeLocalizedPath("/player/games", currentLanguage, {
          excludeLanguagePrefix: true,
        }),
      ).toBe("/player/games");
    });

    it("handles paths without leading slash", () => {
      // The function preserves relative paths without adding language prefix
      expect(normalizeLocalizedPath("player/games", currentLanguage)).toBe(
        "player/games",
      );
    });

    it("preserves language when preserveLanguage is true", () => {
      expect(
        normalizeLocalizedPath("/player/games", "en" as SupportedLanguage, {
          preserveLanguage: true,
        }),
      ).toBe("/en/player/games");
    });
  });

  describe("validateRouteConfig", () => {
    it("validates correct configuration", () => {
      const config = {
        to: "/player/games",
        params: { gameId: "123" },
        search: { page: 1 },
      };

      const result = validateRouteConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("detects missing required fields", () => {
      const config = {
        to: "",
        params: undefined,
        search: undefined,
      };
      const result = validateRouteConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Route 'to' property is required");
    });

    it("detects invalid param types", () => {
      // Test the validation function directly with invalid input
      const config = {
        to: "/player/games",
        params: "invalid",
      } as unknown as LocalizedLinkConfig;

      const result = validateRouteConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Route 'params' must be an object");
    });

    it("detects invalid search types", () => {
      const config = {
        to: "/player/games",
        search: "invalid",
      } as unknown as LocalizedLinkConfig;

      const result = validateRouteConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Route 'search' must be an object");
    });
  });

  describe("resolveRouteParams", () => {
    it("resolves single parameter", () => {
      const result = resolveRouteParams("/player/games/$gameId", { gameId: "123" });
      expect(result).toBe("/player/games/123");
    });

    it("resolves multiple parameters", () => {
      const result = resolveRouteParams("/player/$teamId/games/$gameId", {
        teamId: "team1",
        gameId: "game1",
      });
      expect(result).toBe("/player/team1/games/game1");
    });

    it("handles special characters in parameters", () => {
      const result = resolveRouteParams("/games/$gameName", {
        gameName: "Dungeons & Dragons",
      });
      expect(result).toBe("/games/Dungeons%20%26%20Dragons");
    });

    it("throws error for missing parameters", () => {
      expect(() => resolveRouteParams("/player/games/$gameId", {})).toThrow(
        "Missing parameter values for: $gameId",
      );
    });

    it("handles no parameters", () => {
      const result = resolveRouteParams("/player/games", undefined);
      expect(result).toBe("/player/games");
    });
  });

  describe("buildSearchParams", () => {
    it("builds query string from object", () => {
      const result = buildSearchParams({ page: 1, search: "test" });
      expect(result).toBe("?page=1&search=test");
    });

    it("handles boolean values", () => {
      const result = buildSearchParams({ active: true, archived: false });
      expect(result).toBe("?active=1");
    });

    it("excludes undefined and null values", () => {
      const result = buildSearchParams({ page: 1, search: undefined, filter: undefined });
      expect(result).toBe("?page=1");
    });

    it("handles empty object", () => {
      const result = buildSearchParams(undefined);
      expect(result).toBe("");
    });

    it("handles special characters", () => {
      const result = buildSearchParams({ query: "test & search" });
      // URLSearchParams uses + for spaces, which is standard behavior
      expect(result).toBe("?query=test+%26+search");
    });
  });

  describe("isExcludedFromLanguageRouting", () => {
    it("excludes API routes", () => {
      expect(isExcludedFromLanguageRouting("/api/users")).toBe(true);
      expect(isExcludedFromLanguageRouting("/api/games/123")).toBe(true);
    });

    it("excludes static assets", () => {
      expect(isExcludedFromLanguageRouting("/static/css/main.css")).toBe(true);
      expect(isExcludedFromLanguageRouting("/assets/images/logo.png")).toBe(true);
    });

    it("excludes file downloads", () => {
      expect(isExcludedFromLanguageRouting("/files/document.pdf")).toBe(true);
      expect(isExcludedFromLanguageRouting("/download/game-data.zip")).toBe(true);
    });

    it("excludes webhook endpoints", () => {
      expect(isExcludedFromLanguageRouting("/webhooks/stripe")).toBe(true);
      expect(isExcludedFromLanguageRouting("/webhooks/github")).toBe(true);
    });

    it("includes regular routes", () => {
      expect(isExcludedFromLanguageRouting("/player/games")).toBe(false);
      expect(isExcludedFromLanguageRouting("/games")).toBe(false);
      expect(isExcludedFromLanguageRouting("/")).toBe(false);
    });
  });

  describe("getOptimalLocalizedPath", () => {
    it("returns optimal path for internal routes", () => {
      const result = getOptimalLocalizedPath("/player/games", "/de/dashboard");
      expect(result.path).toBe("/de/player/games");
      expect(result.language).toBe("de");
      expect(result.shouldLocalize).toBe(true);
    });

    it("handles external URLs", () => {
      const result = getOptimalLocalizedPath("https://example.com", "/de/dashboard");
      expect(result.path).toBe("https://example.com");
      expect(result.shouldLocalize).toBe(false);
    });

    it("respects target language option", () => {
      const result = getOptimalLocalizedPath("/player/games", "/de/dashboard", {
        targetLanguage: "pl" as SupportedLanguage,
      });
      expect(result.path).toBe("/pl/player/games");
      expect(result.language).toBe("pl");
    });

    it("handles excluded paths", () => {
      const result = getOptimalLocalizedPath("/api/users", "/de/dashboard");
      expect(result.path).toBe("/api/users");
      expect(result.shouldLocalize).toBe(false);
    });

    it("handles default language", () => {
      const result = getOptimalLocalizedPath("/player/games", "/en/dashboard");
      expect(result.path).toBe("/player/games");
      expect(result.language).toBe("en");
    });
  });
});
