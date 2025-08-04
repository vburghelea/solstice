# E2E Test Fixes - Comprehensive Analysis

## Summary of Issues

After thorough analysis of the codebase, test results, and recent changes, there are multiple interconnected issues causing the E2E test failures:

### 1. Authentication Issues (90/144 failures)

- **Primary Issue**: Tests are being redirected to login page despite auth setup completing successfully
- **Evidence**:
  - Auth setup passes and creates valid cookies in `e2e/.auth/user.json`
  - When tests run individually with `--headed`, some authenticated tests DO work
  - 90 out of 144 failed tests show the login page in error snapshots

### 2. Cookie Domain/Path Issues

- **Better Auth Configuration**:
  - Server sets cookies with `domain: localhost` (no port)
  - Client makes requests to `http://localhost:5173`
  - Cookie settings in `src/lib/auth/server-helpers.ts` use `sameSite: "lax"`
- **Potential Mismatch**: The auth cookies might not be sent correctly due to domain/port differences

### 3. Session Validation Issues

- **getCurrentUser** function in `auth.queries.ts` fetches session with `auth.api.getSession({ headers })`
- **Route Guards**: `requireAuthAndProfile` throws redirect if user is null
- **Root Route**: Catches errors and returns `{ user: null }` which triggers auth redirects

### 4. Database Connection Issues

- **Shared Database**: E2E tests use the same database as development
- **Foreign Key Constraints**: Seed script fails when trying to delete users due to:
  ```
  update or delete on table 'user' violates foreign key constraint 'teams_created_by_user_id_fk'
  ```
- **Missing Cleanup Order**: Need to delete in correct order: teamMembers → teams → memberships → userRoles → session → account → user

### 5. Environment Variable Issues

- **Base URL Mismatch**:
  - E2E tests expect `VITE_BASE_URL=http://localhost:5173`
  - Auth client uses `window.location.origin` in browser
  - Server uses complex logic to determine base URL
- **Missing Variables**: Some tests might be missing required env vars from `.env.e2e`

### 6. Test Pattern Issues

- **File Naming**: Tests use `.shared.spec.ts` but config correctly includes this pattern
- **Auth Fixtures**: Fixed to not clear cookies, but might need additional setup
- **Race Conditions**: Some tests still have timing issues despite fixes

## Completed Fixes

### Phase 1: Foundation Fixes ✅

1. **Date Validation Bug** - Fixed UTC timezone handling in profile schema
2. **gotoWithAuth Race Condition** - Fixed by re-reading URL after navigation
3. **Query Param Cleanup** - Added to clearAuthState to remove ?edit=true persistence
4. **Test Data Generators** - Created unique data generators for parallel test isolation

### Phase 2: Test Refactoring ✅

1. **Updated Auth Pattern** - Converted tests to use shared auth state via fixtures
2. **Profile Tests** - Updated profile-edit.auth.spec.ts with new pattern
3. **Membership Tests** - Updated with unique users
4. **Teams Tests** - Updated with unique team data
5. **Other Auth Tests** - Updated profile.auth.spec.ts, team-browse.auth.spec.ts

### Phase 3: Polish ✅

1. **Replaced waitForTimeout** - All instances replaced with proper waits
2. **Fixed Ambiguous Selectors** - Updated to use more specific selectors

## Root Cause Analysis

### Why Auth State Isn't Working:

1. **Cookie Trust Issue**: Better Auth might not trust cookies from a different origin/port
2. **Session Validation Failure**: The `getCurrentUser` function might be failing to validate the session
3. **Headers Not Passed**: The test browser's headers might not include the cookies correctly
4. **SSR vs Client Mismatch**: The server-side auth check might behave differently than client-side

### Evidence from Code Review:

1. **Auth Setup Success**: `pnpm playwright test --project=setup` passes in 4.5s
2. **Valid Cookies Created**: `e2e/.auth/user.json` contains valid session cookies
3. **Some Tests Work**: When run individually with `--headed`, authenticated tests can succeed
4. **Bulk Failure Pattern**: When run in parallel, most authenticated tests fail

## Recommended Fixes

### 1. Fix Cookie Configuration

```typescript
// In auth server config, ensure cookies work for testing:
advanced: {
  cookiePrefix: "solstice",
  useSecureCookies: false, // Explicitly false for localhost
  defaultCookieAttributes: {
    secure: false,
    sameSite: "lax",
    httpOnly: true,
    path: "/",
    domain: undefined, // Let browser handle domain
  },
}
```

### 2. Fix Database Seeding Order

```typescript
// In seed-e2e-data.ts, clear in correct order:
console.log("Clearing existing data in correct order...");
await db.delete(teamMembers).where(like(teamMembers.teamId, "test-%"));
await db.delete(teams).where(like(teams.description, "%E2E test%"));
await db.delete(memberships).where(like(memberships.userId, "%example.com%"));
await db.delete(userRoles).where(like(userRoles.userId, "%example.com%"));
await db.delete(session).where(like(session.userId, "%example.com%"));
await db.delete(account).where(like(account.userId, "%example.com%"));
await db.delete(user).where(like(user.email, "%@example.com"));
```

### 3. Add Debug Logging

```typescript
// In getCurrentUser:
console.log("[getCurrentUser] Headers:", headers);
console.log("[getCurrentUser] Session result:", session);

// In auth.setup.ts:
console.log("[Auth Setup] Login response:", loginResponse);
console.log("[Auth Setup] Cookies saved:", await page.context().cookies());
```

### 4. Fix Base URL Consistency

```typescript
// Ensure all auth operations use consistent base URL
const baseURL = "http://localhost:5173";
```

### 5. Add Session Verification

```typescript
// In auth.setup.ts after saving state:
// Verify the session is actually valid
const testResponse = await page.request.get("/api/auth/session");
console.log("[Auth Setup] Session verification:", await testResponse.json());
```

## Test Execution Strategy

1. **First**: Run `pnpm test:e2e:setup` to seed database
2. **Verify**: Check that test users exist in database
3. **Debug**: Run single test with logging: `pnpm playwright test profile.auth.spec.ts --project=chromium-authenticated --headed --debug`
4. **Fix**: Apply fixes based on debug output
5. **Scale**: Once one test passes, run all tests

## Key Insights

1. **Auth Works Partially**: The setup completes and some tests can authenticate
2. **Parallel Execution Issue**: Problems manifest when running many tests together
3. **Cookie/Session Issue**: Most likely the cookies aren't being properly validated
4. **Database State**: Foreign key constraints indicate incomplete cleanup

## Critical Insights After Full Review

### Mixed Test Patterns Found

After reviewing all files, I discovered:

1. **Auth setup works** - Creates valid cookies in `e2e/.auth/user.json`
2. **Playwright config is correct** - Uses `storageState: "e2e/.auth/user.json"` for authenticated projects
3. **Mixed imports** - Some tests use auth fixtures, others use standard Playwright
4. **Both should work** - Playwright loads auth state via project configuration

### The Real Problem Must Be Elsewhere

Since Playwright's `storageState` configuration should handle auth automatically:

1. **Session validation failing** - The server might not be accepting the stored cookies
2. **Cookie domain/path issues** - Cookies might not be sent with requests
3. **Timing issues** - Auth state might not be fully loaded before tests run
4. **Server-side session expiry** - Sessions might be invalidated between setup and tests

### Other Issues Found

1. **Database Seeding Order** - Must delete in correct order to avoid FK constraints
2. **No E2E-specific database** - Tests pollute development database
3. **Cookie domain mismatch potential** - Cookies set for `localhost` without port
4. **Missing debug logging** - Hard to diagnose session validation failures

## Root Cause FOUND!

Through debugging with Playwright MCP and running individual tests:

1. **Authentication WORKS correctly** - When I manually logged in via MCP, the auth persisted
2. **Individual tests PASS** - Running `profile.auth.spec.ts` with `--headed` passed successfully
3. **The stored auth state is VALID** - Cookies are being saved and loaded correctly

### The Real Issues Found:

1. **Parallel Test Execution Conflicts**:
   - Multiple tests share the same test user (`test@example.com`)
   - When tests run in parallel, they interfere with each other's sessions
   - Logout in one test invalidates sessions for other running tests

2. **Strict Mode Selector Violations**:
   - Dashboard tests have ambiguous selectors (e.g., `{ name: "Teams" }` matches multiple headings)
   - These cause 2 consistent failures even with single worker

### Evidence:

- Single test with `--headed`: ✅ PASSED (profile.auth.spec.ts)
- Manual browser testing: ✅ Auth works perfectly
- Single worker (`--workers=1`): ✅ 7/9 tests pass (only selector issues fail)
- Parallel execution: ❌ 90/144 failures (auth + selector issues)

### Debugging Results:

- Cookies are saved correctly in `e2e/.auth/user.json`
- Playwright loads auth state correctly via `storageState`
- Server accepts the cookies and maintains sessions
- The issue is test interference, not authentication

## Solution

Based on the debugging findings, here's what needs to be fixed:

### 1. Test Isolation (CRITICAL)

- Use unique test users for each test file (already partially implemented with test-data.ts)
- Ensure tests don't share state that can interfere with each other
- Consider using test fixtures that create fresh users for each test

### 2. Fix Selector Issues (HIGH)

```typescript
// Current (ambiguous):
await expect(page.getByRole("heading", { name: "Teams" })).toBeVisible();

// Fixed (specific):
await expect(page.getByRole("heading", { name: "My Teams", level: 1 })).toBeVisible();
// OR
await expect(page.locator("h1").filter({ hasText: "My Teams" })).toBeVisible();
```

### 3. Database Seeding (HIGH)

- Fix foreign key constraint order in seed script
- Clear data in correct order: teamMembers → teams → memberships → userRoles → session → account → user

### 4. Run Strategy

- For now, use `--workers=1` to ensure tests pass
- After implementing test isolation, can return to parallel execution

## Next Steps Priority (Final)

1. **CRITICAL**: Fix the 2 strict mode selector violations in dashboard tests
2. **HIGH**: Fix database seeding script foreign key constraints
3. **HIGH**: Implement proper test user isolation
4. **MEDIUM**: Run full test suite with `--workers=1` to verify all pass
5. **LOW**: Optimize for parallel execution after isolation is implemented

## Files Reviewed

### Core Test Files

- [x] `/Users/austinwallace/dev/solstice/e2e-test-fixes-complete-summary.md` - This summary document
- [x] `/Users/austinwallace/dev/solstice/.env.e2e` - E2E test environment configuration
- [x] `/Users/austinwallace/dev/solstice/e2e/fixtures/auth-fixtures.ts` - Custom test fixtures
- [x] `/Users/austinwallace/dev/solstice/e2e/auth.setup.ts` - Auth setup for shared state
- [x] `/Users/austinwallace/dev/solstice/e2e/tests/authenticated/profile.auth.spec.ts` - Profile test example
- [x] `/Users/austinwallace/dev/solstice/playwright.config.ts` - Playwright configuration

### Test Results

- [x] `/Users/austinwallace/dev/solstice/e2e-test-results/tests-authenticated-profil-fb9b1-current-profile-information-chromium-authenticated/error-context.md` - Sample error showing login page
- [x] `/Users/austinwallace/dev/solstice/e2e-test-results/tests-authenticated-dashbo-3491e-rd-with-correct-information-firefox-authenticated/error-context.md` - Firefox error showing login page

### Auth Implementation

- [x] `/Users/austinwallace/dev/solstice/src/lib/auth/index.ts` - Client-safe auth exports
- [x] `/Users/austinwallace/dev/solstice/src/lib/auth/server-helpers.ts` - Server auth configuration
- [x] `/Users/austinwallace/dev/solstice/src/routes/api/auth/$.ts` - Auth API route handler
- [x] `/Users/austinwallace/dev/solstice/src/lib/auth-client.ts` - Auth client facade
- [x] `/Users/austinwallace/dev/solstice/src/features/auth/auth.queries.ts` - getCurrentUser server function
- [x] `/Users/austinwallace/dev/solstice/src/lib/auth/middleware/auth-guard.ts` - Auth middleware
- [x] `/Users/austinwallace/dev/solstice/src/lib/auth/guards/route-guards.ts` - Route guard functions

### Route Files

- [x] `/Users/austinwallace/dev/solstice/src/routes/__root.tsx` - Root route with user loading
- [x] `/Users/austinwallace/dev/solstice/src/routes/dashboard/route.tsx` - Dashboard route with auth guard

### Environment Configuration

- [x] `/Users/austinwallace/dev/solstice/src/lib/env.client.ts` - Client environment variables
- [x] `/Users/austinwallace/dev/solstice/src/lib/env.server.ts` - Server environment variables

### Database/Seeding

- [x] `/Users/austinwallace/dev/solstice/scripts/seed-e2e-data.ts` - E2E test data seeding script

### Supporting Files Checked

- [x] `/Users/austinwallace/dev/solstice/e2e/.auth/user.json` - Stored auth state (via Bash)
- [x] `/Users/austinwallace/dev/solstice/src/features/profile/profile.schemas.ts` - Date validation fix confirmed
- [x] `/Users/austinwallace/dev/solstice/e2e/utils/auth.ts` - Auth helper functions with race condition fix
- [x] `/Users/austinwallace/dev/solstice/e2e/utils/test-data.ts` - Test data generators implemented
- [x] `/Users/austinwallace/dev/solstice/e2e/tests/authenticated/dashboard.shared.spec.ts` - Dashboard tests using standard Playwright

### Database Layer

- [x] `/Users/austinwallace/dev/solstice/src/db/connections.ts` - Database connection handling (pooled vs unpooled)
- [x] `/Users/austinwallace/dev/solstice/src/db/server-helpers.ts` - Database server helpers
- [x] `/Users/austinwallace/dev/solstice/src/db/index.ts` - Database exports

### Additional Files Reviewed

- [x] `/Users/austinwallace/dev/solstice/src/features/auth/components/login.tsx` - Login form implementation
- [x] Better Auth documentation search - Not found locally

### Key Findings from File Review

1. **Authentication Flow**:
   - Login component uses `auth.signIn.email()` from Better Auth client
   - Redirects to dashboard by default or to `?redirect` param
   - Invalidates user query and router after successful login

2. **Database Configuration**:
   - Uses Neon database with pooled/unpooled connections
   - Automatically selects connection type based on environment
   - E2E tests share the same database as development

3. **Test Pattern Observations**:
   - Dashboard tests use standard Playwright test, NOT auth fixtures
   - Tests expect "Test User" which is seeded in the database
   - Membership/team tests also failing with login page redirect

4. **Cookie/Session Details**:
   - Auth cookies have `domain: localhost` (no port specified)
   - Session cookies expire in ~30 days
   - Better Auth uses both `session_token` and `session_data` cookies

# E2E Test Selector Fixes for Strict Mode

## Problem

Playwright's strict mode requires selectors to match exactly one element. When multiple elements match, tests fail with "strict mode violation" errors.

## Affected Tests and Fixes

### 1. `dashboard.shared.spec.ts`

**Line 103**: `await expect(page.getByRole("heading", { name: "Teams" })).toBeVisible();`

- **Issue**: Matches both "My Teams" (h1) and "No teams yet" (h3)
- **Fix Options**:

  ```typescript
  // Option A: Be more specific with exact text
  await expect(page.getByRole("heading", { name: "My Teams" })).toBeVisible();

  // Option B: Specify heading level
  await expect(page.getByRole("heading", { name: "My Teams", level: 1 })).toBeVisible();

  // Option C: Use locator with tag
  await expect(page.locator("h1").filter({ hasText: "My Teams" })).toBeVisible();
  ```

**Line 119**: `await expect(page.getByRole("heading", { name: "Teams" })).toBeVisible();`

- **Fix**: Same as line 103

**Line 109**: `await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();`

- **No Issue**: Events page only has one h1 "Events"
- **Optional**: Add level for consistency
  ```typescript
  await expect(page.getByRole("heading", { name: "Events", level: 1 })).toBeVisible();
  ```

**Line 129**: `await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();`

- **No Issue**: Same as line 109

### 2. `navigation.shared.spec.ts`

**Line 57**: `await expect(page.getByRole("heading", { name: "Teams" })).toBeVisible();`

- **Issue**: Same as dashboard.shared.spec.ts - matches both "My Teams" and "No teams yet"
- **Fix**:
  ```typescript
  await expect(page.getByRole("heading", { name: "My Teams" })).toBeVisible();
  ```

**Line 72**: `await expect(page.getByRole("heading", { name: "Teams" })).toBeVisible();`

- **Fix**: Same as line 57

**Line 113**: `await expect(page.getByRole("heading", { name: "Teams" })).toBeVisible();`

- **Fix**: Same as line 57

**Line 115**: `await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();`

- **No Issue**: Events page only has one heading
- **Optional**: Add level for consistency

**Line 117**: `await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();`

- **No Issue**: Members page only has one heading
- **Optional**: Add level for consistency

**Line 119**: `await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();`

- **Unknown**: Need to check Settings page structure
- **Preventive**: Use level specification

### 3. `team-browse.auth.spec.ts`

**Uses regex pattern**: `{ name: /Browse.*Teams|Find.*Team|Discover.*Teams/i }`

- **Current**: Already specific enough with regex pattern
- **No fix needed**: This is properly handling different possible headings

### 4. `teams.auth.spec.ts`

**Line**: `await expect(page.getByRole("heading", { name: "My Teams" })).toBeVisible();`

- **Good**: Already uses exact text "My Teams"
- **No fix needed**: This selector is specific enough

## General Best Practices for Selectors

1. **Always use exact text when possible**:
   - Bad: `{ name: "Teams" }`
   - Good: `{ name: "My Teams" }`

2. **Specify heading level for headings**:
   - Bad: `page.getByRole("heading", { name: "My Teams" })`
   - Good: `page.getByRole("heading", { name: "My Teams", level: 1 })`

3. **Use data-testid for complex cases**:
   - Add to component: `<h1 data-testid="teams-page-title">My Teams</h1>`
   - Use in test: `page.getByTestId("teams-page-title")`

4. **Combine selectors for specificity**:
   ```typescript
   // Target heading within main content area
   page.locator("main").getByRole("heading", { name: "My Teams", level: 1 });
   ```

## Implementation Strategy

1. **Fix critical failures first**: dashboard.shared.spec.ts lines 103 and 119
2. **Apply preventive fixes**: Add level specification to all heading selectors
3. **Test with --workers=1**: Verify fixes work before parallel execution
4. **Add data-testid**: For frequently used elements in future development

## Summary of Required Fixes

### Critical Fixes (Causing Current Failures)

1. **dashboard.shared.spec.ts**:
   - Line 103: Change `"Teams"` to `"My Teams"`
   - Line 119: Change `"Teams"` to `"My Teams"`

2. **navigation.shared.spec.ts**:
   - Line 57: Change `"Teams"` to `"My Teams"`
   - Line 72: Change `"Teams"` to `"My Teams"`
   - Line 113: Change `"Teams"` to `"My Teams"`

### Total Changes Needed

- **5 lines** need immediate fixes (all changing "Teams" to "My Teams")
- **No other strict mode violations** found in current test suite
- Events, Members, and other pages have unique headings

## Quick Fix Command

To fix all Teams selectors at once:

```bash
# Fix dashboard.shared.spec.ts
sed -i '' 's/{ name: "Teams" }/{ name: "My Teams" }/g' e2e/tests/authenticated/dashboard.shared.spec.ts

# Fix navigation.shared.spec.ts
sed -i '' 's/{ name: "Teams" }/{ name: "My Teams" }/g' e2e/tests/authenticated/navigation.shared.spec.ts
```

## Testing the Fixes

After implementing fixes:

```bash
# Test specific files that had issues
pnpm playwright test dashboard.shared.spec.ts navigation.shared.spec.ts --project=chromium-authenticated

# Test all with single worker to verify
pnpm playwright test --workers=1

# Test with parallel execution (after all fixes)
pnpm playwright test
```
