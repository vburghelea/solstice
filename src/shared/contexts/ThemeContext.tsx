import { createContext, ReactNode, use } from "react";
import { useTheme as useThemeHook } from "~/shared/hooks/useTheme";

interface ThemeContextValue {
  theme: "light" | "dark" | "system";
  resolvedTheme: "light" | "dark";
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Theme provider that wraps the app and provides theme state to all children
 * This prevents prop drilling for theme-related functionality
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeValue = useThemeHook();

  return <ThemeContext value={themeValue}>{children}</ThemeContext>;
}

/**
 * Hook to access theme context
 * Must be used within a ThemeProvider
 *
 * @example
 * const { theme, toggleTheme } = useTheme();
 */
export function useTheme() {
  const context = use(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
