# UX Review Findings - Solstice (viaSport SIN Portal)

**Review Date:** 2025-12-31 (updated 2026-01-01)
**Environment:** sin-dev (localhost:5173)
**Reviewer:** Claude + Austin

## Executive Summary

- **Total issues found:** 9
- **Critical:** 1 | **Major:** 0 (fixed) | **Minor:** 4 | **Enhancements:** 3
- **Top 3 priority fixes:**
  1. Create styled 404 error page
  2. Add show/hide password toggle to auth forms
  3. Consider date picker for Date of Birth field

**Update (2026-01-01):** Completed full review of Admin Console and SIN Portal routes. All pages are well-designed and functional. The seed script FK constraint issue has been fixed permanently.

## Methodology

Systematic review using Playwright MCP to navigate through the application as a user would, without reading source code to maintain unbiased perspective. Tested on desktop (1280x800) and mobile (375x812) viewports.

---

## Findings by Area

### 1. Authentication & Onboarding

#### Landing Page (`/`)

**Screenshots:** `.playwright-mcp/landing-sin-dev-desktop-20251231.png`, `.playwright-mcp/landing-sin-dev-mobile-20251231.png`

**Positive:**

- Clean, minimal design with clear hierarchy
- "viaSport BC" heading with "SIN Portal" subtitle
- Prominent CTAs for "Log in" and "Create an account"
- Link to viasport.ca for general information
- Mobile layout adapts well

**Issues:** None

---

#### Login Page (`/auth/login`)

**Screenshots:** `.playwright-mcp/login-sin-dev-desktop-20251231.png`, `.playwright-mcp/login-sin-dev-mobile-20251231.png`, `.playwright-mcp/login-validation-sin-dev-desktop-20251231.png`

**Positive:**

- Clear "Welcome back to viaSport BC" heading
- Email/password fields with helpful placeholders
- "Forgot password?" link positioned well
- Google OAuth option with clear separator ("Or")
- Form validation shows clear red error messages
- Loading state shows "Logging in..." with spinner
- Buttons disabled during submission (prevents double-submit)

**Issues:**

- [ENHANCEMENT] No "show/hide password" toggle
- [ENHANCEMENT] No "Remember me" checkbox (optional, not always needed)
- [MINOR] Password field appears as "textbox" in accessibility tree (may affect screen readers)

---

#### Signup Page (`/auth/signup`)

**Screenshots:** `.playwright-mcp/signup-sin-dev-desktop-20251231.png`, `.playwright-mcp/signup-validation-sin-dev-desktop-20251231.png`

**Positive:**

- Consistent design with login page
- Name, Email, Password, Confirm Password fields
- Good validation messages ("Name is required", "Please enter a valid email", "Password is required")
- Google OAuth option

**Issues:** Same as login page

---

#### MFA Flow

**Positive:**

- Clean "Confirm your sign-in" prompt
- Clear instructions to enter authenticator code
- Tabs for "Authenticator code" and "Backup code"
- Loading state shows "Verifying..."

**Issues:** None

---

### 2. Dashboard & Navigation

#### Organization Selection (`/dashboard/select-org`)

**Screenshot:** `.playwright-mcp/select-org-sin-dev-desktop-20251231.png`

**Positive:**

- Clean empty state when no organizations available
- Helpful instructions on how to get access
- "Browse organizations" and "Open support center" CTAs
- Contact email link (support@viasport.ca)

**Issues:** None

---

#### Sidebar Navigation

**Screenshots:** (visible in dashboard screenshots)

**Positive:**

- Clear sections: "Portal" and "Account"
- Consistent iconography (Lucide icons)
- Active page highlighted
- Logout at bottom
- Keyboard shortcut hint on Search (Cmd+K)

**Issues:**

- [MINOR] Privacy page doesn't show as active in sidebar (may need to verify)

---

#### Profile Page (`/dashboard/profile`)

**Screenshots:** `.playwright-mcp/profile-sin-dev-desktop-20251231.png`, `.playwright-mcp/profile-edit-sin-dev-desktop-20251231.png`

**Positive:**

- Clean card-based layout
- Two-column field organization
- Clear section headers (Basic Information, Emergency Contact, Privacy Settings, Profile Information)
- "Edit Profile" button with pencil icon
- Edit mode shows Cancel/Save Changes buttons
- "Not set" placeholder for empty values

**Issues:**

- [MINOR] Date of Birth uses separate YYYY/MM/DD fields - a date picker might be more intuitive
- Helper text "Enter a date between 1906-01-01 and 2013-01-01" is useful but could show in MM/DD/YYYY format for North American users

---

#### Settings Page (`/dashboard/settings`)

**Screenshots:** `.playwright-mcp/settings-sin-dev-desktop-20251231.png`, `.playwright-mcp/settings-full-sin-dev-desktop-20251231.png`

**Positive:**

- Comprehensive security settings
- Change Password section with "Sign out of other devices" option
- Multi-Factor Authentication section
- Backup code verification
- Notification Preferences with categories (Reporting, Security, Support, System)
- In-app and Email toggles with frequency dropdown
- Active Sessions table with Revoke option
- Account status overview
- Connected accounts (Google) management

**Issues:** None

---

#### Privacy Page (`/dashboard/privacy`)

**Screenshots:** `.playwright-mcp/privacy-sin-dev-desktop-20251231.png`, `.playwright-mcp/privacy-sin-dev-mobile-20251231.png`

**Positive:**

- Privacy Policy section with version and effective date
- "Policy accepted" button (disabled when already accepted)
- Privacy Requests for GDPR-style data requests (Access, etc.)
- Clean empty state "No privacy requests yet"

**Issues:**

- [ENHANCEMENT] Privacy policy content not shown - only version number. Consider showing full policy text or link to it.

---

### 3. Error Handling

#### 403 Forbidden Page (`/dashboard/forbidden`)

**Screenshot:** `.playwright-mcp/forbidden-sin-dev-desktop-20251231.png`

**Positive:**

- Well-designed error page with warning icon
- Clear "Access restricted" heading
- Helpful message explaining the situation
- "Return to dashboard" and "Contact support" CTAs

**Issues:** None

---

#### 404 Not Found Page

**Screenshot:** `.playwright-mcp/404-sin-dev-desktop-20251231.png`

**Issues:**

- [CRITICAL] Raw unstyled page showing "Cannot GET /nonexistent-page"
- No branding, navigation, or way to return to the app
- Should match the styled 403 page design

---

### 4. Responsive Design

#### Mobile Navigation

**Screenshot:** `.playwright-mcp/mobile-nav-sin-dev-20251231.png`

**Positive:**

- Clean hamburger menu icon
- Slide-out drawer with all navigation items
- "X" close button
- Search bar at top
- Clear section headers (PORTAL, ACCOUNT)
- Current page highlighted
- Logout accessible at bottom
- Cards and content adapt well to mobile width
- Touch targets appear adequate

**Issues:** None

---

### 5. Admin Console (2026-01-01)

#### Admin Home (`/dashboard/admin`)

**Screenshot:** `.playwright-mcp/admin-home-sin-dev-desktop-20260101.png`

**Positive:**

- Clean overview with role summary cards
- viaSport Admin and Solstice Admin badges displayed
- Quick navigation to admin sections

**Issues:** None

---

#### SIN Admin (`/dashboard/admin/sin`)

**Screenshot:** `.playwright-mcp/sin-admin-sin-dev-desktop-20260101.png`

**Positive:**

- Comprehensive admin hub with 14 admin areas organized in a grid
- Clear icons and descriptions for each section
- Categories cover: Organizations, Reporting, Templates, Forms, Imports, Support, Analytics, Notifications, Data Quality, Privacy, Audit, Users, Roles, Security

**Issues:** None

---

#### Roles Management (`/dashboard/admin/roles`)

**Positive:**

- Role listing with permissions
- Clear role descriptions

**Issues:** None

---

### 6. SIN Portal Routes (2026-01-01)

#### Reporting (`/dashboard/sin/reporting`)

**Screenshot:** `.playwright-mcp/reporting-sin-dev-desktop-20260101.png`

**Positive:**

- Clear "Your reporting tasks" heading
- Task cards with status badges and due dates
- 2 reporting tasks shown (Annual Participation Report, Financial Summary)
- Metadata form accessible from task cards
- Clean card-based layout

**Issues:** None

---

#### Forms (`/dashboard/sin/forms`)

**Positive:**

- Clear heading with description
- Clean empty state: "No forms assigned yet"

**Issues:** None

---

#### Imports (`/dashboard/sin/imports`)

**Screenshot:** `.playwright-mcp/imports-sin-dev-desktop-20260101.png`

**Positive:**

- Clear heading: "Review recent import activity for your organization"
- "View templates" link for quick access
- Data upload walkthrough with "View steps" and "Start tour" buttons
- Clean empty state: "No imports yet"

**Issues:** None

---

#### Templates (`/dashboard/sin/templates`)

**Screenshot:** `.playwright-mcp/templates-sin-dev-desktop-20260101.png`

**Positive:**

- Heading with description: "Download the latest templates for reporting, imports, and analytics"
- Search box for templates
- Context filter dropdown
- Clean empty state: "No templates available"

**Issues:** None

---

#### Help Center (`/dashboard/sin/help`)

**Screenshot:** `.playwright-mcp/help-center-sin-dev-desktop-20260101.png`

**Positive:**

- Excellent design with tabs for "Guides" and "FAQ"
- Searchable guides and FAQs
- Three comprehensive guide sections:
  1. "Getting started in the SIN portal" - organization selection, reporting tasks, templates
  2. "Preparing data imports" - download templates, validate files, track progress
  3. "Building analytics pivots" - choose data source, define measures, export results
- FAQ section with 4 helpful questions covering Templates, Reporting, Support, and Data Quality

**Issues:** None

---

#### Support (`/dashboard/sin/support`)

**Screenshot:** `.playwright-mcp/support-sin-dev-desktop-20260101.png`

**Positive:**

- Clean support request form with:
  - Checkbox to associate with active organization (checked by default)
  - Subject field with placeholder
  - Category dropdown
  - Message textarea
  - "Send request" button
- "Your requests" section with clean empty state

**Issues:** None

---

#### Analytics (`/dashboard/analytics/explore`)

**Screenshot:** `.playwright-mcp/analytics-sin-dev-desktop-20260101.png`

**Positive:**

- Comprehensive pivot builder interface
- Dataset dropdown (Organizations, etc.)
- Chart type selector (Table, etc.)
- Filters section with "Add filter" button
- Drag-and-drop areas for: Available fields, Rows, Columns, Measures
- Export buttons: CSV, Excel, JSON
- Totals checkboxes (Row, Column, Grand)
- Preview area for results

**Issues:** None

---

#### SQL Workbench (`/dashboard/analytics/sql`)

**Screenshot:** `.playwright-mcp/sql-workbench-sin-dev-desktop-20260101.png`

**Positive:**

- Professional SQL editor interface
- Dataset dropdown for governed data access
- Code editor with line numbers
- Sample query shown: `SELECT * FROM organizations WHERE id = {{organization_id}}`
- "Run query" button
- Results area
- Schema browser (searchable, curated views only)
- Query history section

**Issues:** None

---

#### Organization Access (`/dashboard/sin/organization-access`)

**Screenshot:** `.playwright-mcp/org-access-sin-dev-desktop-20260101.png`

**Positive:**

- Access settings section:
  - "Show in organization directory" toggle
  - "Allow join requests" toggle
- Pending join requests section with empty state
- Invite links section:
  - Role selector dropdown
  - "Auto-approve access" toggle
  - Max uses limit input
  - Expiration date input
  - "Create invite link" button
  - Clean empty state

**Issues:** None

---

## Routes Not Checked (as of 2026-01-01)

**Note:** API routes and layout-only files (`route.tsx`, `__root.tsx`) are excluded.

### Auth & Onboarding

- `/auth/forgot-password`
- `/auth/reset-password`
- `/onboarding`
- `/join/:token`
- `/join/registration/:token`

### SIN Portal (detail + landing routes)

- `/dashboard/sin` (portal home)
- `/dashboard/sin/analytics` (redirects to `/dashboard/analytics/explore`)
- `/dashboard/sin/forms/:formId`
- `/dashboard/sin/submissions/:submissionId`

### Analytics Dashboards

- `/dashboard/analytics`
- `/dashboard/analytics/dashboards`
- `/dashboard/analytics/dashboards/new`
- `/dashboard/analytics/dashboards/:dashboardId`

### SIN Admin (subpages not visited)

- `/dashboard/admin/sin/organizations`
- `/dashboard/admin/sin/reporting`
- `/dashboard/admin/sin/forms`
- `/dashboard/admin/sin/imports`
- `/dashboard/admin/sin/templates`
- `/dashboard/admin/sin/support`
- `/dashboard/admin/sin/privacy`
- `/dashboard/admin/sin/security`
- `/dashboard/admin/sin/audit`
- `/dashboard/admin/sin/notifications`
- `/dashboard/admin/sin/data-catalog`
- `/dashboard/admin/sin/data-quality`
- `/dashboard/admin/sin/analytics` (redirects to `/dashboard/analytics/explore`)

### General Solstice (non-SIN, not reviewed)

- `/dashboard`
- `/dashboard/organizations`
- `/dashboard/members`
- `/dashboard/membership`
- `/dashboard/reports`
- `/dashboard/teams`
- `/dashboard/teams/browse`
- `/dashboard/teams/create`
- `/dashboard/teams/:teamId`
- `/dashboard/teams/:teamId/manage`
- `/dashboard/teams/:teamId/members`
- `/dashboard/events`
- `/dashboard/events/create`
- `/dashboard/events/:slug`
- `/dashboard/events/:slug/register`
- `/dashboard/events/:eventId/manage`
- `/admin/roles`

---

## Cross-Cutting Concerns

### Visual Consistency

- [PASS] Consistent card-based layouts
- [PASS] Uniform iconography (Lucide set)
- [PASS] Typography hierarchy is clear
- [PASS] Spacing and margins consistent
- [MINOR] Logo appears to be a generic icon, not viaSport branding

### Accessibility

- [PASS] Heading hierarchy present (h1, h2)
- [PASS] Links and buttons are keyboard accessible
- [PASS] Form validation messages are visible
- [NOTE] Password fields show as "textbox" in accessibility tree - verify type="password" is set

### Performance

- [PASS] No console errors during navigation
- [PASS] Pages load quickly
- [PASS] Loading states visible during async operations

---

## Prioritized Action Items

### P0 (Critical)

1. **Create styled 404 page** - Currently shows raw server error text. Should match the 403 page design with branding, navigation link, and helpful message.

### P1 (Major) - FIXED

2. ~~**Fix seed script dependency order**~~ - **FIXED (2026-01-01)**: Added `scheduledNotifications` import and delete statement before `notificationTemplates` deletion in `seed-sin-data.ts`. Script now runs successfully.

### P2 (Minor)

3. **Double navigation on Admin/SIN Admin pages** - The Admin Console and SIN Admin pages show redundant navigation:
   - Desktop: Sidebar has Admin links + content area has "Admin Console" tabs + "SIN Admin" has another tab bar
   - Mobile: TWO tab bars stacked ("Admin Console" tabs + "SIN Admin" tabs wrapping across 5 lines)
   - **Screenshots:** `sin-admin-mobile-double-nav-20260101.png`, `sin-admin-desktop-double-nav-20260101.png`
   - **Recommendation:** On mobile, consider collapsing the SIN Admin sub-navigation into a dropdown or hiding the parent "Admin Console" tabs when viewing a sub-section
4. **Date input UX** - Consider using a date picker component instead of separate YYYY/MM/DD fields for Date of Birth
5. **Password field accessibility** - Verify password inputs have correct type="password" attribute
6. **Active state in sidebar** - Verify all pages show active state correctly

### P3 (Enhancements)

7. **Add show/hide password toggle** - Common pattern for login/signup forms
8. **Show privacy policy content** - Display full policy text or link to it
9. **Add branded logo** - Replace generic icon with viaSport BC logo

---

## Appendix

### Screenshot Gallery

| Page                           | Desktop                                        | Mobile                                   |
| ------------------------------ | ---------------------------------------------- | ---------------------------------------- |
| Landing                        | landing-sin-dev-desktop-20251231.png           | landing-sin-dev-mobile-20251231.png      |
| Login                          | login-sin-dev-desktop-20251231.png             | login-sin-dev-mobile-20251231.png        |
| Login (validation)             | login-validation-sin-dev-desktop-20251231.png  | -                                        |
| Signup                         | signup-sin-dev-desktop-20251231.png            | -                                        |
| Signup (validation)            | signup-validation-sin-dev-desktop-20251231.png | -                                        |
| Org Selection                  | select-org-sin-dev-desktop-20251231.png        | -                                        |
| Profile                        | profile-sin-dev-desktop-20251231.png           | -                                        |
| Profile (edit)                 | profile-edit-sin-dev-desktop-20251231.png      | -                                        |
| Settings                       | settings-sin-dev-desktop-20251231.png          | -                                        |
| Settings (full)                | settings-full-sin-dev-desktop-20251231.png     | -                                        |
| Privacy                        | privacy-sin-dev-desktop-20251231.png           | privacy-sin-dev-mobile-20251231.png      |
| Mobile Nav                     | -                                              | mobile-nav-sin-dev-20251231.png          |
| 403 Forbidden                  | forbidden-sin-dev-desktop-20251231.png         | -                                        |
| 404 Not Found                  | 404-sin-dev-desktop-20251231.png               | -                                        |
| **Admin Console (2026-01-01)** |                                                |                                          |
| Admin Home                     | admin-home-sin-dev-desktop-20260101.png        | -                                        |
| SIN Admin                      | sin-admin-sin-dev-desktop-20260101.png         | -                                        |
| **SIN Portal (2026-01-01)**    |                                                |                                          |
| Reporting                      | reporting-sin-dev-desktop-20260101.png         | -                                        |
| Imports                        | imports-sin-dev-desktop-20260101.png           | -                                        |
| Templates                      | templates-sin-dev-desktop-20260101.png         | -                                        |
| Help Center                    | help-center-sin-dev-desktop-20260101.png       | -                                        |
| Support                        | support-sin-dev-desktop-20260101.png           | -                                        |
| Analytics                      | analytics-sin-dev-desktop-20260101.png         | -                                        |
| SQL Workbench                  | sql-workbench-sin-dev-desktop-20260101.png     | -                                        |
| Organization Access            | org-access-sin-dev-desktop-20260101.png        | -                                        |
| **Mobile Review (2026-01-01)** |                                                |                                          |
| SIN Portal (mobile)            | -                                              | sin-portal-mobile-20260101.png           |
| Reporting (mobile)             | -                                              | reporting-mobile-20260101.png            |
| Admin (mobile)                 | -                                              | admin-mobile-20260101.png                |
| SIN Admin (double nav)         | sin-admin-desktop-double-nav-20260101.png      | sin-admin-mobile-double-nav-20260101.png |

### Console Errors

No console errors or warnings were observed during the review session.

### Data Issues Found & Resolved

**Issue**: Admin user saw "No organizations available" despite orgs existing in database.

**Root Cause**:

- `user_roles` table was empty (no role assignments)
- `roles` table was missing `viasport-admin` role
- Seed script (`seed-sin-data.ts`) fails due to FK constraint

**Fix Applied** (2026-01-01):

```sql
-- Insert viaSport Admin role
INSERT INTO roles (id, name, description, permissions, created_at, updated_at)
VALUES ('viasport-admin', 'viaSport Admin', '...', '{...}', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Insert user role assignments
INSERT INTO user_roles (id, user_id, role_id, assigned_by, notes, assigned_at)
VALUES
  ('sin-user-platform-admin-001-role', 'sin-user-platform-admin-001', 'solstice-admin', ...),
  ('sin-user-viasport-staff-001-role', 'sin-user-viasport-staff-001', 'viasport-admin', ...)
ON CONFLICT (id) DO NOTHING;
```

**Permanent Fix Applied (2026-01-01)**: Updated `seed-sin-data.ts` to import and delete `scheduledNotifications` before `notificationTemplates`. The script now runs successfully through all seed phases.

### Test Accounts Used

- `admin@example.com` / `testpassword123` (with MFA)

---

## Remaining Review Work & Data Fabrication Plan

The items below are **not yet reviewed**. Each block lists the actions to take and the
data needed to make the UI non-empty. Preferred approach: expand
`scripts/seed-sin-data.ts` so the fixtures are stable and repeatable.

### Auth & Onboarding

**Actions to take**

- Complete `/auth/forgot-password` and `/auth/reset-password` flows (valid + invalid token).
- Verify password strength meter, mismatch errors, and success state copy.
- Walk `/onboarding` with missing profile fields and confirm redirect on completion.
- Use invite links via `/join/:token` and verify accepted vs expired states.

**Data fabrication (seed script + manual fallback)**

- Seed a user with `profileComplete = false` (e.g., `member@example.com`) so `/onboarding` is reachable.
- Trigger `/auth/forgot-password` to create a `verification` row; pull the token from the
  `verification` table and open `/auth/reset-password?token=<token>`.
- Add `organization_invite_links`, `organization_invite_link_uses`, and
  `organization_join_requests` for join flows with known tokens.

### SIN Portal Home (`/dashboard/sin`)

**Actions to take**

- Validate summary cards (due soon, overdue, forms, imports) and join requests panel.
- Verify tutorial panel behavior (start, dismiss, resume).

**Data fabrication**

- Add org-scoped forms (`forms.organizationId = IDS.bcHockeyId`) so assigned forms are visible.
- Create additional reporting tasks + submissions to cover due soon, overdue, and
  `changes_requested` statuses.
- Seed `import_jobs` with mixed statuses so import counts are non-zero.
- Seed pending `organization_join_requests` for the active org.

### Forms & Submissions (`/dashboard/sin/forms/:formId`, `/dashboard/sin/submissions/:submissionId`)

**Actions to take**

- Open a form detail view, submit a response, and verify submission history entries.
- Open submission details and test version history + file download/replace/delete flows.

**Data fabrication**

- Seed `form_submissions` across statuses: `draft`, `submitted`, `under_review`,
  `changes_requested`, `approved`, `rejected`.
- Seed `form_submission_versions` for at least one submission.
- Upload sample files to S3 via `uploadSeedArtifact` and insert `submission_files`.

### Imports (`/dashboard/sin/imports`, `/dashboard/admin/sin/imports`)

**Actions to take**

- Run import wizard end-to-end: upload, map fields, validate, import, and rollback.
- Review import history and error summary UI.

**Data fabrication**

- Seed `import_jobs` with `pending`, `validating`, `completed`, `failed`, and
  `rolled_back` statuses.
- Seed `import_job_errors` for a failed job and provide `error_report_key`.

### Analytics / BI (Explore + SQL + Dashboards)

**Actions to take (use BI tool in detail)**

- Explore: build a pivot with rows/columns/measures, add filters, sort, and toggle totals.
- Switch chart types and verify the preview updates correctly.
- Export CSV/XLSX/JSON and confirm file downloads.
- Save pivot to a dashboard, add chart/KPI/text widgets, reorder/resize widgets, edit
  widget configs, set global filters, share/publish, and delete a widget.
- SQL Workbench: run a parameterized query, trigger guardrail errors, use schema browser,
  review query history, and export results.

**Data fabrication**

- Ensure dataset tables are populated (organizations, reporting_submissions, form_submissions).
- Seed `bi_dashboards` + `bi_dashboard_widgets` with a widget whose `config.query`
  targets `reporting_submissions`.
- Seed `bi_query_log` entries (or generate via UI) for the audit tab.

### Admin: Privacy (`/dashboard/admin/sin/privacy`)

**Actions to take**

- View policy content, accept policy, submit privacy requests, and verify status changes.
- Validate completed vs rejected request states and download links.

**Data fabrication**

- Add `policy_documents` with `content_url` (or actual content) plus `user_policy_acceptances`.
- Seed `privacy_requests` in `pending`, `processing`, `completed`, and `rejected` statuses.
- Optional: seed `legal_holds` to exercise retention/legal hold UI.

### Admin: Security (`/dashboard/admin/sin/security`)

**Actions to take**

- Review security events, filter by user/risk, and validate empty vs populated states.
- Verify account lock status (active + resolved).

**Data fabrication**

- Seed `security_events` with varied `event_type` and `risk_score`.
- Seed `account_locks` with one active lock and one resolved lock.

### Admin: Audit (`/dashboard/admin/sin/audit`)

**Actions to take**

- Filter audit log by actor/org/category/date, export CSV, and verify hash chain.
- Review BI query log tab.

**Data fabrication**

- Seed `audit_logs` via the seed script’s hash-chain helper (skip if logs exist).
- Seed `bi_query_log` entries (or generate by running BI queries).

### Admin: Data Quality / Data Catalog

**Actions to take**

- Review data quality run history (success + failure) and inspect summaries.
- Search/filter catalog entries and open details.

**Data fabrication**

- Seed `data_quality_runs` with one success and one failure.
- Seed `data_catalog_entries` with tags, metadata, and org scope.

### Admin: Notifications (`/dashboard/admin/sin/notifications`)

**Actions to take**

- Create/edit/delete notification templates and verify system templates are locked.
- Update notification preferences and confirm persistence.
- Review scheduled notification states if surfaced.

**Data fabrication**

- Seed `notification_preferences` for each category.
- Seed `scheduled_notifications` (pending + failed).
- Keep existing seeded `notification_templates` and add one custom template.

### Admin: Reporting / Forms / Templates / Support / Organizations

**Actions to take**

- Reporting: create/edit cycles + tasks, review submissions, request changes, approve.
- Forms: build and publish a new form version; verify preview.
- Templates: upload/download each template context; verify empty vs populated states.
- Support: update request status, add responses, review history.
- Organizations: edit org metadata, toggle access settings, manage roles/delegated access.

**Data fabrication**

- Expand reporting tasks/submissions across org types and statuses.
- Add org-scoped templates and support requests with `resolved` status.
- Seed `delegated_access` and varied `organization_members` roles.

### General Solstice (if in SIN scope)

**Actions to take**

- Events: list, create, register, manage, and handle `/join/registration/:token`.
- Teams: create, browse, manage members.
- Membership/members/reports/organizations: validate core flows and permissions.

**Data fabrication**

- Use QC seed (`scripts/seed-e2e-data.ts`) or add SIN-specific seeds for events/teams.
- For `/join/registration/:token`, seed event registration groups + invite tokens.
