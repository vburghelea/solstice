import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { detectLanguageFromPath } from "~/lib/i18n/detector";
import { getOptimalLocalizedPath } from "~/lib/i18n/links/utils";
import {
  useLocalizedBreadcrumbs,
  useLocalizedLink,
  useLocalizedNavigation,
} from "../hooks";

// Mock i18next
const mockChangeLanguage = vi.fn().mockResolvedValue("en");

vi.mock("react-i18next", () => ({
  // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
  useTranslation: () => ({
    t: vi.fn((key: string) => `Translated: ${key}`),
    i18n: {
      changeLanguage: mockChangeLanguage,
      language: "en",
    },
  }),
}));

// Mock TanStack Router
const mockNavigate = vi.fn().mockResolvedValue(undefined);
const mockRouterState = {
  location: {
    pathname: "/en/dashboard",
  },
};

vi.mock("@tanstack/react-router", () => ({
  // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
  useRouter: () => ({
    navigate: mockNavigate,
  }),
  // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
  useRouterState: () => mockRouterState,
}));

// Mock language detector
vi.mock("~/lib/i18n/detector", () => ({
  detectLanguageFromPath: vi.fn((path: string) => {
    if (path.startsWith("/de/")) return "de";
    if (path.startsWith("/pl/")) return "pl";
    if (path.startsWith("/en/")) return "en";
    return "en";
  }),
}));

// Mock link utils
vi.mock("~/lib/i18n/links/utils", () => ({
  getOptimalLocalizedPath: vi.fn(
    (to: string, currentPath: string, options?: { targetLanguage?: string }) => ({
      path: options?.targetLanguage ? `/${options.targetLanguage}${to}` : `/en${to}`,
      language: options?.targetLanguage || "en",
      shouldLocalize: !to.startsWith("http") && !to.includes(":"),
    }),
  ),
  resolveRouteParams: vi.fn((to, params) => {
    if (!params) return to;
    let path = to;
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`$${key}`, String(value));
    }
    return path;
  }),
  buildSearchParams: vi.fn((search) => {
    if (!search) return "";
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null && value !== false) {
        params.set(key, String(value));
      }
    }
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  }),
}));

describe("useLocalizedNavigation", () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  it("returns current language from path", () => {
    const { result } = renderHook(() => useLocalizedNavigation(), { wrapper });

    expect(result.current.currentLanguage).toBe("en");
    expect(result.current.supportedLanguages).toEqual(["en", "de", "pl"]);
    expect(result.current.isDefaultLanguage).toBe(true);
  });

  it("provides navigation functions", () => {
    const { result } = renderHook(() => useLocalizedNavigation(), { wrapper });

    expect(typeof result.current.navigateLocalized).toBe("function");
    expect(typeof result.current.getLocalizedPath).toBe("function");
    expect(typeof result.current.changeLanguageAndNavigate).toBe("function");
  });

  it("gets localized path for simple route", () => {
    const { result } = renderHook(() => useLocalizedNavigation(), { wrapper });

    const path = result.current.getLocalizedPath({ to: "/player/games" });
    expect(path).toBe("/en/player/games");
  });

  it("gets localized path with parameters", () => {
    const { result } = renderHook(() => useLocalizedNavigation(), { wrapper });

    const path = result.current.getLocalizedPath({
      to: "/player/games/$gameId",
      params: { gameId: "123" },
    });
    expect(path).toBe("/en/player/games/123");
  });

  it("gets localized path with search params", () => {
    const { result } = renderHook(() => useLocalizedNavigation(), { wrapper });

    const path = result.current.getLocalizedPath({
      to: "/player/games",
      search: { page: 1, filter: "strategy" },
    });
    expect(path).toBe("/en/player/games?page=1&filter=strategy");
  });

  it("handles string input for navigation", () => {
    const { result } = renderHook(() => useLocalizedNavigation(), { wrapper });

    const path = result.current.getLocalizedPath("/player/games");
    expect(path).toBe("/en/player/games");
  });

  it("navigates to localized path", async () => {
    const { result } = renderHook(() => useLocalizedNavigation(), { wrapper });

    await result.current.navigateLocalized({ to: "/player/games" });

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/en/player/games",
    });
  });

  it("changes language and navigates", async () => {
    const { result } = renderHook(() => useLocalizedNavigation(), { wrapper });
    await result.current.changeLanguageAndNavigate("de" as const);

    expect(mockChangeLanguage).toHaveBeenCalledWith("de");
  });
});

describe("useLocalizedLink", () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  it("creates link with basic configuration", () => {
    const { result } = renderHook(() => useLocalizedLink(), { wrapper });

    const link = result.current.createLink({
      to: "/player/games",
      children: "Games",
    });

    expect(link.href).toBe("/en/player/games");
    expect(link.children).toBe("Games");
    expect(link.isExternal).toBe(false);
    expect(link.shouldHaveLanguagePrefix).toBe(true);
  });

  it("creates link with translation key", () => {
    const { result } = renderHook(() => useLocalizedLink(), { wrapper });

    const link = result.current.createLink({
      to: "/player/games",
      translationKey: "games.title",
      translationNamespace: "games",
    });

    expect(link.children).toBe("Translated: games:games.title");
  });

  it("creates external link", () => {
    vi.mocked(getOptimalLocalizedPath).mockReturnValueOnce({
      path: "https://example.com",
      language: "en",
      shouldLocalize: false,
    });

    const { result } = renderHook(() => useLocalizedLink(), { wrapper });

    const link = result.current.createLink({
      to: "https://example.com",
      children: "External Site",
    });

    expect(link.href).toBe("https://example.com");
    expect(link.isExternal).toBe(true);
    expect(link.shouldHaveLanguagePrefix).toBe(false);
  });

  it("creates link with aria label translation", () => {
    const { result } = renderHook(() => useLocalizedLink(), { wrapper });

    const link = result.current.createLink({
      to: "/player/games",
      children: "Games",
      ariaLabelTranslationKey: "games.aria_label",
      translationNamespace: "games",
    });

    expect(link.ariaLabel).toBe("Translated: games:games.aria_label");
  });

  it("returns current language", () => {
    const { result } = renderHook(() => useLocalizedLink(), { wrapper });

    expect(result.current.currentLanguage).toBe("en");
  });
});

describe("useLocalizedBreadcrumbs", () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // Mock window.location
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/en/player/games/123",
      },
      writable: true,
    });
  });

  it("generates breadcrumbs for localized path", () => {
    const { result } = renderHook(() => useLocalizedBreadcrumbs(), { wrapper });

    const breadcrumbs = result.current.generateBreadcrumbs();

    expect(breadcrumbs).toHaveLength(3);
    expect(breadcrumbs[0]).toEqual({
      label: "Translated: main.home",
      href: "/en/",
      isCurrent: false,
    });
    expect(breadcrumbs[1]).toEqual({
      label: "Translated: main.player",
      href: "/en/player",
      isCurrent: false,
    });
    expect(breadcrumbs[2]).toEqual({
      label: "Translated: main.games",
      href: "/en/player/games",
      isCurrent: false,
    });
  });

  it("generates breadcrumbs for custom path", () => {
    const { result } = renderHook(() => useLocalizedBreadcrumbs(), { wrapper });

    const breadcrumbs = result.current.generateBreadcrumbs("/en/games/systems");

    expect(breadcrumbs).toHaveLength(3);
    expect(breadcrumbs[0]).toEqual({
      label: "Translated: main.home",
      href: "/en/",
      isCurrent: false,
    });
    expect(breadcrumbs[1]).toEqual({
      label: "Translated: main.games",
      href: "/en/games",
      isCurrent: false,
    });
    expect(breadcrumbs[2]).toEqual({
      label: "Translated: main.systems",
      href: "/en/games/systems",
      isCurrent: false,
    });
  });

  it("handles numeric segments (IDs)", () => {
    const { result } = renderHook(() => useLocalizedBreadcrumbs(), { wrapper });

    const breadcrumbs = result.current.generateBreadcrumbs("/en/player/games/123/edit");

    // Should skip the numeric segment (123)
    expect(breadcrumbs).toHaveLength(4);
    expect(breadcrumbs[0].label).toBe("Translated: main.home");
    expect(breadcrumbs[1].label).toBe("Translated: main.player");
    expect(breadcrumbs[2].label).toBe("Translated: main.games");
    expect(breadcrumbs[3].label).toBe("Translated: main.edit");
  });

  it("handles default language paths", () => {
    vi.mocked(detectLanguageFromPath).mockReturnValueOnce("en");

    const { result } = renderHook(() => useLocalizedBreadcrumbs(), { wrapper });

    const breadcrumbs = result.current.generateBreadcrumbs("/player/games");

    expect(breadcrumbs[0].href).toBe("/en/");
    expect(breadcrumbs[1].href).toBe("/en/player");
    expect(breadcrumbs[2].href).toBe("/en/player/games");
  });

  it("returns current language", () => {
    const { result } = renderHook(() => useLocalizedBreadcrumbs(), { wrapper });

    expect(result.current.currentLanguage).toBe("en");
  });
});
