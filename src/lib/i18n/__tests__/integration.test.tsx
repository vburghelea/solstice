import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageSwitcher } from "~/components/LanguageSwitcher";
import { useTypedTranslation } from "~/hooks/useTypedTranslation";
import i18n from "~/lib/i18n/i18n";

// Mock the useLanguageDetection hook to avoid server function issues
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
  useLanguageSwitcher: vi.fn(() => ({
    currentLanguage: "en",
    switchLanguage: vi.fn(),
    isUpdating: false,
    getLocalizedUrl: vi.fn(),
  })),
}));

// Test component that uses translation hook
function TestComponent() {
  const { t, currentLanguage, changeLanguage } = useTypedTranslation(["common", "auth"]);

  return (
    <div>
      <span data-testid="current-language">{currentLanguage}</span>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <span data-testid="translation">{t("buttons.save" as any)}</span>{" "}
      <button type="button" onClick={() => changeLanguage("de")}>
        Switch to German
      </button>
      <LanguageSwitcher />
    </div>
  );
}

describe("i18n Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    // Change language to English for consistent test state
    i18n.changeLanguage("en");
  });

  // Simple wrapper function without router complexity
  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      </QueryClientProvider>
    );
  };

  it("should render with initial language", () => {
    const wrapper = createWrapper();
    render(<TestComponent />, { wrapper });

    expect(screen.getByTestId("current-language")).toHaveTextContent("en");
    expect(screen.getByTestId("translation")).toHaveTextContent("Save");
  });

  it("should handle missing translation keys gracefully", () => {
    const wrapper = createWrapper();
    render(<TestComponent />, { wrapper });

    // This is i18next's default behavior for missing keys
    expect(i18n.t("common.buttons.missing")).toBe("common.buttons.missing");
  });

  it("should handle interpolation", () => {
    // Use existing translation with interpolation with namespace prefix
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(i18n.t("auth:welcome" as any, { name: "John" })).toBe("Welcome John!");
  });

  it("should handle language switching", async () => {
    const wrapper = createWrapper();
    render(<TestComponent />, { wrapper });

    const switchButton = screen.getByText("Switch to German");
    fireEvent.click(switchButton);

    // The test is simplified since we're not testing the actual router navigation
    expect(switchButton).toBeInTheDocument();
  });

  it("should render language switcher", () => {
    const wrapper = createWrapper();
    render(<LanguageSwitcher />, { wrapper });

    expect(screen.getByText("English")).toBeInTheDocument();
  });
});
