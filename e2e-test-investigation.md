# E2E Test Investigation with MCP

This document investigates failing E2E tests by manually reproducing the test scenarios using the MCP screenshot tool.

## Test Investigation Results

### 1. Signup Flow Test

**Test**: `should complete successful signup flow for new user`
**File**: `e2e/tests/unauthenticated/auth-flow.unauth.spec.ts`
**Error**: Form shows "Passwords do not match" even though test fills both password fields with same value

**Investigation**:

- Attempted to fill form using JavaScript automation
- Form has placeholders that need to be considered when selecting inputs
- Password validation may be triggered on blur events
- The test may be having timing issues with form validation

### 2. Redirect After Login Test

**Test**: `should persist redirect after login`
**File**: `e2e/tests/unauthenticated/auth-flow.unauth.spec.ts`
**Error**: Test expects redirect parameter but doesn't find it

**Investigation**:

- Checked URL when accessing protected route: http://localhost:5173/dashboard/profile
- Confirmed it DOES redirect to login with parameter: http://localhost:5173/auth/login?redirect=%2Fdashboard%2Fprofile
- The redirect parameter IS being added correctly
- Test assertion may be checking at wrong time or test helper not preserving redirect

### 3. Membership Page (Authenticated)

**Test**: Various membership tests showing login page
**File**: `e2e/tests/authenticated/membership.auth.spec.ts`
**Error**: Tests see login page instead of membership page

**Investigation**:

- Direct access to /dashboard/membership redirects to login (as expected when not authenticated)
- This suggests auth state from setup is not being loaded for these tests
- Likely a test isolation or auth state persistence issue

### 4. Logout Test

**Test**: `should logout successfully`
**File**: `e2e/tests/authenticated/logout.shared.spec.ts`
**Error**: Test shows authenticated dashboard state

**Investigation**:

- The test snapshot shows user IS authenticated (Welcome back, Test User!)
- Dashboard shows active membership status
- Logout button is visible in sidebar
- Attempted to click logout button but selector may need adjustment
- Test likely failing on logout action or post-logout assertion

### 5. Profile Information Test

**Test**: `should display current profile information`
**File**: `e2e/tests/authenticated/profile.auth.spec.ts`
**Error**: Test snapshot shows complete profile data

**Investigation**:

- Profile page loaded successfully with all user data
- Shows complete profile including emergency contact info
- This test likely passed but snapshot was captured
- No actual error here

### 6. Membership Confirmation Test

**Test**: `should show payment confirmation for new membership`
**File**: `e2e/tests/authenticated/membership.auth.spec.ts`
**Error**: Test shows membership page with no active membership

**Investigation**:

- User is authenticated (sidebar visible)
- Membership page loads correctly
- Shows "No Active Membership" status
- Purchase button is available
- Test may be expecting different state or failing on purchase flow

## Summary of Findings

### Working Tests (but captured as errors):

- Profile display test - shows complete data correctly
- Some membership tests - page loads with correct authentication

### Authentication Issues:

- Some tests show login page when they should show authenticated content
- Suggests auth state persistence issues between tests
- May be related to parallel test execution

### Form/Interaction Issues:

- Signup form - password validation timing/event issues
- Logout button - selector or click handler issues

### Test Assertion Issues:

- Redirect parameter test - parameter IS added but test doesn't detect it
- Some tests may be checking state at wrong time

### Root Causes:

1. **Test Isolation**: Multiple tests using same test@example.com user
2. **Timing Issues**: Tests not waiting for proper state changes
3. **Parallel Execution**: Tests interfering with each other
4. **Event Handling**: Form validation events not triggering as expected in tests

### Recommendations:

1. Run tests with --workers=1 to avoid parallel conflicts
2. Add proper wait conditions for form validations
3. Ensure each test has unique test data
4. Add explicit waits for navigation/state changes
