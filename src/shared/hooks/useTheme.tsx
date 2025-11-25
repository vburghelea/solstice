import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

export type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Ignore storage access issues
  }
  return "system";
}

function detectSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function ThemeProvider({ children }: { readonly children: ReactNode }) {
  const [state, setState] = useState({
    theme: "system" as Theme,
    systemTheme: "light" as "light" | "dark",
    isHydrated: false,
  });

  const { theme, systemTheme, isHydrated } = state;

  const setTheme = (newTheme: Theme) => {
    setState((prev) => ({ ...prev, theme: newTheme }));
  };

  const setSystemTheme = (newSystemTheme: "light" | "dark") => {
    setState((prev) => ({ ...prev, systemTheme: newSystemTheme }));
  };

  // Read stored theme after hydration to prevent SSR mismatch
  useEffect(() => {
    const storedTheme = readStoredTheme();
    const detectedSystemTheme = detectSystemTheme();

    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setState((prev) => ({
      theme: prev.isHydrated ? prev.theme : storedTheme,
      systemTheme: prev.isHydrated ? prev.systemTheme : detectedSystemTheme,
      isHydrated: true,
    }));
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined" || !isHydrated) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [isHydrated]);

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useIsomorphicLayoutEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (typeof window === "undefined" || !isHydrated) return;
    try {
      window.localStorage.setItem("theme", theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme, isHydrated]);

  const toggleTheme = useCallback(() => {
    const currentTheme = state.theme;
    let newTheme: Theme;

    if (currentTheme === "light") {
      newTheme = "dark";
    } else if (currentTheme === "dark") {
      newTheme = "light";
    } else {
      const prefersDark = detectSystemTheme() === "dark";
      newTheme = prefersDark ? "light" : "dark";
    }

    setTheme(newTheme);
  }, [state.theme]);

  const contextSetTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme: contextSetTheme, toggleTheme }),
    [theme, resolvedTheme, toggleTheme, contextSetTheme],
  ) as ThemeContextValue;

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const context = use(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
