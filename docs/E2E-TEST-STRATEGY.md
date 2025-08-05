# E2E Test Strategy

This document outlines best practices for E2E tests in the Solstice project.

## Core Principles

1. **Test Isolation**: Each test should be independent and not rely on state from other tests
2. **Data Cleanup**: Tests should clean up after themselves to ensure repeatability
3. **Realistic Flows**: Test actual user journeys, not implementation details
4. **Performance**: Keep tests fast by minimizing unnecessary waits and operations

## Test Architecture

### 1. Test Data Management

**Approach**: Use API endpoints for test data setup and cleanup

```typescript
// Before each test that creates data
test.beforeEach(async ({ page }) => {
  await clearUserTeams(page, process.env.E2E_TEST_EMAIL!);
});

// After each test that creates data
test.afterEach(async ({ page }) => {
  try {
    await clearUserTeams(page, process.env.E2E_TEST_EMAIL!);
  } catch (error) {
    console.warn("Cleanup failed:", error);
  }
});
```

### 2. Test User Strategy

**Dedicated Test Users**: Use specific users for different test scenarios

- `test@example.com` - General authenticated tests
- `teamcreator@example.com` - Team creation tests (no existing teams)
- `profile-edit@example.com` - Profile editing tests
- `membership-purchase@example.com` - Membership tests
- `team-join@example.com` - Team joining tests

### 3. Authentication Handling

**Shared Auth State**: Use Playwright's auth fixtures for efficiency

```typescript
// For authenticated tests
import { test } from "../../fixtures/auth-fixtures";

// For tests needing fresh auth state
test.use({ storageState: undefined });
```

### 4. Navigation and Redirects

**Known Issues**:

- Redirect parameters may be stripped during auth flows
- Use helper functions that handle the actual behavior

```typescript
// Instead of testing redirect parameter preservation
// Test the actual user journey
await uiLogin(page, email, password, targetPath);
await expect(page).toHaveURL(targetPath);
```

### 5. Error Handling

**Graceful Degradation**: Tests should handle errors gracefully

```typescript
try {
  await someOperation();
} catch (error) {
  // Log but don't fail if it's a cleanup operation
  console.warn("Operation failed:", error);
}
```

## Test Patterns

### Creating Data

```typescript
test("should create resource", async ({ page }) => {
  // 1. Clean up any existing data
  await clearUserTeams(page, email);

  // 2. Perform the action
  await createTeam(page, teamData);

  // 3. Verify success
  await expect(page.getByText(teamData.name)).toBeVisible();

  // 4. Cleanup happens in afterEach
});
```

### Testing Workflows

```typescript
test("should complete workflow", async ({ page }) => {
  // Test the happy path
  await page.goto("/start");
  await fillForm(page, data);
  await submitForm(page);
  await verifySuccess(page);
});
```

### Testing Error States

```typescript
test("should handle errors", async ({ page }) => {
  // Trigger error condition
  await page.goto("/form");
  await fillInvalidData(page);

  // Verify error handling
  await expect(page.getByText("Error message")).toBeVisible();
});
```

## Common Utilities

### `/e2e/utils/cleanup.ts`

- `clearUserTeams()` - Remove all teams for a user
- `deleteTeam()` - Delete a specific team
- `resetTestUser()` - Reset user to clean state

### `/e2e/utils/auth.ts`

- `uiLogin()` - Login with proper wait conditions
- `clearAuthState()` - Clear all auth data
- `gotoWithAuth()` - Navigate with authentication

### `/e2e/utils/test-data.ts`

- `generateUniqueTeam()` - Create unique test data
- Test data generators for various entities

## Environment Setup

1. **Test Database**: Use a separate database for E2E tests
2. **Seed Data**: Run `pnpm test:e2e:setup` to seed initial data
3. **Cleanup API**: Available at `/api/test/cleanup` (test env only)

## Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e teams-create

# Run with UI mode for debugging
pnpm test:e2e:ui

# Seed test data
pnpm test:e2e:setup
```

## Debugging Failed Tests

1. Check test artifacts in `test-results/`
2. Use `--debug` flag to step through tests
3. Add `await page.pause()` for interactive debugging
4. Check console logs with `page.on('console', msg => console.log(msg.text()))`

## Best Practices Checklist

- [ ] Test has proper setup/cleanup
- [ ] Test is independent of other tests
- [ ] Test uses appropriate wait conditions
- [ ] Test handles errors gracefully
- [ ] Test follows naming convention
- [ ] Test has descriptive assertions
- [ ] Test cleans up created data
- [ ] Test uses existing utilities
