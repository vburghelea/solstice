# Code Pattern Improvements

This document outlines the code pattern improvements implemented in the Solstice sports league management platform.

## 1. Auth Client Facade Pattern

### Before

```typescript
import authClient from "~/lib/auth-client";

// Usage
authClient.signIn.email({ ... });
authClient.signIn.social({ ... });
```

### After

```typescript
import { auth } from "~/lib/auth-client";

// Usage
auth.signIn.email({ ... });
auth.signInWithOAuth({ ... });
```

### Benefits

- **Cleaner API**: The facade provides a more intuitive interface with better method names
- **Encapsulation**: Internal implementation details are hidden from consumers
- **Flexibility**: Easy to swap auth providers or add middleware without changing consumer code
- **Type Safety**: Better IntelliSense support with explicit method exports

## 2. Theme Management with useTheme Hook

### Before

```typescript
// Direct DOM manipulation
function toggleTheme() {
  if (
    document.documentElement.classList.contains("dark") ||
    (!("theme" in localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.classList.remove("dark");
    localStorage.theme = "light";
  } else {
    document.documentElement.classList.add("dark");
    localStorage.theme = "dark";
  }
}
```

### After

```typescript
import { useTheme } from "~/shared/hooks/useTheme";

// Usage
const { theme, resolvedTheme, toggleTheme, setTheme } = useTheme();
```

### Features

- **System Theme Support**: Respects user's OS preferences
- **Reactive Updates**: Automatically responds to system theme changes
- **Persistent State**: Saves user preference to localStorage
- **Type Safety**: Strongly typed theme values ("light" | "dark" | "system")
- **Clean API**: Simple toggle and set methods

## 3. Centralized Icon Management

### Before

```typescript
// Icons imported directly in components
import { MoonIcon, SunIcon } from "lucide-react";

// SVG icons hardcoded in components
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="..." fill="currentColor" />
</svg>
```

### After

```typescript
import { GitHubIcon, GoogleIcon, MoonIcon, SunIcon } from "~/shared/ui/icons";

// Usage
<GitHubIcon />
<GoogleIcon />
```

### Benefits

- **Consistency**: All icons in one place for easy management
- **Reusability**: Icons can be used across components without duplication
- **Performance**: SVG icons are optimized and consistent in size
- **Maintainability**: Easy to update or replace icons globally
- **Type Safety**: TypeScript support for all icon props

## 4. Authentication Route Guards

### Before

```typescript
// Manual authentication checks in each component
if (!user) {
  navigate({ to: "/login" });
  return;
}
```

### After

```typescript
import { useAuthGuard } from "~/features/auth/useAuthGuard";

// Protected route
useAuthGuard({ user, requireAuth: true });

// Public route that redirects authenticated users
useAuthGuard({ user, redirectAuthenticated: true });

// With callbacks
useAuthGuard({
  user,
  requireAuth: true,
  onAuthSuccess: (user) => console.log("Welcome", user.name),
  onAuthFail: () => console.log("Access denied"),
});
```

### Features

- **Declarative Guards**: Simple API for protecting routes
- **Redirect Support**: Automatic redirects with preserved return URLs
- **Flexible Configuration**: Customizable redirect paths and callbacks
- **HOC Support**: `withAuthGuard` for wrapping components
- **Type Safety**: Full TypeScript support with Better Auth types

## Migration Guide

### Updating Auth Imports

```typescript
// Old
import authClient from "~/lib/auth/auth-client";
await authClient.signOut();

// New
import { auth } from "~/lib/auth-client";
await auth.signOut();
```

### Updating Theme Toggle

```typescript
// Old
<ThemeToggle /> // Works as before, now uses useTheme internally

// New (if you need theme state)
const { theme, toggleTheme } = useTheme();
```

### Updating Icons

```typescript
// Old
import { LoaderCircle } from "lucide-react";
<LoaderCircle className="animate-spin" />

// New
import { LoaderIcon } from "~/shared/ui/icons";
<LoaderIcon className="animate-spin" />
```

### Protecting Routes

```typescript
// In your route component
export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  loader: ({ context }) => ({ user: context.user }),
});

function Dashboard() {
  const { user } = Route.useLoaderData();
  const { isAuthenticated } = useAuthGuard({ user });

  // Component is protected
}
```

## Best Practices

1. **Always use the auth facade** instead of importing the raw auth client
2. **Use useTheme hook** for any theme-related functionality
3. **Import icons from the centralized icons file** to maintain consistency
4. **Apply route guards** at the route level for better security
5. **Keep the auth client facade updated** when adding new auth methods
6. **Document any custom icons** added to the icons file

## Future Improvements

- Add more OAuth providers to the auth facade
- Extend useTheme with more theme options (e.g., color schemes)
- Create an icon sprite system for better performance
- Add role-based access control to useAuthGuard
- Implement auth state persistence across tabs
