import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

// Use useLayoutEffect on client, useEffect on server
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// TEMPORARILY DISABLED: Dark mode is disabled app-wide.
// To re-enable, remove the FORCE_LIGHT_MODE constant and restore original logic.
const FORCE_LIGHT_MODE = true;

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Dark mode disabled - always start with light
    if (FORCE_LIGHT_MODE) return "light";

    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme");
      if (["light", "dark", "system"].includes(storedTheme!)) {
        return storedTheme as Theme;
      }
    }
    return "system";
  });

  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(() => {
    // Dark mode disabled - always light
    if (FORCE_LIGHT_MODE) return "light";

    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  useIsomorphicLayoutEffect(() => {
    // Dark mode disabled - skip system theme listener
    if (FORCE_LIGHT_MODE) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", updateSystemTheme);

    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, []);

  // Dark mode disabled - always resolve to light
  const resolvedTheme = FORCE_LIGHT_MODE
    ? "light"
    : theme === "system"
      ? systemTheme
      : theme;

  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    // Dark mode disabled - always remove dark class
    if (FORCE_LIGHT_MODE) {
      root.classList.remove("dark");
      return;
    }
    root.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  useEffect(() => {
    // Dark mode disabled - don't persist theme changes
    if (FORCE_LIGHT_MODE) return;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    // Dark mode disabled - no-op
    if (FORCE_LIGHT_MODE) return;

    setTheme((prevTheme) => {
      if (prevTheme === "light") return "dark";
      if (prevTheme === "dark") return "light";
      // For system theme, check current preference without external dependency
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return isDark ? "light" : "dark";
    });
  }, []);

  return {
    theme: FORCE_LIGHT_MODE ? ("light" as Theme) : theme,
    setTheme,
    resolvedTheme,
    toggleTheme,
  };
}
