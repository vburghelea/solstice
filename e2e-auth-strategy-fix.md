# E2E Test Auth Strategy Fix

## Problem Identified

The main issue was that authenticated tests were NOT using the shared auth state from `auth.setup.ts`. Instead:

- Only `*.shared.spec.ts` tests used the stored auth state
- All other authenticated tests (`*.auth.spec.ts`, etc.) were doing a full UI login for EVERY test file
- This caused slowness, flakiness, and cascading failures

## Solution Implemented

### 1. Consolidated Auth Projects in playwright.config.ts

Changed from separate projects to unified authenticated projects:

```typescript
// Before:
// - chromium-shared-auth (only *.shared.spec.ts)
// - chromium-auth (no storageState)

// After:
{
  name: "chromium-authenticated",
  use: {
    ...devices["Desktop Chrome"],
    storageState: "e2e/.auth/user.json",  // All auth tests now use this!
  },
  dependencies: ["setup"],
  testMatch: /.*\.(auth|dashboard|profile|teams|shared)\.spec\.ts/,
}
```

### 2. Created Test Isolation Strategy

Added `e2e/fixtures/auth-fixtures.ts` to ensure clean state between tests while preserving auth:

- Clears cookies (but not localStorage with auth tokens) before each test
- Provides hook for resetting test data after each test

### 3. Added Test Data Helpers

Created `e2e/helpers/test-data-reset.ts` with utilities for:

- Resetting user profile data between tests
- Generating unique test data to avoid parallel test conflicts

## Next Steps

### 1. Update All Authenticated Test Files

Each authenticated test file needs to be updated from:

```typescript
// OLD PATTERN
import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

test.beforeEach(async ({ page }) => {
  await clearAuthState(page);
  await gotoWithAuth(page, "/dashboard/profile", {
    email: "profile-edit@example.com",
    password: "testpassword123",
  });
});
```

To:

```typescript
// NEW PATTERN
import { test, expect } from "../../fixtures/auth-fixtures";

test.beforeEach(async ({ page }) => {
  // Just navigate - already authenticated!
  await page.goto("/dashboard/profile");

  // Wait for page to be ready
  await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible({
    timeout: 15000,
  });
});
```

### 2. Use Unique Test Data

For tests that create data (teams, etc.), use unique identifiers:

```typescript
import { generateUniqueTestData } from "../../helpers/test-data-reset";

test("should create team", async ({ page }) => {
  const testData = generateUniqueTestData("e2e-team");
  await page.getByLabel("Team Name").fill(testData.name);
  await page.getByLabel("URL Slug").fill(testData.slug);
  // ...
});
```

### 3. Consider API Reset Endpoint

For better test isolation, consider adding a test-only API endpoint:

```typescript
// /api/test/reset-user (only in test environment)
export async function resetTestUser(email: string) {
  // Reset user profile to default state
  // Clear user's teams, memberships, etc.
}
```

## Benefits

1. **Speed**: Tests no longer do UI login (saves 30+ seconds per test file)
2. **Reliability**: No more login flakiness
3. **Maintainability**: Simpler test code
4. **Isolation**: Clean state between tests while preserving auth

## Potential Issues to Watch

1. **Shared User State**: All tests share the same authenticated user
   - Mitigated by: Clearing cookies and potential API reset
2. **Parallel Conflicts**: Tests modifying same data in parallel
   - Mitigated by: Unique test data generation
3. **Stale Auth**: Auth token might expire during long test runs
   - Mitigated by: Playwright's retry mechanism will re-run setup
