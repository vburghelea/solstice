import { act, renderHook } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "~/lib/i18n/i18n";
import {
  useAuthTranslation,
  useCommonTranslation,
  useTypedTranslation,
} from "../useTypedTranslation";

// Ensure i18n is initialized with resources before tests
beforeAll(async () => {
  // Wait for i18n to be initialized
  if (!i18n.isInitialized) {
    await new Promise<void>((resolve) => {
      i18n.on("initialized", () => resolve());
    });
  }
});

// Test wrapper
const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  );
};

describe("useTypedTranslation", () => {
  beforeEach(() => {
    // Reset i18n instance before each test
    vi.clearAllMocks();

    // Change language to English for consistent test state
    i18n.changeLanguage("en");
  });

  it("should return translation function and language info", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useTypedTranslation(), { wrapper });

    expect(result.current.t).toBeTypeOf("function");
    expect(result.current.changeLanguage).toBeTypeOf("function");
    expect(result.current.currentLanguage).toBe("en");
    expect(result.current.isRTL).toBe(false);
    expect(Array.isArray(result.current.supportedLanguages)).toBe(true);
  });

  it("should translate existing keys", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useTypedTranslation(["common", "auth"]), {
      wrapper,
    });

    // With common as default namespace, we can use shorter keys for common translations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(result.current.t("buttons.save" as any)).toBe("Save");

    // For auth namespace, use namespace prefix syntax
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(result.current.t("auth:login.title" as any)).toBe(
      "Welcome back to Roundup Games",
    );
  });

  it("should return key for missing translations", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useTypedTranslation(), { wrapper });

    // This is i18next's default behavior for missing keys
    expect(result.current.t("common.buttons.missing")).toBe("common.buttons.missing");
  });

  it("should handle interpolation", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useTypedTranslation(["common", "auth"]), {
      wrapper,
    });

    // Use existing translation with interpolation from auth.json
    act(() => {
      // Test with namespace prefix
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(result.current.t("auth:welcome" as any, { name: "John" })).toBe(
        "Welcome John!",
      );
    });
  });
});

describe("useAuthTranslation", () => {
  beforeEach(() => {
    // Change language to English for consistent test state
    i18n.changeLanguage("en");
  });

  it("should return auth namespace translations", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuthTranslation(), { wrapper });

    expect(result.current.t("login.title")).toBe("Welcome back to Roundup Games");
    expect(result.current.t("login.email_label")).toBe("Email");
    expect(result.current.t("signup.title")).toBe("Sign up for Roundup Games");
    expect(result.current.namespace).toBe("auth");
  });
});

describe("useCommonTranslation", () => {
  beforeEach(() => {
    // Change language to English for consistent test state
    i18n.changeLanguage("en");
  });

  it("should return common namespace translations", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCommonTranslation(), { wrapper });

    expect(result.current.t("buttons.save")).toBe("Save");
    expect(result.current.t("buttons.cancel")).toBe("Cancel");
    expect(result.current.t("status.loading")).toBe("loading");
    expect(result.current.namespace).toBe("common");
  });
});
