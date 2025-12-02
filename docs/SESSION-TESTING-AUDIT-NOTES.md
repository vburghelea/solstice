# Testing Audit Session Notes

**Date**: 2025-12-01
**Purpose**: Track issues, workarounds, and tech debt discovered during testing audit

---

## Issues Encountered

### 1. Deleted Non-Meaningful Tests

- **File**: `src/lib/server/__tests__/example.test.ts`
  - **Issue**: Placeholder test with dummy `calculateLeagueStats` function that doesn't exist in codebase
  - **Action**: Deleted

- **File**: `src/components/ui/__tests__/button.test.tsx`
  - **Issue**: Tests CSS class names (`bg-primary`, `h-9`) - brittle, breaks on styling changes
  - **Action**: Deleted

### 2. Server Function Testing Challenges

- **Issue**: Server functions use dynamic imports inside handlers (`await import("~/db/server-helpers")`)
- **Impact**: Makes unit testing difficult - can't easily mock at module level
- **Workaround**: Integration tests mock the entire db client passed as parameter
- **Tech Debt**: Consider dependency injection pattern for server functions to improve testability

### 3. Database Mocking Complexity

- **Issue**: Drizzle ORM's chained query builder pattern is verbose to mock
- **Example**: `db.select().from(table).where(condition).limit(1)` requires mocking entire chain
- **Workaround**: Created `createMockTransaction()` helper in integration tests
- **Tech Debt**: Consider creating shared test utilities for DB mocking

---

## Workarounds Implemented

### 1. Membership Finalize Integration Test

- **Location**: `src/features/membership/__tests__/membership.finalize.integration.test.ts`
- **Approach**: Mock the database client interface rather than individual queries
- **Note**: Tests business logic (idempotency, date calculation) without real DB

---

## Tech Debt Identified

### Testing Infrastructure

1. **No shared DB mock utilities** - Each test file creates its own mocks
2. **No test database setup** - Would enable true integration tests against real DB
3. **Server functions not designed for testability** - Dynamic imports inside handlers

### Schema Notes (for test mocks)

- `membershipPaymentSessions.squarePaymentLinkUrl` is `notNull()` - must be string in mocks
- `membershipPaymentSessions.expiresAt` is nullable - can be `null` in mocks

### Test Coverage Gaps (from audit)

1. **No tests for actual query implementations** in:
   - `teams.queries.ts`, `teams.mutations.ts`
   - `events.queries.ts`, `events.mutations.ts`
   - `membership.queries.ts`, `membership.mutations.ts`
2. **E2E gaps**:
   - Settings page functionality
   - Profile editing flow
   - Logout → session cleared verification
   - Public event viewing (unauthenticated)

### Code Issues Found During Testing

1. **Event Detail Page - Wrong Back Link for Public Users**
   - **File**: `src/routes/events/$slug.index.tsx:124`
   - **Issue**: Back button links to `/dashboard/events` but public (unauthenticated) users should go to `/events`
   - **Fix**: Conditionally render back link based on `user` context:
     ```tsx
     <Link to={user ? "/dashboard/events" : "/events"}>
     ```
   - **Priority**: Low (UX improvement)

---

## E2E Tests Added

### Already Existed (Found during audit)

- [x] Profile editing (`profile-edit.auth.spec.ts`) - Comprehensive! Tests toggle edit mode, cancel, save, emergency contact, privacy settings
- [x] Logout flow (`logout.shared.spec.ts`) - Comprehensive! Tests logout from dashboard, profile, teams; verifies session cleared

### Enhanced

- [x] Settings page (`settings.auth.spec.ts`) - Added password change form validation tests

### Added New

- [x] Public event viewing (`public-events.unauth.spec.ts`) - Tests events index, event detail, sign-in prompt, navigation

---

## Questions / Follow-ups

1. Should we set up a test database for true integration tests?
2. Consider refactoring server functions to accept dependencies for better testability?
3. Should E2E tests run against seeded data or create their own test data?

---

## Session Progress

- [x] Audit existing tests
- [x] Delete non-meaningful tests (`example.test.ts`, `button.test.tsx`)
- [x] Create membership finalize integration test
- [x] Create events registration integration test
- [x] Enhance E2E test for settings (password form, session management)
- [x] Verified profile editing tests exist (comprehensive)
- [x] Verified logout flow tests exist (comprehensive)
- [x] Add E2E test for public events

## Files Changed

### Deleted

- `src/lib/server/__tests__/example.test.ts`
- `src/components/ui/__tests__/button.test.tsx`

### Created

- `src/features/membership/__tests__/membership.finalize.integration.test.ts`
- `src/features/events/__tests__/events.registration.integration.test.ts`
- `e2e/tests/unauthenticated/public-events.unauth.spec.ts`

### Modified

- `e2e/tests/authenticated/settings.auth.spec.ts` - Added password change form and session management tests
- `src/tests/setup.ts` - Added TanStack Start testing infrastructure:
  - `createServerFn` mock that bypasses 'use server' pragma for unit testing
  - TanStack Router mocks (Link, useRouter, useNavigate) for component testing
