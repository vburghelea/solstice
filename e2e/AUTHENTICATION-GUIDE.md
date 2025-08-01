# E2E Authentication Testing Guide

This guide covers different strategies for handling authentication in E2E tests.

## Strategy Comparison

### 1. Shared Authentication State (Recommended)

**Best for:** Most applications, especially when tests don't modify user data

**Pros:**

- Fastest execution (authenticate once, reuse for all tests)
- Simple to implement
- Reduces load on auth system
- Works well with CI/CD

**Cons:**

- Tests can't modify shared user data
- Not suitable for testing user-specific features

**Implementation:**

- Use `auth.setup.ts` to authenticate once before all tests
- Store auth state in `.auth/user.json`
- All tests automatically use authenticated state

### 2. Multiple Test Accounts

**Best for:** Tests that modify user data or need isolation

**Pros:**

- Tests run in parallel without conflicts
- Each test has clean user state
- Can test user-specific features

**Cons:**

- Requires multiple test accounts
- Slower than shared state
- More complex setup

**Implementation:**

- Use worker-scoped fixtures
- Assign different account per worker
- See `fixtures/auth.ts`

### 3. API-Based Authentication

**Best for:** Speed-critical test suites

**Pros:**

- Fastest authentication method
- Bypasses UI login flow
- More stable (no UI changes affect it)

**Cons:**

- Doesn't test actual login UI
- Requires API access
- May not work with all auth providers

**Implementation:**

- Authenticate via API endpoint
- Set cookies/tokens programmatically
- See `utils/api-auth.ts`

### 4. Mock Authentication

**Best for:** Development and unit-like E2E tests

**Pros:**

- No external dependencies
- Instant authentication
- Full control over user state

**Cons:**

- Doesn't test real auth flow
- May miss auth-related bugs
- Requires mock implementation

## Database Strategies

### Option 1: Dedicated Test Database

```bash
# .env.test
DATABASE_URL=postgresql://user:pass@localhost:5432/solstice_test
```

**Setup:**

```typescript
// e2e/global-setup.ts
import { execSync } from "child_process";

export default async function globalSetup() {
  // Reset test database
  execSync("pnpm db:reset:test", { stdio: "inherit" });

  // Seed test data
  execSync("pnpm db:seed:test", { stdio: "inherit" });
}
```

### Option 2: Database Transactions

```typescript
// Wrap each test in a transaction that rolls back
test.beforeEach(async () => {
  await db.transaction().execute(async (trx) => {
    // Test runs here
    // Transaction automatically rolls back
  });
});
```

### Option 3: Docker Test Environment

```yaml
# docker-compose.test.yml
services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_DB: solstice_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"
```

## Environment Variables

Create `.env.e2e` for E2E test configuration:

```bash
# .env.e2e
E2E_TEST_EMAIL=test@example.com
E2E_TEST_PASSWORD=testpassword123
E2E_BASE_URL=http://localhost:5173

# For multiple test users
E2E_TEST_USER_1_EMAIL=test1@example.com
E2E_TEST_USER_1_PASSWORD=password123
E2E_TEST_USER_2_EMAIL=test2@example.com
E2E_TEST_USER_2_PASSWORD=password123
```

## Implementation Examples

### Example 1: Test with Shared Auth

```typescript
import { test, expect } from "@playwright/test";

test("view dashboard", async ({ page }) => {
  // Already authenticated via setup
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
```

### Example 2: Test with Isolated User

```typescript
import { test, expect } from "../fixtures/auth";

test("update profile", async ({ authenticatedPage }) => {
  await authenticatedPage.goto("/dashboard/profile");
  await authenticatedPage.getByLabel("Phone").fill("+1234567890");
  await authenticatedPage.getByRole("button", { name: "Save" }).click();

  await expect(authenticatedPage.getByText("Profile updated")).toBeVisible();
});
```

### Example 3: Test Different User Roles

```typescript
// fixtures/roles.ts
export const adminTest = base.extend({
  page: async ({ page }, use) => {
    await loginAsAdmin(page);
    await use(page);
  },
});

export const memberTest = base.extend({
  page: async ({ page }, use) => {
    await loginAsMember(page);
    await use(page);
  },
});

// Usage
adminTest("admin can manage teams", async ({ page }) => {
  await page.goto("/admin/teams");
  // Admin-specific tests
});

memberTest("member can view teams", async ({ page }) => {
  await page.goto("/teams");
  // Member-specific tests
});
```

## Best Practices

1. **Use Environment Variables**
   - Never hardcode credentials
   - Use `.env.e2e` for test configuration
   - Add to `.gitignore`

2. **Clean Up Test Data**
   - Reset database between test runs
   - Use transactions when possible
   - Clean up created resources

3. **Optimize for Speed**
   - Reuse authentication when possible
   - Use API auth for data setup
   - Parallelize with isolated accounts

4. **Handle Flakiness**
   - Add proper waits after login
   - Verify auth state before proceeding
   - Use stable selectors

5. **Security Considerations**
   - Use separate test environment
   - Don't use production credentials
   - Limit test account permissions
   - Rotate test credentials regularly

## CI/CD Integration

```yaml
# .github/workflows/e2e.yml
- name: Run E2E tests
  env:
    E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
    E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
  run: |
    pnpm db:reset:test
    pnpm db:seed:test
    pnpm test:e2e
```

## Debugging Authentication Issues

1. **Save auth state for debugging:**

```typescript
await page.context().storageState({ path: "debug-auth-state.json" });
```

2. **Check cookies:**

```typescript
const cookies = await page.context().cookies();
console.log("Auth cookies:", cookies);
```

3. **Verify auth in console:**

```typescript
const isAuthenticated = await page.evaluate(() => {
  return !!localStorage.getItem("auth-token");
});
```
