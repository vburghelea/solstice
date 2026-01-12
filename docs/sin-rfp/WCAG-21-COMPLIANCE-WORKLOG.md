# WCAG 2.1 Level AA Compliance Worklog

**Plan:** [WCAG-21-COMPLIANCE-PLAN.md](./WCAG-21-COMPLIANCE-PLAN.md)
**Status:** Not Started
**Estimated Effort:** 16-23 days
**Start Date:** TBD
**Target Completion:** TBD

## WORK ON EVERYTHING IN THIS WORKLOG. If blocked, note it in the worklog, and move on to the next thing.

## Progress Summary

| Phase                       | Status      | Started | Completed | Notes |
| --------------------------- | ----------- | ------- | --------- | ----- |
| Phase 1: Infrastructure     | Not Started | -       | -         |       |
| Phase 2: Core Components    | Not Started | -       | -         |       |
| Phase 3: Complex Components | Not Started | -       | -         |       |
| Phase 4: Route Audit        | Not Started | -       | -         |       |
| Phase 5: Testing Setup      | Not Started | -       | -         |       |
| Phase 6: MCP Verification   | Not Started | -       | -         |       |

---

## Phase 1: Critical Infrastructure

### 1.1 Skip Navigation Links

- [ ] Create `src/components/ui/skip-link.tsx`
- [ ] Add skip link to `src/routes/__root.tsx`
- [ ] Add `<main id="main-content" tabIndex={-1}>` to `src/features/layouts/app-layout.tsx`
- [ ] Test with keyboard navigation
- [ ] Verify skip link visibility on focus

**Notes:**

---

### 1.2 Focus Management on Route Changes

- [ ] Create `src/hooks/useFocusOnRouteChange.ts`
- [ ] Implement modal/drawer detection (gate focus when open)
- [ ] Implement hash/anchor navigation handling
- [ ] Add user-initiated focus debounce
- [ ] Handle back/forward navigation
- [ ] Integrate with `src/routes/__root.tsx`
- [ ] Test across route transitions

**Notes:**

---

### 1.3 Reduced Motion Support (OPTIONAL - AAA)

- [ ] Add `prefers-reduced-motion` media query to `src/styles.css`
- [ ] Identify loading spinners needing exceptions
- [ ] Test with system reduced motion preference

**Notes:** Low priority - AAA criterion, not required for AA compliance.

---

### 1.4 Global Live Announcer

- [ ] Create `src/components/ui/live-region.tsx`
- [ ] Create `src/hooks/useLiveAnnouncer.ts`
- [ ] Add live regions to `src/routes/__root.tsx`
- [ ] Integrate with Sonner toast system
- [ ] Test announcements with screen reader

**Notes:**

---

### 1.5 Dynamic Page Titles

- [ ] Audit all routes in `src/routes/`
- [ ] Add `head()` export to each route
- [ ] Verify titles follow pattern: "Page Name | Solstice"

**Routes to update:**

- [ ] Auth routes (4)
- [ ] Dashboard routes (10+)
- [ ] Teams routes (6)
- [ ] Events routes (6)
- [ ] Analytics routes (8)
- [ ] SIN routes (15+)
- [ ] Admin routes (15+)

**Notes:**

---

## Phase 2: Core UI Components

### 2.1 Data Table Accessibility

- [ ] Add `aria-label` to sort buttons
- [ ] Add `aria-sort` to sorted column headers
- [ ] Integrate pagination announcements with live region
- [ ] Test with screen reader

**Notes:**

---

### 2.2 Icon-Only Buttons (2.5.3 Label in Name - Gap)

- [ ] Audit `src/components/ui/mobile-app-header.tsx`
- [ ] Audit `src/components/ui/mobile-admin-header.tsx`
- [ ] Audit `src/features/notifications/components/notification-bell.tsx`
- [ ] Audit `src/features/bi/components/` toolbar buttons
- [ ] Search for `<Button size="icon">` pattern across codebase
- [ ] Add `aria-label` to all icon-only buttons

**Files audited:**
| File | Buttons Found | Fixed |
|------|---------------|-------|
| | | |

**Notes:**

---

### 2.3 Form Error Announcements

- [ ] Audit `src/components/form-fields/` components
- [ ] Add `role="alert"` to error containers (on blur/submit only)
- [ ] Ensure error messages include field name
- [ ] Create form-level error summary component
- [ ] Test announcement timing with screen reader

**Notes:** Decided to announce on blur/submit to avoid disruptive mid-typing announcements.

---

### 2.4 Command Palette (Global Search)

- [ ] Add result count announcement
- [ ] Add searching state announcement
- [ ] Add no results announcement
- [ ] Add `aria-expanded` to trigger
- [ ] Test with screen reader

**Notes:**

---

## Phase 3: Complex Component Accessibility

### 3.1 Charts and Data Visualization

- [ ] Audit `ariaLabel` usage in chart components
- [ ] Add hidden data table alternative
- [ ] Review chart colors for contrast
- [ ] Test with screen reader

**User decision needed:** Data table alternative format (toggle/modal/visible)

**Notes:**

---

### 3.2 SQL Workbench

- [ ] Add proper labeling to CodeMirror editor
- [ ] Implement ARIA tree roles for schema browser
- [ ] Apply data table patterns to results
- [ ] Document keyboard shortcuts

**Notes:**

---

### 3.3 Import Wizard Multi-Step Form

- [ ] Add `aria-current="step"` to step indicator
- [ ] Integrate step change announcements with live region
- [ ] Verify heading hierarchy in each step
- [ ] Label mapping table properly

**Notes:**

---

### 3.4 BI Pivot Builder

**Priority order:**

1. [ ] **Critical**: Replace drag handle `<span>` with `<button>` (Solution D)
2. [ ] **Critical**: Add field movement buttons - hover-reveal (Solution B)
3. [ ] **High**: Add interaction mode toggle (Solution A)
4. [ ] **High**: Add measure reorder buttons (Solution C)
5. [ ] Add screen reader announcements for field operations

**Files to modify:**

- [ ] `src/features/bi/components/pivot-builder/PivotBuilder.tsx`
- [ ] `src/features/bi/components/pivot-builder/DropZone.tsx`
- [ ] `src/features/bi/components/pivot-builder/MeasureConfig.tsx`
- [ ] Create `src/features/bi/components/pivot-builder/FieldMoveButtons.tsx`

**User decision needed:** Button visibility pattern (always visible vs hover-reveal)

**Notes:**

---

### 3.5 Dashboard Canvas Widget Manipulation

- [ ] Add move buttons to `WidgetToolbar.tsx`
- [ ] Add resize buttons to `WidgetToolbar.tsx`
- [ ] Wire up handlers in `DashboardCanvas.tsx`
- [ ] Create `src/features/bi/hooks/useWidgetKeyboard.ts` (optional)
- [ ] Add screen reader announcements for widget operations

**User decision needed:** Keyboard shortcut modifier (Alt vs Shift)

**Notes:**

---

## Phase 4: Route-by-Route Audit

### Audit Checklist (per route)

- [ ] Page title set via `head()` export
- [ ] Heading hierarchy (h1 → h2 → h3, no skipping)
- [ ] All interactive elements keyboard accessible
- [ ] All forms properly labeled
- [ ] All images/icons have alt text or aria-label
- [ ] Focus management correct for modals/dialogs
- [ ] Color contrast verified

### Auth Routes

| Route                 | Title | Headings | Keyboard | Forms | Icons | Focus | Contrast |
| --------------------- | ----- | -------- | -------- | ----- | ----- | ----- | -------- |
| /auth/login           |       |          |          |       |       |       |          |
| /auth/register        |       |          |          |       |       |       |          |
| /auth/forgot-password |       |          |          |       |       |       |          |
| /auth/reset-password  |       |          |          |       |       |       |          |

### Dashboard Routes

| Route | Title | Headings | Keyboard | Forms | Icons | Focus | Contrast |
| ----- | ----- | -------- | -------- | ----- | ----- | ----- | -------- |
|       |       |          |          |       |       |       |          |

### Teams Routes

| Route | Title | Headings | Keyboard | Forms | Icons | Focus | Contrast |
| ----- | ----- | -------- | -------- | ----- | ----- | ----- | -------- |
|       |       |          |          |       |       |       |          |

### Events Routes

| Route | Title | Headings | Keyboard | Forms | Icons | Focus | Contrast |
| ----- | ----- | -------- | -------- | ----- | ----- | ----- | -------- |
|       |       |          |          |       |       |       |          |

### Analytics Routes

| Route | Title | Headings | Keyboard | Forms | Icons | Focus | Contrast |
| ----- | ----- | -------- | -------- | ----- | ----- | ----- | -------- |
|       |       |          |          |       |       |       |          |

### SIN Routes

| Route | Title | Headings | Keyboard | Forms | Icons | Focus | Contrast |
| ----- | ----- | -------- | -------- | ----- | ----- | ----- | -------- |
|       |       |          |          |       |       |       |          |

### Admin Routes

| Route | Title | Headings | Keyboard | Forms | Icons | Focus | Contrast |
| ----- | ----- | -------- | -------- | ----- | ----- | ----- | -------- |
|       |       |          |          |       |       |       |          |

**Notes:**

---

## Phase 5: Automated Testing Infrastructure

### 5.1 Install Dependencies

- [ ] Run `pnpm add -D @axe-core/playwright`

### 5.2 Create A11y Test Utilities

- [ ] Create `e2e/utils/a11y.ts`
- [ ] Implement `checkA11y()` helper

### 5.3 Create A11y Test Suite

- [ ] Create `e2e/tests/accessibility/a11y.auth.spec.ts`
- [ ] Create `e2e/tests/accessibility/a11y.dashboard.spec.ts`
- [ ] Add keyboard navigation tests
- [ ] Add skip link tests
- [ ] Add focus management tests

### 5.4 CI Integration

- [ ] Add accessibility tests to GitHub Actions workflow
- [ ] Verify tests run on PRs

**Notes:**

---

## Phase 6: Playwright MCP Verification

### Skip Links

- [ ] Tab from page load focuses skip link
- [ ] Skip link visible on focus
- [ ] Skip link navigates to main content

### Focus Management

- [ ] Navigate between routes, focus moves to main
- [ ] Dialog open/close maintains focus
- [ ] Escape closes modals

### Keyboard Navigation

- [ ] All elements reachable via Tab
- [ ] Data tables support expected interactions
- [ ] Custom widgets fully keyboard accessible

### Screen Reader Simulation

- [ ] Page titles announced
- [ ] Form errors announced
- [ ] Dynamic updates announced
- [ ] Charts have descriptions

### Visual

- [ ] Focus indicators visible
- [ ] Reduced motion works (if implemented)
- [ ] Text readable at 200% zoom

**Notes:**

---

## Issues & Blockers

| Date | Issue | Status | Resolution |
| ---- | ----- | ------ | ---------- |
|      |       |        |            |

---

## User Decisions Log

| Date | Decision | Context | Outcome |
| ---- | -------- | ------- | ------- |
|      |          |         |         |

---

## Session log

### YYYY-MM-DD, MM-SS

## **Work completed:**

## **Need to check with user before completing:**

## **Blockers:**

## **Next steps:**

---
