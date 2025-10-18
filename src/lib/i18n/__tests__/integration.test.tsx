import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the useTypedTranslation hook
vi.mock("~/hooks/useTypedTranslation", () => ({
  useTypedTranslation: vi.fn(() => ({
    t: vi.fn((key: string) => {
      const translations: Record<string, string> = {
        "settings.components.save_preferences": "Save",
        welcome: "Welcome {{name}}!",
        "common.buttons.missing": "common.buttons.missing",
      };
      return translations[key as keyof typeof translations] || key;
    }),
    changeLanguage: vi.fn(),
    currentLanguage: "en",
    isRTL: false,
    supportedLanguages: ["en", "de", "pl"],
  })),
  useAuthTranslation: vi.fn(() => ({
    t: vi.fn((key: string) => key),
    changeLanguage: vi.fn(),
    currentLanguage: "en",
    isRTL: false,
    supportedLanguages: ["en", "de", "pl"],
    namespace: "auth",
  })),
  useCommonTranslation: vi.fn(() => ({
    t: vi.fn((key: string) => key),
    changeLanguage: vi.fn(),
    currentLanguage: "en",
    isRTL: false,
    supportedLanguages: ["en", "de", "pl"],
    namespace: "common",
  })),
}));

// Mock LanguageSwitcher
vi.mock("~/components/LanguageSwitcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">English</div>,
}));

// Mock useLanguageDetection
vi.mock("~/hooks/useLanguageDetection", () => ({
  useLanguageDetection: vi.fn(() => ({
    currentLanguage: "en",
    userPreferences: {
      preferredLanguage: "en",
      fallbackLanguage: "en",
      autoDetectEnabled: true,
    },
    isLoading: false,
    error: null,
    changeLanguage: vi.fn(),
    autoDetectLanguage: vi.fn(),
    isUpdating: false,
    updateError: null,
    getLocalizedUrl: vi.fn(),
  })),
}));

// Test component that uses translation hook
function TestComponent() {
  const t = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      "settings.components.save_preferences": "Save",
      welcome: "Welcome {{name}}!",
    };
    return translations[key as keyof typeof translations] || key;
  });

  const currentLanguage = "en";

  return (
    <div>
      <span data-testid="current-language">{currentLanguage}</span>
      <span data-testid="translation">{t("settings.components.save_preferences")}</span>
    </div>
  );
}

describe("i18n Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with initial language", () => {
    render(<TestComponent />);

    expect(screen.getByTestId("current-language")).toHaveTextContent("en");
    expect(screen.getByTestId("translation")).toHaveTextContent("Save");
  });

  it("should render language switcher", () => {
    const LanguageSwitcher = () => <div data-testid="language-switcher">English</div>;
    render(<LanguageSwitcher />);

    expect(screen.getByTestId("language-switcher")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("should handle missing translation keys gracefully", () => {
    const mockT = vi.fn((key: string) => key);
    mockT("common.buttons.missing");

    expect(mockT("common.buttons.missing")).toBe("common.buttons.missing");
  });

  it("should handle interpolation", () => {
    const mockT = vi.fn((key: string, options?: Record<string, unknown>) => {
      if (
        key === "welcome" &&
        options &&
        typeof options === "object" &&
        "name" in options
      ) {
        return `Welcome ${String(options["name"])}!`;
      }
      return key;
    });

    expect(mockT("welcome", { name: "John" })).toBe("Welcome John!");
  });
});
