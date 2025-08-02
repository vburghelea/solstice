# E2E Testing Issues - Current Status

This document captures the remaining E2E testing issues after implementing auth guards and stub routes.

## Important Context Files for Repomix

To understand and solve these remaining E2E testing issues, include these patterns in repomix:

```
e2e/tests/authenticated/logout.auth.spec.ts,
e2e/tests/authenticated/dashboard.auth.spec.ts,
e2e/tests/authenticated/navigation.auth.spec.ts,
e2e/tests/authenticated/profile.auth.spec.ts,
e2e/tests/authenticated/teams.auth.spec.ts,
e2e/tests/unauthenticated/auth-validation.unauth.spec.ts,
e2e/tests/unauthenticated/auth-pages.unauth.spec.ts,
src/components/ui/admin-sidebar.tsx,
src/lib/auth-client.ts,
src/lib/auth/index.ts,
src/features/auth/components/login.tsx,
playwright.config.ts,
e2e/auth.setup.ts
```

## Current Test Status

- **Total tests**: 118
- **Passing**: 88
- **Failing**: 15
- **Skipped**: 15

## Remaining Issues

### 1. Logout Flow Timing Issues

**Status**: Partially working (manual testing works, E2E tests fail)

**Failing Tests**:

- `logout.auth.spec.ts` - "should clear session on logout"
- `logout.auth.spec.ts` - "should handle logout from different pages"

**Issue**: Tests timeout waiting for navigation to `/auth/login` after clicking logout button

**Error Example**:

```
Error: Timed out 10000ms waiting for expect(page).toHaveURL(expected)
Expected pattern: /\/auth\/login/
Received string: "http://localhost:5173/dashboard"
```

**Context Files**:

- `e2e/tests/authenticated/logout.auth.spec.ts`
- `src/components/ui/admin-sidebar.tsx`
- `src/lib/auth-client.ts`

**Potential Solutions**:

1. Check if `auth.signOut()` returns a promise that needs proper awaiting
2. Add `page.waitForResponse()` to ensure API calls complete
3. Use retry logic for the navigation check
4. Investigate if router invalidation is causing issues

### 2. WebKit Navigation Issues

**Status**: WebKit-specific failures

**Failing Tests**:

- `navigation.auth.spec.ts` - "should highlight active navigation item" (WebKit)
- `navigation.auth.spec.ts` - "should handle direct navigation to authenticated pages" (WebKit)
- `profile.auth.spec.ts` - "should navigate to profile from dashboard" (WebKit)
- `teams.auth.spec.ts` - "should navigate to teams from sidebar" (WebKit)

**Issue**: WebKit has navigation interruptions and timing issues with client-side routing

**Error Example**:

```
Error: page.goto: Navigation to "http://localhost:5173/dashboard/events" is interrupted by another navigation
```

**Context Files**:

- `e2e/tests/authenticated/navigation.auth.spec.ts`
- `src/components/ui/admin-sidebar.tsx`
- `playwright.config.ts`

**Potential Solutions**:

1. Add `waitUntil: "networkidle"` for WebKit navigation
2. Use sequential navigation instead of parallel for WebKit
3. Add delays between navigations in WebKit tests
4. Check for WebKit-specific router behavior

### 3. Auth Validation Error Display

**Status**: Single test failure

**Failing Test**:

- `auth-validation.unauth.spec.ts` - "should show error for invalid credentials on login"

**Issue**: Test expects `.text-destructive` class for error messages but it's not found

**Error**:

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
Locator: locator('.text-destructive')
Expected: visible
Received: <element(s) not found>
```

**Context Files**:

- `e2e/tests/unauthenticated/auth-validation.unauth.spec.ts`
- `src/features/auth/components/login.tsx`

**Potential Solutions**:

1. Check if error messages use different styling classes
2. Verify error display logic in login component
3. Update test to use correct error selectors
4. Add data-testid for error messages

### 4. Cross-Browser Navigation Consistency

**Status**: Firefox and WebKit specific failures

**Failing Tests**:

- `dashboard.auth.spec.ts` - "should maintain authentication across page navigations" (Firefox, WebKit)
- `dashboard.auth.spec.ts` - "should have working quick actions" (WebKit)

**Issue**: Navigation timing and state management differs across browsers

**Context Files**:

- `e2e/tests/authenticated/dashboard.auth.spec.ts`
- `playwright.config.ts`

**Potential Solutions**:

1. Add browser-specific wait conditions
2. Use more explicit navigation waiting
3. Check for race conditions in state updates
4. Consider browser-specific test adjustments

## Summary of Fixes Already Applied

1. ✅ Updated dashboard route to use `requireAuthAndProfile` guard
2. ✅ Created stub pages for Events, Members, Reports, Settings
3. ✅ Fixed unauthenticated redirect issues
4. ✅ Resolved missing route errors

## Recommended Next Steps

1. **Fix Auth Validation Error** - Quick win, just need to update selector
2. **Add Retry Logic** - For flaky logout tests
3. **Browser-Specific Adjustments** - Add conditional logic for WebKit/Firefox
4. **Improve Wait Conditions** - More robust navigation waiting

## Test Command

```bash
# Run all tests
pnpm test:e2e

# Run specific failing test suites
pnpm test:e2e -- e2e/tests/authenticated/logout.auth.spec.ts
pnpm test:e2e -- --project=webkit-auth
```
