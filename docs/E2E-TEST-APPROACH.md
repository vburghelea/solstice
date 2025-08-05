# E2E Test Approach and Best Practices

Last Updated: 2025-08-05

## Current Test Strategy: Inline Authentication

After extensive testing and analysis, we've determined that **inline authentication** using `gotoWithAuth` is the most reliable approach for E2E tests in this codebase.

### Why Inline Auth?

1. **Shared auth state has race conditions** - The cookies aren't properly loaded before tests navigate, causing authentication failures
2. **100% success rate with inline auth** - All tests converted to inline auth pass reliably on Chromium
3. **Clearer test isolation** - Each test gets a fresh login, preventing state pollution between tests

## Standard Test Pattern

All authenticated E2E tests should follow this pattern:

```typescript
import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

// IMPORTANT: Opt out of shared auth state
test.use({ storageState: undefined });

test.describe("Feature Name (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/dashboard", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });
  });

  test("should do something", async ({ page }) => {
    // Test implementation
  });
});
```

## Test User Accounts

The following test users are seeded by `scripts/seed-e2e-data.ts`:

- `test@example.com` - General authenticated tests (no teams, no membership)
- `admin@example.com` - Admin role tests (has active membership)
- `teamcreator@example.com` - Team creation tests (profile complete, no teams)
- `profile-edit@example.com` - Profile editing tests
- `membership-purchase@example.com` - Membership purchase tests (no membership)
- `team-join@example.com` - Team joining tests

## Current Test Status (Chromium)

### ✅ Passing (20+ tests)

- All dashboard tests
- All logout tests
- All navigation tests
- Most auth flow tests
- Basic membership tests

### ❌ Known Failures (6 tests)

1. **Signup flow** - Form validation timing issue
2. **Membership purchase flow** - 5 tests failing due to checkout mock issues

### 🦊 Firefox Issues

- 9+ tests fail with navigation errors (`NS_BINDING_ABORTED`, `NS_ERROR_FAILURE`)
- Focus on Chromium for now

## File Naming Conventions

- `.shared.spec.ts` - Originally for shared auth state (now use inline auth)
- `.auth.spec.ts` - Tests requiring authentication
- `.unauth.spec.ts` - Tests for unauthenticated flows

## Key Commands

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm playwright test dashboard.shared.spec.ts --reporter=list

# Run only Chromium tests
pnpm playwright test --project=chromium-authenticated

# Run with UI mode for debugging
pnpm test:e2e:ui

# Seed test data (run before tests)
pnpm test:e2e:setup
```

## Common Issues and Solutions

### Issue: Test fails with "Expected to be on authenticated page but ended up on login"

**Solution**: Ensure the test uses the inline auth pattern with `clearAuthState` and `gotoWithAuth`

### Issue: Form validation errors even after filling fields

**Solution**: Add explicit waits for fields to be ready and use click() before fill()

### Issue: Firefox navigation errors

**Solution**: Focus on Chromium tests for now, Firefox has known issues with auth state

## Migration Guide

To convert a test from shared auth to inline auth:

1. Remove: `import { expect, test } from "../../fixtures/auth-fixtures"`
2. Add: `import { expect, test } from "@playwright/test"`
3. Add: `import { clearAuthState, gotoWithAuth } from "../../utils/auth"`
4. Add: `test.use({ storageState: undefined })` at file level
5. Update `beforeEach` to use `clearAuthState` and `gotoWithAuth`
6. Replace `authenticatedGoto` calls with regular `page.goto()`

## Do NOT Use

- ❌ `auth-fixtures` - Deprecated, causes race conditions
- ❌ Shared auth state without `storageState: undefined`
- ❌ `authenticatedGoto` when using inline auth (redundant)

## Future Improvements

1. Fix shared auth state race condition for better performance
2. Investigate Firefox-specific cookie/navigation issues
3. Add retry logic for flaky form interactions
4. Consider using worker-scoped fixtures for parallel test execution

---

Remember: **When in doubt, use inline auth with `gotoWithAuth`**. It's slower but reliable.
