# viaSport Route Audit - UX Issues & Recommendations

**Audit Date**: 2025-12-25
**Stage**: sin-dev
**Auditor**: Claude Code

## Summary

This document tracks UX issues, best practice violations, and recommendations found during a systematic review of all routes in the viaSport (sin-dev) environment.

## Issue Severity Levels

- **Critical**: Blocks user workflows, security concerns, or data loss potential
- **High**: Significantly impacts user experience or functionality
- **Medium**: Noticeable UX issues that should be addressed
- **Low**: Minor improvements or polish items

---

## Critical Issues Found

### Issue #1: Privacy Policy Acceptance Blocks All Navigation (CRITICAL)

**Location**: `src/routes/__root.tsx` lines 77-104, `src/features/privacy/components/privacy-acceptance-card.tsx`

**Problem**:

1. The `__root.tsx` enforces a privacy policy acceptance gate that redirects ALL `/dashboard/*` routes to `/dashboard/privacy` if the user hasn't accepted the latest policy
2. When clicking "Accept policy", a 500 error occurs due to invalid UUID validation
3. The mutation uses `policy?.id ?? ""` which can send an empty string if data isn't loaded

**Console Errors**:

```
Error loading user: TypeError: Failed to fetch
ZodError: Invalid UUID at path ["policyId"]
```

**Server Error**:

```
ZodError: Invalid UUID
  at src/lib/server/fn-utils.ts:46:12
  at src/lib/auth/guards/org-context.ts:64:12
```

**Root Cause**:

- `privacy-acceptance-card.tsx:25` - `mutationFn: () => acceptPolicy({ data: { policyId: policy?.id ?? "" } })`
- When policy data isn't loaded or has issues, an empty string is sent which fails UUID validation

**Impact**: Users cannot access ANY dashboard routes - completely blocks the application

**Recommendation**:

1. Check if policy document exists in database
2. Move policy acceptance to onboarding flow for better UX
3. Add proper loading/error states before allowing accept button click
4. Never send empty string for UUID fields

---

### Issue #2: Inconsistent Page State on Client Navigation

**Location**: Privacy page content display

**Problem**: After client-side navigation, the privacy page alternates between showing:

- "No policy document published"
- "Current version: 1.0, Effective: 12/31/2023, Accept policy button"

This suggests caching/hydration issues with React Query or the server function calls failing intermittently.

**Impact**: Confusing UX, users may not know if they can accept the policy

---

### Issue #3: Failed to Fetch Errors on Client Navigation

**Location**: `src/routes/__root.tsx:67` (beforeLoad)

**Problem**: Multiple "Error loading user: TypeError: Failed to fetch" errors appear in console during client-side navigation. The `beforeLoad` catches these errors and returns `{ user: null }` which may cause unexpected behavior.

**Impact**: Authentication state may be lost on navigation, causing redirect loops

---

## Issues Log

| #   | Route                              | Severity | Issue                                                | Recommendation                          | Status   |
| --- | ---------------------------------- | -------- | ---------------------------------------------------- | --------------------------------------- | -------- |
| 1   | /dashboard/\*                      | Critical | Privacy policy gate blocks all routes with 500 error | Fix UUID validation, improve UX flow    | ✅ Fixed |
| 2   | /dashboard/privacy                 | High     | Inconsistent policy display state                    | Fix React Query caching                 | ✅ Fixed |
| 3   | All routes                         | High     | Failed to fetch errors on client navigation          | Investigate server function reliability | ✅ Fixed |
| 4   | /dashboard/select-org              | Medium   | No auto-redirect after org selection                 | Add navigation on selection             | ✅ Fixed |
| 5   | /dashboard/admin/sin/organizations | Medium   | Shows empty despite data in DB                       | Investigate query/permissions           | ✅ Fixed |

---

## Best Practices Checklist

- [x] Consistent navigation and breadcrumbs (sidebar looks good)
- [ ] Proper loading states (policy acceptance has issues)
- [ ] Error handling and messaging (500 errors not user-friendly)
- [ ] Mobile responsiveness (not yet tested)
- [ ] Accessibility (ARIA labels, keyboard navigation) (not yet tested)
- [ ] Form validation feedback (UUID validation fails silently)
- [ ] Empty states handled gracefully (policy "No document" is unclear)
- [x] Proper page titles and meta (viaSport BC shows correctly)
- [x] Consistent styling and branding (viaSport logo displays correctly)

---

## Fixes Implemented

### Fix #1: Privacy Acceptance Card Bug (RESOLVED)

**Files Changed**:

- `src/features/privacy/components/privacy-acceptance-card.tsx`

**Changes**:

- Changed mutation to pass `policyId` as parameter instead of closure
- Added loading state while policy data loads
- Disabled button when `policy?.id` is not available
- Added error message display for failed mutations
- Changed `hasAccepted` default from `true` to `false` when no policy

### Fix #2: Integrated Privacy Policy into Onboarding Flow (RESOLVED)

**Files Changed**:

- `src/features/privacy/components/onboarding-policy-step.tsx` (new)
- `src/routes/onboarding/index.tsx`
- `src/routes/onboarding/route.tsx`
- `src/routes/__root.tsx`

**Changes**:

- Created new `OnboardingPolicyStep` component with:
  - Checkbox acknowledgment before accepting
  - Loading states
  - Error handling
  - Auto-redirect when already accepted
- Modified onboarding to show policy step first (if needed), then profile step
- Updated `__root.tsx` to redirect to `/onboarding` instead of `/dashboard/privacy`
- Simplified client-side navigation to rely on React Query for policy checks

### Fix #3: Seed Data UUID Format (RESOLVED)

**Database Change**:

- Updated policy document UUIDs from non-compliant format (`00000000-0000-0000-0006-*`) to RFC 4122 compliant format (`a0000000-0000-4000-a006-*`)

**Note**: The seeded UUIDs were not valid RFC 4122 UUIDs (wrong version/variant bits), causing Zod's `z.uuid()` validation to fail.

### Fix #4: Organization UUID Format (RESOLVED)

**Database Change**:

- Updated all organization UUIDs from non-compliant format (`00000000-0000-0000-0001-*`) to RFC 4122 compliant format (`a0000000-0000-4000-a001-*`)
- Also updated all foreign key references in: `organization_members`, `forms`, `form_submissions`, `audit_logs`, and `organizations.parent_org_id`

**SQL Used**:

```sql
SET session_replication_role = replica;  -- Disable FK triggers
UPDATE organization_members SET organization_id = 'a0000000-0000-4000-a001-...' WHERE ...;
UPDATE organizations SET id = 'a0000000-0000-4000-a001-...' WHERE ...;
SET session_replication_role = DEFAULT;  -- Re-enable
```

---

## Medium Priority Issues (RESOLVED)

### Issue #4: Organization Select Doesn't Auto-Redirect (RESOLVED)

**Location**: `/dashboard/select-org`

**Problem**: After selecting an organization from the dropdown, the page stays on `/dashboard/select-org` instead of redirecting to the destination specified in the `redirect` query parameter (e.g., `/dashboard/sin`).

**Fix Applied**:

- Added `onSuccess` callback prop to `OrgSwitcher` component
- Updated `select-org.tsx` to use `validateSearch` for reading `redirect` query param
- Added `handleOrgSelected` callback that navigates to redirect destination (or `/dashboard/sin` by default)

**Files Changed**:

- `src/features/organizations/components/org-switcher.tsx`
- `src/routes/dashboard/select-org.tsx`

---

### Issue #5: Organizations Admin Shows "No Organizations" (RESOLVED)

**Location**: `/dashboard/admin/sin/organizations`

**Problem**: The organizations admin page shows "No organizations yet." despite 10 organizations existing in the database.

**Root Cause**: The `listOrganizations` query joins with `organizationMembers` and filters by the current user's membership. For admin purposes, we need to show ALL organizations regardless of membership.

**Fix Applied**:

- Created new `listAllOrganizations` query that doesn't filter by membership
- Updated `OrganizationAdminPanel` to use `listAllOrganizations` instead of `listOrganizations`

**Files Changed**:

- `src/features/organizations/organizations.queries.ts`
- `src/features/organizations/components/organization-admin-panel.tsx`

---

## Routes Audited - Summary

### Working Well ✅

| Route                      | Status | Notes                                      |
| -------------------------- | ------ | ------------------------------------------ |
| `/dashboard`               | ✅     | Redirects to select-org appropriately      |
| `/dashboard/sin`           | ✅     | SIN Portal hub with 4 feature cards        |
| `/dashboard/sin/reporting` | ✅     | Proper empty state                         |
| `/dashboard/sin/forms`     | ✅     | Proper empty state                         |
| `/dashboard/sin/imports`   | ✅     | Proper empty state                         |
| `/dashboard/sin/analytics` | ✅     | Full export/saved reports interface        |
| `/dashboard/admin`         | ✅     | Admin hub with feature cards               |
| `/dashboard/admin/roles`   | ✅     | Role management with MFA enforcement alert |
| `/dashboard/admin/sin`     | ✅     | SIN Admin hub with 9 sub-sections          |
| `/dashboard/profile`       | ✅     | 4 sections with edit capability            |
| `/dashboard/settings`      | ✅     | Comprehensive security settings            |
| `/dashboard/privacy`       | ✅     | Policy display and privacy requests        |
| `/onboarding`              | ✅     | Multi-step with policy + profile           |

### Previously Needed Attention (Now Fixed) ✅

| Route                                | Issue                            | Fix                                         |
| ------------------------------------ | -------------------------------- | ------------------------------------------- |
| `/dashboard/select-org`              | No auto-redirect after selection | Added `onSuccess` callback to `OrgSwitcher` |
| `/dashboard/admin/sin/organizations` | Shows empty despite data         | Created `listAllOrganizations` admin query  |

---

## Best Practices Checklist

- [x] Consistent navigation and breadcrumbs
- [x] Proper loading states (fixed in onboarding)
- [x] Error handling and messaging (improved)
- [ ] Mobile responsiveness (not yet tested)
- [ ] Accessibility (ARIA labels, keyboard navigation) (not yet tested)
- [x] Form validation feedback (UUID validation now works)
- [x] Empty states handled gracefully
- [x] Proper page titles and meta (viaSport BC shows correctly)
- [x] Consistent styling and branding (viaSport logo displays correctly)

---

## Notes

- Audit started 2025-12-25
- Audit continued 2025-12-26
- Critical privacy policy bugs fixed and tested
- Organization UUID bugs fixed
- New onboarding flow now handles both profile completion AND policy acceptance
- Flow: Login → Onboarding (Policy + Profile if needed) → Dashboard
- Policy acceptance now properly recorded in database
- All SIN Portal routes functioning correctly
- All Admin routes functioning correctly
- All Account routes functioning correctly
