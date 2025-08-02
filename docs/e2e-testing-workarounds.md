# E2E Testing Workarounds

This document describes workarounds implemented to ensure consistent E2E test execution across all browser engines.

## Browser-Specific Workarounds

### 1. Firefox - NS_BINDING_ABORTED Errors

**Issue**: Firefox throws NS_BINDING_ABORTED errors during rapid navigation, causing test failures.

**Workaround**: Added `slowMo: 100` to Firefox project configuration in `e2e/playwright.config.ts`:

```typescript
{
  name: "firefox-auth",
  use: {
    ...devices["Desktop Firefox"],
    storageState: authFile,
    slowMo: 100, // Prevents NS_BINDING_ABORTED errors
  },
}
```

**Impact**: Slightly slower Firefox test execution but ensures reliability.

### 2. WebKit/Safari - Navigation Issues

**Issue**: WebKit browsers (Safari) have problems with TanStack Router's Link component, especially regarding active state detection.

**Workaround**: Created `SafeLink` component that:

- Uses native `<a>` tags for WebKit browsers
- Manually handles navigation with `useNavigate()`
- Properly detects and applies active states

**Usage**: Replace `<Link>` with `<SafeLink>` in components that need WebKit compatibility:

```typescript
import { SafeLink } from "~/components/ui/SafeLink";

// Instead of:
<Link to="/path">Text</Link>

// Use:
<SafeLink to="/path">Text</SafeLink>
```

**Applied to**: Login and signup pages for auth flow navigation.

## Authentication Workarounds

### 3. Better Auth signOut Implementation

**Issue**: Custom server logout routes were unreliable across different environments.

**Workaround**: Use Better Auth's documented `signOut` method with `fetchOptions`:

```typescript
await auth.signOut({
  fetchOptions: {
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/auth/login";
    },
    onError: (error) => {
      console.error("Logout error:", error);
      window.location.href = "/auth/login";
    },
  },
});
```

**Benefits**:

- Consistent behavior across all browsers
- Proper error handling
- No custom server routes needed

### 4. Login Error Handling

**Issue**: Edge cases in login error display, particularly in Chromium.

**Workaround**: Added try-catch wrapper around auth operations:

```typescript
try {
  const result = await auth.signIn.email({ email, password });
  if (result?.error) {
    setErrorMessage(result.error.message || "Invalid email or password");
    return;
  }
  // success path
} catch (error) {
  setErrorMessage((error as Error)?.message || "Invalid email or password");
}
```

**Benefits**: Catches all error scenarios including network failures.

## Testing Considerations

### Parallel Test Execution

All workarounds are designed to work with Playwright's parallel test execution. The `slowMo` setting for Firefox is applied only to Firefox workers, not affecting other browser tests.

### Future Improvements

1. **Firefox**: Monitor Firefox updates for fixes to NS_BINDING_ABORTED behavior
2. **WebKit**: Track TanStack Router updates for improved Safari support
3. **Auth**: Consider migrating to Better Auth v2 when stable for potential improvements

## Maintenance

These workarounds should be reviewed periodically:

- When updating Playwright
- When updating TanStack Router
- When updating Better Auth
- If browser behaviors change

Last updated: August 2025
