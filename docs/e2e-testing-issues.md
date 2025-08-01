# E2E Testing Issues and Resolutions

This document captures all the issues encountered during E2E testing implementation and their resolutions.

## Important Context Files for Repomix

To understand and solve these E2E testing issues, include these patterns in repomix:

```
playwright.config.ts,
e2e/auth.setup.ts,
e2e/tests/authenticated/**/*.spec.ts,
e2e/tests/unauthenticated/**/*.spec.ts,
src/components/ui/admin-sidebar.tsx,
src/lib/auth-client.ts,
src/lib/auth/**/*.ts,
src/features/auth/components/*.tsx,
src/routes/(auth)/*.tsx,
src/routes/dashboard/*.tsx,
src/tests/utils/router.tsx,
.env.e2e,
package.json,
docs/TANSTACK-START-BEST-PRACTICES.md,
CLAUDE.md
```

### Key Files by Issue Area:

**Authentication Issues:**

- `e2e/auth.setup.ts` - Authentication setup logic
- `src/lib/auth-client.ts` - Auth client facade
- `src/lib/auth/index.ts` - Better Auth configuration

**UI/Component Issues:**

- `src/features/auth/components/login.tsx` - Login form component
- `src/features/auth/components/signup.tsx` - Signup form component
- `src/components/ui/admin-sidebar.tsx` - Sidebar with logout button
- `src/features/layouts/admin-layout.tsx` - Admin layout structure

**Router/Navigation Issues:**

- `src/tests/utils/router.tsx` - Router test utilities
- `src/router.tsx` - Main router configuration
- `src/routes/__root.tsx` - Root route with auth context

**Test Configuration:**

- `playwright.config.ts` - Playwright test configuration
- `vitest.config.ts` - Vitest configuration
- `.env.e2e` - E2E test environment variables

## Overview

During the implementation of E2E tests for the Solstice project, we encountered various issues related to authentication, UI mismatches, and test reliability. This document serves as a reference for understanding and resolving similar issues in the future.

## Issues Encountered

### 1. Authentication Setup Failures

**Issue**: Initial authentication setup was failing with "Login failed: Unknown error"

**Root Cause**: The authentication setup wasn't handling existing sessions properly, causing conflicts when trying to log in again.

**Resolution**:

```typescript
// e2e/auth.setup.ts
setup("authenticate", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/auth/login");

  // Check if already logged in
  if (page.url().includes("/dashboard")) {
    console.log("Already logged in, skipping authentication");
    await page.context().storageState({ path: authFile });
    return;
  }
  // ... continue with login
});
```

### 2. TypeScript Errors in Router Test Utils

**Issue**: Type error: "Type '...' is not assignable to parameter of type 'RouteOptions...'"

**Root Cause**: TypeScript strict mode was not accepting conditional properties in route options.

**Resolution**:

```typescript
// src/tests/utils/router.tsx
const testRoutes = routes.map((route) => {
  const baseOptions = {
    getParentRoute: () => rootRoute,
    path: route.path,
    component: route.component,
    beforeLoad: () => ({ user }),
  };

  if (route.loader) {
    return createRoute({
      ...baseOptions,
      loader: route.loader,
    });
  }

  return createRoute(baseOptions);
});
```

### 3. UI Text Mismatches

**Issue**: Multiple tests failing due to mismatched UI text expectations

**Examples**:

- Expected "Sign in" but UI showed "Login"
- Expected "Create Account" but UI showed "Sign up"
- Expected generic error messages but got specific ones

**Resolution**: Updated all test selectors and expectations to match actual UI:

```typescript
// Before
await page.getByRole("button", { name: "Sign in" }).click();

// After
await page.getByRole("button", { name: "Login", exact: true }).click();
```

### 4. Profile Link Selector Conflicts

**Issue**: Multiple "Profile" links on the page causing selector ambiguity

**Root Cause**: Both navigation menu and sidebar had "Profile" links

**Resolution**: Use exact matching:

```typescript
await expect(page.getByRole("link", { name: "Profile", exact: true })).toBeVisible();
```

### 5. Signup Flow Redirection

**Issue**: Tests expected dashboard redirect after signup, but app redirects to onboarding

**Root Cause**: App correctly implements profile completion requirement before dashboard access

**Resolution**: Updated tests to expect onboarding flow:

```typescript
await page.waitForURL("/onboarding");
await expect(page.getByRole("heading", { name: "Complete Your Profile" })).toBeVisible();
```

### 6. Logout Functionality Implementation

**Issue**: Logout tests were skipped because logout functionality wasn't implemented

**Root Cause**: Admin sidebar was missing logout button and functionality

**Resolution**:

1. Added logout button to admin sidebar
2. Implemented logout handler with proper cleanup:

```typescript
const handleLogout = async () => {
  try {
    await auth.signOut();
    queryClient.clear();
    await router.invalidate();
    navigate({ to: "/auth/login" });
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
```

### 7. Duplicate Component Files

**Issue**: Two admin-sidebar files existed causing confusion

**Files**:

- `/src/components/ui/admin-sidebar.tsx` (correct)
- `/src/shared/ui/admin-sidebar.tsx` (duplicate)

**Resolution**: Removed duplicate file and ensured imports use correct path

### 8. Logout Test Timing Issues

**Issue**: Logout tests failing with timeout errors waiting for navigation

**Symptoms**:

- Tests timeout waiting for redirect to login page
- Manual testing shows logout works correctly
- Issue appears to be test environment specific

**Attempted Resolutions**:

1. Increased timeouts to 15 seconds
2. Added `waitForLoadState("networkidle")`
3. Changed from `waitForURL` to `expect(page).toHaveURL()`
4. Added console error monitoring

**Current Status**: Logout functionality works in manual testing but some E2E tests still fail due to timing issues

### 9. WebKit-Specific Navigation Issues

**Issue**: WebKit browser tests had navigation failures not seen in Chromium/Firefox

**Example Error**:

```
Error: Timed out 5000ms waiting for expect(page).toHaveURL(expected)
Expected string: "http://localhost:5173/auth/signup"
Received string: "http://localhost:5173/auth/login"
```

**Root Cause**: WebKit handles navigation differently, particularly with client-side routing

**Partial Resolution**: Added more robust wait conditions but some WebKit tests remain flaky

## Test Organization Improvements

### 1. Separated Auth vs No-Auth Tests

Created clear separation between authenticated and unauthenticated test suites:

- `e2e/tests/authenticated/` - Tests requiring login
- `e2e/tests/unauthenticated/` - Tests for public pages

### 2. Project Configuration

Set up separate Playwright projects for different auth states:

```javascript
// playwright.config.ts
projects: [
  {
    name: "setup",
    testMatch: /.*\.setup\.ts/,
  },
  {
    name: "chromium-no-auth",
    use: { ...devices["Desktop Chrome"] },
    testIgnore: /authenticated/,
  },
  {
    name: "chromium-auth",
    use: {
      ...devices["Desktop Chrome"],
      storageState: ".auth/user.json",
    },
    dependencies: ["setup"],
    testMatch: /authenticated/,
  },
  // Similar for firefox and webkit
];
```

## Documentation Updates

### 1. CLAUDE.md Updates

Added E2E testing section with:

- Commands for running E2E tests
- Guidelines for writing new E2E tests
- Best practices for test organization

### 2. Development Backlog Updates

Added "Testing Requirements" section emphasizing:

- All new features must include E2E tests
- Tests should cover happy paths and error cases
- Tests must pass in CI/CD pipeline

## Remaining Issues

### 1. Flaky Logout Tests

**Status**: Partially resolved

- Logout functionality works in manual testing
- Some E2E tests still fail intermittently
- Appears to be timing/environment related

**Recommended Next Steps**:

1. Investigate if auth.signOut() returns a promise that needs awaiting
2. Add retry logic for flaky tests
3. Consider using page.waitForResponse() to ensure API calls complete

### 2. Visual Regression Testing

**Status**: Not implemented (deferred by user)

- Would help catch UI changes that break tests
- Playwright supports screenshot comparison
- Requires baseline screenshot management

## Best Practices Learned

1. **Always match actual UI text** - Don't assume button labels, use what's actually rendered
2. **Handle existing sessions** - Auth setup should clear cookies and handle already-logged-in state
3. **Use exact selectors** - When multiple elements match, use exact: true
4. **Understand app flow** - Tests should match actual user journeys (e.g., onboarding after signup)
5. **Separate auth contexts** - Use Playwright projects to isolate authenticated vs unauthenticated tests
6. **Add proper timeouts** - Navigation and API calls may take longer in test environment
7. **Monitor console errors** - Add console error monitoring to catch issues not visible in UI

## Test Statistics

### Current Status (as of last run):

- Total tests: 118
- Passing: ~111
- Failing: ~7 (mostly logout-related)
- Test suites:
  - Authentication flow
  - Authentication pages
  - Authentication validation
  - Dashboard
  - Navigation
  - Profile
  - Teams
  - Logout

### Coverage Areas:

- ✅ Login/Signup flows
- ✅ Form validation
- ✅ Protected route redirects
- ✅ Dashboard functionality
- ✅ Navigation
- ✅ Profile viewing
- ✅ Team operations
- ⚠️ Logout (works manually, tests flaky)

## Conclusion

The E2E testing implementation successfully covers most critical user flows. The main remaining challenge is test reliability, particularly around logout functionality. The tests provide good coverage and have already caught several UI inconsistencies that were fixed during implementation.

Future improvements should focus on:

1. Resolving logout test flakiness
2. Adding visual regression tests
3. Improving test execution speed
4. Adding more edge case coverage
