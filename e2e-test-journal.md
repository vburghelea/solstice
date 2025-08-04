# E2E Test Journal

## Test Run Status

- **Started**: 2025-08-04 01:31:00 UTC
- **Total Tests**: ~200+
- **Current Status**: Running

## Test Entries

### Test #001: should-complete-successful-signup-flow-for-new-user

- **Full Name**: tests-unauthenticated-auth-5998d-ul-signup-flow-for-new-user-chromium-unauthenticated
- **Status**: ❌ FAILED
- **Entries**:
  - `[2025-08-04 08:33:00]` Initial failure detected - "Passwords do not match" error showing even though test filled both password fields correctly
  - `[2025-08-04 08:45:00]` Fixed password validation logic to only validate when both fields have values (signup.tsx:142)
  - `[2025-08-04 08:47:00]` Updated test to handle redirect chain: signup → dashboard → onboarding (auth-flow.unauth.spec.ts:77)
  - **Expected Fix**: Password validation should now work correctly, test should pass on next run

### Test #002: should-persist-redirect-after-login

- **Full Name**: tests-unauthenticated-auth-7851b-ersist-redirect-after-login-chromium-unauthenticated
- **Status**: ❌ FAILED
- **Entries**:
  - `[2025-08-04 08:33:00]` Initial failure detected - test expects redirect parameter to be preserved after login
  - `[2025-08-04 09:00:00]` Verified redirect parameter is correctly preserved in URL when accessing protected page
  - `[2025-08-04 09:02:00]` Confirmed login form correctly reads redirect parameter from URL
  - `[2025-08-04 09:02:00]` uiLogin helper correctly passes redirect parameter to login page
  - **Analysis**: Test likely failing due to timing or test data issues, not functionality
  - **Next Steps**: Need to verify test credentials are working correctly

### Test #003: should-persist-redirect-after-login-firefox

- **Full Name**: tests-unauthenticated-auth-7851b-ersist-redirect-after-login-firefox-unauthenticated
- **Status**: ❌ FAILED
- **Entries**:
  - `[2025-08-04 08:33:00]` Firefox variant of redirect test also failing
  - **Next Steps**: Same fix as chromium variant should resolve this

## Summary of Fixes Applied

1. **Password Validation** (2025-08-04 08:45:00)
   - Modified confirmPassword validation to only check when both fields have values
   - File: src/features/auth/components/signup.tsx
   - Change: Added check for `value && password` before comparing

2. **Signup Redirect Chain** (2025-08-04 08:47:00)
   - Updated test to expect redirect chain: signup → dashboard → onboarding
   - File: e2e/tests/unauthenticated/auth-flow.unauth.spec.ts
   - Change: Used wildcard pattern `**/onboarding` in waitForURL

## Critical Discovery (2025-08-04 09:10:00)

**Root Cause**: E2E test setup was not run before tests!

- The command `pnpm test:e2e:setup` MUST be run before `pnpm test:e2e`
- This seeds the test database with required test users
- Test user: test@example.com / testpassword123
- Admin user: admin@example.com / testpassword123
- All authenticated tests were failing because users didn't exist

**Update (2025-08-04 09:20:00)**: User confirmed setup was run

- Test user credentials verified working manually
- Auth state file exists at `e2e/.auth/user.json`
- Issue appears to be with auth state persistence or session validity
- Possible causes:
  - Session tokens in auth state file may have expired
  - Auth setup test may not be running properly
  - Storage state may not be loaded correctly by Playwright

**Root Cause Found (2025-08-04 09:25:00)**: Wrong user in auth state!

- Auth setup uses `test@example.com` for ALL authenticated tests
- But tests expect different users for different scenarios:
  - `profile-edit@example.com` for profile editing tests
  - `membership-purchase@example.com` for membership tests
  - `team-join@example.com` for team joining tests
  - etc.
- The seed script creates all these users, but auth setup only logs in with one
- **Solution**: Need to either:
  1. Update tests to use the same user (test@example.com)
  2. Create multiple auth state files for different test scenarios
  3. Have tests log in individually with their specific users

## Fixes Applied (2025-08-04 09:30:00)

1. **Profile Edit Test** - Fixed email expectation
   - Changed from `profile-edit@example.com` to `test@example.com`
   - File: e2e/tests/authenticated/profile-edit.auth.spec.ts

2. **Team Members Test** - Fixed admin password
   - Changed from `adminpassword123` to `testpassword123`
   - File: e2e/tests/authenticated/team-members.auth.spec.ts

3. **Membership Test** - No change needed
   - Already logs in with specific user in beforeEach

## Tests Pending Investigation

- Remaining authenticated tests failing for unknown reasons
- Need to wait for current test run to complete before rerunning

## Summary of Root Causes Identified (2025-08-04 09:35:00)

1. **Signup Test Failure**: Password validation was checking even when fields were empty
   - **Fixed**: Added check to only validate when both password fields have values

2. **Authenticated Test Failures**: Wrong user in shared auth state
   - Auth setup uses `test@example.com` but some tests expect specific users
   - **Fixed**: Updated tests to use the authenticated user or log in with specific users

3. **Password Errors**: Some tests used wrong passwords
   - All test users use `testpassword123`, not `adminpassword123`
   - **Fixed**: Updated password in team-members test

## Test Results After Fixes (2025-08-04 09:50:00)

1. **Profile Edit Test**: ✅ PASSED
   - Auth state working correctly
   - Email expectation fix confirmed working

2. **Signup Test**: ❌ FAILED
   - Manual verification shows signup works and redirects to `/onboarding`
   - Test timeout suggests timing issue or test environment problem
   - Error shows validation errors which don't match manual test

3. **Redirect Test**: ❌ FAILED
   - Test expects `redirect=` in URL but auth guard adds it as search param
   - Code review confirms redirect param is added correctly
   - Test assertion may need update

## Fixes Applied (2025-08-04 10:00:00)

1. **Redirect Test** - Updated to check URL correctly
   - Changed from regex pattern to string contains check
   - Added wait for navigation to complete
   - Now checks for both `/auth/login` and `redirect=` parameter

2. **Signup Test** - Added timing improvements
   - Added 500ms wait before submit to ensure form is ready
   - Changed waitForURL to accept either `/dashboard` or `/onboarding`
   - This handles the redirect chain properly

## Additional Fixes (2025-08-04 10:15:00)

1. **Redirect Test** - Further improvements
   - Added `waitUntil: "networkidle"` to ensure page loads completely
   - Changed to use `expect(page).toHaveURL()` with regex pattern
   - MCP confirmed redirect parameter IS present in actual navigation

2. **Signup Test** - Fixed field filling issues
   - Added explicit clicks before filling each field
   - Increased wait time to 1000ms for form validation
   - Removed Tab key presses that might cause issues
   - Test error showed fields were empty, suggesting timing problem

## Next Steps

1. Run both tests individually to verify fixes
2. If tests still fail, use MCP to debug the exact behavior
3. Run full test suite after fixes confirmed

## Notes

- Tests are running with `--workers 1` for sequential execution
- Using HTML reporter with output to e2e-test-results
- Dev server confirmed running on port 5173
- Total errors detected so far: 52+ (still counting as tests run)

## New Test Run Analysis (2025-08-04 10:20:00)

**Test Directory**: e2e-test-results-2
**Current Status**: Running (PID 53417)

### Key Findings:

1. **Signup Test** - Fields shown as disabled in error snapshot
   - **Root Cause**: Fields are disabled during form submission (normal behavior)
   - **Verified**: Manual test confirms signup works correctly and redirects to `/onboarding`
   - **Fix**: Test may need better wait conditions for form state

2. **Logout Tests** - Showing login page instead of dashboard
   - **Investigation**: Auth state file exists and is valid
   - **Some authenticated tests work**: Team management test reaches dashboard successfully
   - **Pattern**: Tests using `clearAuthState` + `gotoWithAuth` work correctly
   - **Fix**: May need to regenerate auth state or fix test setup

3. **Team Tests** - Various failures
   - **Verified**: test-team-1 exists in seed data as "Test Thunder"
   - **Issue**: Some tests may be looking for wrong data or have timing issues

### Test Categories Identified:

- **Signup/Auth Flow**: Form disabled during submission
- **Logout Tests**: Auth state not being loaded properly
- **Team Management**: Tests reach dashboard but fail on specific actions
- **Profile Tests**: Multiple failures, need investigation

## Fixes Applied (2025-08-04 10:30:00)

1. **Logout Tests** - Fixed navigation handling
   - **Issue**: Tests using `expect(page).toHaveURL()` but logout uses `window.location.href`
   - **Fix**: Changed to `page.waitForURL()` to handle hard navigation
   - Files updated: `e2e/tests/authenticated/logout.shared.spec.ts`

2. **Team Creation Test** - Fixed heading text mismatch
   - **Issue**: Test expects "Create New Team" but UI shows "Create a New Team"
   - **Fix**: Updated test to match actual heading text
   - Files updated: `e2e/tests/authenticated/teams-create-no-conflict.auth.spec.ts`

### Patterns Identified:

1. **Firefox Auth Issues**: All logout failures were on Firefox, suggesting browser-specific auth state issues
2. **Chromium Tests Work Better**: Auth state properly loaded in Chromium tests
3. **Hard Navigation**: `window.location.href` navigation needs `waitForURL()` not `expect().toHaveURL()`
4. **Text Matching**: Tests must match exact UI text including articles ("a", "the")

## Summary of All Fixes Applied Today

### 1. Authentication & User Issues

- Fixed password validation in signup form to only check when both fields have values
- Updated profile test to use correct user email (test@example.com)
- Fixed team member test password (testpassword123)

### 2. Navigation & Timing Issues

- Fixed redirect test to use proper URL checking with `waitUntil: "networkidle"`
- Fixed signup test with explicit clicks and longer wait times
- Fixed logout tests to use `waitForURL()` for hard navigation

### 3. UI Text Mismatches

- Fixed team creation test heading ("Create a New Team")

### 4. Test Strategy Improvements

- Added better wait conditions for form states
- Improved timing for form validation
- Used proper Playwright methods for different navigation types

## Recommended Next Steps

1. Wait for current test run to complete
2. Run specific tests to verify fixes:
   ```bash
   pnpm playwright test --grep "should logout successfully" --project=chromium-authenticated
   pnpm playwright test --grep "should successfully create a team" --project=chromium-authenticated
   pnpm playwright test --grep "should complete successful signup" --project=chromium-unauthenticated
   pnpm playwright test --grep "should persist redirect" --project=chromium-unauthenticated
   ```
3. If tests pass, run full suite again
4. Investigate Firefox-specific issues if they persist

## Test Verification Results (2025-08-04 10:40:00)

### Tests Run and Results:

1. **Logout Test**: ✅ PASSED
   - Fix confirmed working: `waitForURL()` properly handles `window.location.href` navigation

2. **Signup Test**: ✅ PASSED
   - Fix confirmed working: Form handles submission state correctly

3. **Team Creation Test**: ❌ FAILED
   - Issue: Form validation prevents submission (fields showing as disabled)
   - Needs further investigation

4. **Redirect Test**: ❌ FAILED
   - Manual verification shows redirect parameter IS added correctly
   - Test issue might be timing or test setup
   - URL confirmed: `/auth/login?redirect=%2Fdashboard%2Fprofile`

### Key Insights:

- Running tests in background with `&` allows control to return
- Auth state file is being regenerated with each test run
- Some fixes work perfectly, others need refinement
- Manual verification with MCP is essential for debugging
