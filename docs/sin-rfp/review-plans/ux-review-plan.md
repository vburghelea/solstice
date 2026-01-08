# Systematic UX Review Plan Using Playwright MCP

## Overview

This plan outlines a systematic approach to reviewing the UX and design of the Solstice application using Playwright MCP tools, covering both **sin-dev (viaSport)** and **qc-dev (Quadball Canada)** tenants.

### Review Goals

1. **Bug/Issue Identification** - Find broken UI elements, layout issues, console errors, accessibility violations
2. **Design Consistency Audit** - Verify visual consistency, branding, spacing, typography
3. **User Flow Validation** - Walk through key user journeys end-to-end
4. **Subjective UX Assessment** - Evaluate look, feel, ease of use, and improvement opportunities

### Output

- **Dedicated UX Report**: `docs/sin-rfp/ux-review-findings.md`

### Entry Criteria

- sin-dev and qc-dev are reachable and stable
- Seed data exists for forms, reporting tasks, and imports
- Test users available for standard + admin roles
- Clean browser profile available for first-load checks

### Exit Criteria

- All priority routes reviewed with desktop + mobile screenshots
- Findings logged with severity and reproduction steps
- Tenant comparison completed with clear deltas

### Evidence Standards

- Screenshot naming: `<route>-<tenant>-<viewport>-YYYYMMDD-HHMM.png`
- Console errors captured and linked in findings
- Each issue includes route, steps, expected/actual

### Issue Tracking

- Log P0/P1 items in `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md`
- Link each backlog item to the UX findings entry

---

## 1. Review Scope

### Routes to Review (Priority Order)

**Public Routes:**

- `/` - Landing page
- `/auth/login` - Login form
- `/auth/signup` - Registration form

**User Portal Routes (`/dashboard/sin/`):**

- `/dashboard/sin/` - Portal home (card grid)
- `/dashboard/sin/reporting` - Reporting tasks
- `/dashboard/sin/forms` - Forms list
- `/dashboard/sin/forms/$formId` - Individual form
- `/dashboard/sin/imports` - Import status
- `/dashboard/sin/analytics` - Report builder

**Admin Routes (`/dashboard/admin/sin/`):**

- `/dashboard/admin/sin/` - Admin home
- `/dashboard/admin/sin/organizations` - Org management
- `/dashboard/admin/sin/forms` - Form builder
- `/dashboard/admin/sin/reporting` - Reporting config
- `/dashboard/admin/sin/analytics` - Analytics builder
- `/dashboard/admin/sin/audit` - Audit logs
- `/dashboard/admin/sin/notifications` - Notification templates
- `/dashboard/admin/sin/security` - Security dashboard
- `/dashboard/admin/sin/privacy` - Privacy admin

**Supporting Routes:**

- `/dashboard/select-org` - Organization selection
- `/dashboard/profile` - User profile
- `/dashboard/settings` - User settings
- `/onboarding` - Profile completion

Note: If qc-dev uses a different tenant prefix, swap `/dashboard/sin/` for
`/dashboard/qc/` (or the tenant-specific path).

---

## 2. Playwright MCP Review Methodology

### Step 1: Environment Setup

```bash
# Ensure dev server is running
curl -s http://localhost:5173/api/health

# If not, start SST dev mode
AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono
```

### Test Accounts & Data Setup

- **Standard user:** `test@example.com / testpassword123`
- **Admin user (MFA):** `admin@example.com / testpassword123`
- Ensure at least one org, active reporting cycle, and sample form exist

### Step 2: Review Process Per Route

For each route:

1. **Navigate** - `mcp__playwright__browser_navigate()`
2. **Snapshot** - `mcp__playwright__browser_snapshot()` for accessibility tree
3. **Screenshot** - `mcp__playwright__browser_take_screenshot()` for visual
4. **Interact** - Test key interactions with `mcp__playwright__browser_click()`
5. **Responsive** - `mcp__playwright__browser_resize()` for mobile/tablet views
6. **Console** - `mcp__playwright__browser_console_messages()` for errors

### Step 3: Authentication Flows

**Standard User:**

```
1. Navigate to /auth/login
2. Fill form with test@example.com / testpassword123
3. Verify redirect to dashboard
```

**Admin User (MFA):**

```
1. Navigate to /auth/login
2. Fill form with admin@example.com / testpassword123
3. Generate TOTP: npx tsx -e "import { authenticator } from 'otplib'; console.log(authenticator.generate(process.env.SIN_UI_TOTP_SECRET ?? ''));"
   (stored in SST secrets, sin-dev: `SIN_UI_TOTP_SECRET`)
4. Enter authenticator code
5. Verify access to admin routes
```

---

## 3. UX Review Checklist

### A. Visual Consistency

- [ ] Brand colors match tenant (viaSport)
- [ ] Typography hierarchy is clear
- [ ] Spacing/margins are consistent
- [ ] Icons are uniform (Lucide set)
- [ ] Card layouts align properly

### B. Navigation & Wayfinding

- [ ] Sidebar navigation is clear
- [ ] Active state indicators work
- [ ] Breadcrumbs update correctly
- [ ] Mobile hamburger menu functions
- [ ] Back navigation works

### C. Responsive Design

- [ ] Desktop view (1280px+)
- [ ] Tablet view (768px)
- [ ] Mobile view (375px)
- [ ] Touch targets are adequate (44px min)
- [ ] Content doesn't overflow

### D. Accessibility

- [ ] Heading hierarchy (h1, h2, h3)
- [ ] ARIA labels present
- [ ] Focus states visible
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader announces properly
- [ ] Automated scan (axe-core) shows no critical issues

### E. Interactive Elements

- [ ] Buttons have hover/active states
- [ ] Forms show validation errors
- [ ] Loading states are visible
- [ ] Success/error toasts appear
- [ ] Dialogs are properly modal

### F. Data Display

- [ ] Tables are readable
- [ ] Empty states are friendly
- [ ] Pagination works
- [ ] Sorting/filtering functions
- [ ] Mobile card alternatives work

### G. Heuristic Evaluation (Nielsen)

- [ ] Visibility of system status
- [ ] Match between system and real world
- [ ] User control and freedom
- [ ] Consistency and standards
- [ ] Error prevention and recovery

---

## 4. Systematic Review Workflow

### Phase 1: Public Pages (Unauthenticated)

1. Close any existing browser: `mcp__playwright__browser_close()`
2. Navigate to landing page
3. Take desktop screenshot
4. Resize to mobile (375x812)
5. Take mobile screenshot
6. Review login/signup flows

### Phase 2: User Portal (Authenticated)

1. Login as standard user
2. Navigate through SIN portal routes
3. Take snapshots at each major screen
4. Test form interactions
5. Verify notification displays

### Phase 3: Admin Console (MFA)

1. Login as admin with TOTP
2. Navigate through admin routes
3. Focus on complex UIs (form builder, report builder)
4. Test CRUD operations
5. Verify role-based visibility

### Phase 4: Edge Cases

1. Test error states (invalid input, 404, 403)
2. Test empty states (no data)
3. Test loading states (slow network)
4. Test session expiry handling
5. Test offline behavior (PWA)

---

## 5. Documentation Output

For each reviewed area, document:

```markdown
## [Route Name]

**URL:** /dashboard/sin/example
**Screenshot:** [desktop] [mobile]

### Findings

- Issue 1: Description
- Issue 2: Description

### Recommendations

- Fix 1: Action item
- Fix 2: Action item

### Severity

- Critical / Major / Minor / Enhancement
```

---

## 6. Severity Definitions

- **Critical:** Blocks a core task or causes data loss/security risk
- **Major:** Task is possible with workaround or degraded UX
- **Minor:** Cosmetic or low-impact usability issue
- **Enhancement:** Improvement idea outside core flows

---

## 7. Key Files to Reference

**Route Definitions:**

- `src/routes/__root.tsx` - Root layout
- `src/routes/dashboard/sin.tsx` - SIN portal
- `src/routes/dashboard/admin/sin/*.tsx` - Admin routes

**Layout Components:**

- `src/features/layouts/app-layout.tsx`
- `src/features/layouts/admin-layout.tsx`
- `src/components/ui/app-sidebar.tsx`

**Feature Shells:**

- `src/features/forms/components/form-builder-shell.tsx`
- `src/features/reports/components/report-builder-shell.tsx`
- `src/features/privacy/components/privacy-admin-panel.tsx`

**Test Patterns:**

- `e2e/tests/authenticated/dashboard.shared.spec.ts`
- `e2e/tests/authenticated/navigation.shared.spec.ts`

---

## 8. Known Issues to Verify

From route-tree-implementation-review.md:

1. **Delegated Analytics Access Broken** - Check analytics route with delegated user
2. **Admin Copy References SIN for QC** - Verify tenant-conditional text
3. **PII Redaction UI** - Check form builder PII field display
4. **Export Format Mismatch** - Verify export options match backend

---

## Implementation Approach

### Dual-Tenant Testing Strategy

**sin-dev (viaSport):**

```bash
AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono
# Base URL: http://localhost:5173
```

**qc-dev (Quadball Canada):**

```bash
AWS_PROFILE=techdev npx sst dev --stage qc-dev --mode mono
# Base URL: http://localhost:5173
```

### Review Execution Plan

**Round 1: sin-dev (viaSport)**

1. Start SST dev for sin-dev
2. Review all routes systematically
3. Document findings with screenshots
4. Note tenant-specific branding

**Round 2: qc-dev (Quadball Canada)**

1. Switch to qc-dev stage
2. Re-review same routes
3. Compare tenant consistency
4. Note QC-specific differences

### Per-Route Review Protocol

For each route, execute this checklist:

```
1. NAVIGATE
   - mcp__playwright__browser_navigate({url})
   - Wait for page load

2. CAPTURE ACCESSIBILITY
   - mcp__playwright__browser_snapshot()
   - Review heading structure, ARIA labels

3. CAPTURE VISUAL
   - mcp__playwright__browser_take_screenshot() @ desktop (1280px)
   - mcp__playwright__browser_resize({width: 375, height: 812})
   - mcp__playwright__browser_take_screenshot() @ mobile

4. CHECK CONSOLE
   - mcp__playwright__browser_console_messages({level: "warning"})
   - Note any errors or warnings

5. TEST INTERACTIONS
   - Click primary buttons
   - Fill forms
   - Verify feedback (toasts, validation)

6. SUBJECTIVE ASSESSMENT
   - First impression
   - Clarity of purpose
   - Ease of navigation
   - Visual polish
   - Improvement ideas
```

---

## UX Report Template

Create `docs/sin-rfp/ux-review-findings.md` with this structure:

```markdown
# UX Review Findings - Solstice

**Review Date:** 2025-12-27
**Environments:** sin-dev (viaSport), qc-dev (Quadball Canada)
**Reviewer:** Claude + Austin

## Executive Summary

- Total issues found: X
- Critical: X | Major: X | Minor: X | Enhancements: X
- Top 3 priority fixes: ...

## Methodology

[Brief description of review process]

## Findings by Area

### 1. Authentication & Onboarding

#### Login Page

- **Screenshot:** [desktop] [mobile]
- **Issues:**
  - [CRITICAL] ...
  - [MINOR] ...
- **Subjective Notes:** ...
- **Recommendations:** ...

### 2. User Portal (SIN)

...

### 3. Admin Console

...

### 4. Cross-Cutting Concerns

- Responsive design
- Accessibility
- Performance
- Branding consistency

## Tenant Comparison

| Area     | viaSport | Quadball Canada | Notes |
| -------- | -------- | --------------- | ----- |
| Branding | ...      | ...             | ...   |

## Prioritized Action Items

1. [P0] ...
2. [P1] ...
3. [P2] ...

## Appendix

- Full screenshot gallery
- Console error logs
- Accessibility audit details
```

---

## Recommended Execution Order

### Phase 1: Setup & Authentication (Both Tenants)

1. Start sin-dev, verify health endpoint
2. Review `/auth/login` and `/auth/signup`
3. Login as standard user, capture dashboard
4. Login as admin with MFA, capture admin routes
5. Repeat for qc-dev

### Phase 2: User Portal Deep Dive

1. `/dashboard/sin/` - Portal home
2. `/dashboard/sin/reporting` - Reporting tasks
3. `/dashboard/sin/forms` - Forms list and individual forms
4. `/dashboard/sin/imports` - Import status
5. `/dashboard/sin/analytics` - Report builder
6. `/dashboard/select-org` - Organization selection

### Phase 3: Admin Console Deep Dive

1. `/dashboard/admin/` - Admin home
2. `/dashboard/admin/sin/organizations` - Org management
3. `/dashboard/admin/sin/forms` - Form builder
4. `/dashboard/admin/sin/reporting` - Reporting config
5. `/dashboard/admin/sin/analytics` - Analytics builder
6. `/dashboard/admin/sin/audit` - Audit logs
7. `/dashboard/admin/sin/notifications` - Notifications
8. `/dashboard/admin/sin/security` - Security dashboard
9. `/dashboard/admin/sin/privacy` - Privacy admin

### Phase 4: Supporting Flows

1. `/onboarding` - Profile completion
2. `/dashboard/profile` - User profile
3. `/dashboard/settings` - User settings
4. Error pages (404, 403)
5. Mobile navigation patterns

### Phase 5: Synthesis & Report

1. Compile all findings
2. Categorize by severity
3. Create prioritized action list
4. Write executive summary
5. Generate final report
