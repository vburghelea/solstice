Below is a structured way to turn **Bundle 3 (Dashboard, UI/UX, Reporting & Onboarding)** into **RFP-ready requirements + deliverables**, using what your repo already has as the baseline and making the gaps explicit, testable, and scorable.

I’m going to do three things:

1. **State what you already have** (so the RFP can describe “baseline capability”).
2. **Translate each requirement into RFP-grade scope** (what must be delivered, where it lives in the product, and what data/permissions it needs).
3. **Call out shared platform work** (because several requirements depend on the same underlying capabilities: org profiles, RBAC/delegation, notifications/jobs, form + file storage, audit/versioning, analytics/export ACLs).

---

## 1) What your codebase already provides (baseline capability to reference in the RFP)

This matters because an RFP should distinguish between “existing functionality” vs “net-new deliverables.”

### Existing UI foundation

- A consistent UI kit using **shadcn/ui + Radix** components (`src/components/ui/*`) with Tailwind styling.
- A standard admin shell:
  - **AdminLayout** with sidebar + breadcrumbs + mobile menu (`src/features/layouts/admin-layout.tsx`, `admin-sidebar.tsx`, `breadcrumbs.tsx`)

- A reusable **DataTable** with:
  - pagination, sorting, optional column toggles, CSV export hook (`src/components/ui/data-table.tsx`)

### Existing dashboard + role gating patterns

- Dashboard routes already exist (`src/routes/dashboard/*`) and show role-aware content:
  - `MemberDashboard.tsx` provides role-specific sections and “next steps” cards.
  - `/dashboard/reports` is protected with `requireGlobalAdmin()`.

### Existing “report-like” output + export pattern

- Admin membership report page exists with filtering + CSV export (`AdminMembershipsReport`)
- CSV export utility exists (`src/lib/utils/csv-export.ts`)

### Existing onboarding and profile completion flow

- `/onboarding` route forces profile completion before dashboard access
- Multi-step profile form exists (`complete-profile-form-simple.tsx`)
- Editable profile view exists (`profile-view.tsx`)

### Existing email infrastructure

- SendGrid wrapper is in place (`src/lib/email/sendgrid.ts`)
- Transactional patterns exist for membership receipts, welcome email, team invitation

**Key takeaway for the RFP:** you have a solid UI/layout/data-table/export/email/onboarding baseline, but you’re missing: reporting metadata/org management, workflow engine (cycles/deadlines/submissions), configurable forms + file storage, notifications/tasks, analytics builder, template library, walkthroughs, help center, support tickets, global search, and accessibility/contrast enhancements.

---

## 2) Cross-cutting platform capabilities you should make explicit in the RFP

These are “enablers” that multiple requirements depend on. If the RFP doesn’t call these out, vendors will under-scope them.

### A) Organization & access model (multi-tenant)

Needed for: RP-AGG-002, delegated reporting, dashboards, exports, templates, support.

**RFP deliverable language**

- The system shall support **organization profiles** (PSO/club/affiliate) and associate users to organizations with **roles** and **delegated reporting access**.
- The system shall enforce **organization-scoped data access** and **field-level access rules** for exports/analytics.

### B) Task, notification, and scheduling engine

Needed for: RP-AGG-003, UI-AGG-004, support ticket notifications, onboarding tours, “reporting due” reminders.

**RFP deliverable language**

- The system shall provide a **notification service** supporting in-app + email channels, template-based messages, user preferences, and scheduled reminders based on due dates.

### C) Dynamic forms + submission + file storage + versioning

Needed for: RP-AGG-004, TO-AGG-001 templates, RP-AGG-003 resubmissions, auditability.

**RFP deliverable language**

- The system shall provide a configurable reporting form framework supporting required fields, attachments, versioning, and submission history.

### D) Audit trails & change history

Needed for: reporting resubmission history, delegated actions, admin changes.

**RFP deliverable language**

- The system shall record auditable events for reporting submissions, approvals, resubmissions, and metadata changes (who/when/what).

---

## 3) RFP-ready requirement breakdown (Bundle 3)

For each requirement, I’m giving you:

- **Interpretation** (what it really entails)
- **Deliverables** (what the vendor must build)
- **UI surfaces** (where it shows up)
- **Data + permissions** (what needs to exist)
- **Acceptance tests** (scorable, demo-able)

---

# REPORTING

## RP-AGG-002: Reporting Information Management

### Interpretation

This is not just “metadata fields.” It implies a **structured reporting context** per organization and reporting period, including:

- contribution agreements, NCCP, contacts, fiscal periods, org profiles
- delegated reporting access (someone can file on behalf of org)

### Deliverables (RFP-grade)

- **Reporting Metadata Module** that supports:
  - Organization profile management (contact info, address, identifiers, org type, etc.)
  - Fiscal period configuration (start/end, active period)
  - Contribution agreement records (agreement type, effective dates, document upload, signature/acknowledgment status)
  - NCCP metadata (either per-person certification fields or linked records)
  - Delegated reporting access rights (grant/revoke, scope, expiry)

- **Admin UI** to manage the above and assign access

### UI surfaces

- Admin: `/dashboard/reports/config` (or `/dashboard/admin/reporting`)
- Organization settings page: `/dashboard/settings/organization`
- Delegation page: `/dashboard/settings/delegation`

### Data + permissions

- New entities typically required:
  - `organizations`
  - `organization_memberships` (user↔org with role)
  - `reporting_metadata` (per org, per fiscal period)
  - `delegated_access` (delegate userId, grantedBy, scope, expiresAt)

- Permission checks:
  - Org Admin / viaSport Admin can edit org metadata
  - Delegates can access reporting features per scope

### Acceptance tests

- A user with Org Admin role can:
  - create/update fiscal period, contacts, agreement records
  - upload/replace agreement documents
  - assign a delegate to “Reporting Submitter” role for a specific fiscal period

- A delegate user can:
  - see reporting tasks/forms only for the org+period they were delegated

- A non-delegated user cannot access reporting metadata pages (403/hidden nav)

---

## RP-AGG-003: Reporting Flow & Support

### Interpretation

You need a workflow engine:

- deadlines
- reminders (automated)
- submission statuses
- resubmission history and diffs
- dashboards that show progress

### Deliverables

- **Reporting Cycles & Deadlines**
  - define reporting cycles (e.g., Q1/Q2/Annual) per org/program
  - deadlines per required submission

- **Submission Workflow**
  - statuses: Draft → Submitted → Under Review → Changes Requested → Resubmitted → Approved

- **Resubmission Tracking**
  - every submission revision stored with timestamp, submitter, and optionally a “change summary”

- **Automated reminders**
  - upcoming deadline reminders (e.g., 14/7/3 days)
  - overdue reminders (e.g., daily/weekly policy)
  - reminders configurable by admins

- **Submission status dashboard**
  - organization-facing dashboard: what’s due, what’s submitted, what needs changes

### UI surfaces

- Organization dashboard widget: “Reporting status”
- Reporting landing page: `/dashboard/reports` for org users (not just global admins)
- Admin dashboard: “Overdue organizations” view

### Data + permissions

- Entities:
  - `reporting_cycles`
  - `reporting_tasks` (what’s due, when)
  - `reporting_submissions` (current)
  - `reporting_submission_revisions` (history)
  - `review_decisions` / `approval_events`

- Scheduling:
  - background scheduler (cron/queue) integrated with SendGrid + in-app notifications

### Acceptance tests

- Admin configures a reporting task with a due date.
- System automatically sends:
  - reminder email + in-app notification X days before due date
  - overdue notices after the due date

- Organization user submits a form; status becomes “Submitted”
- Admin requests changes; status becomes “Changes Requested”
- Org user resubmits; history shows v1/v2 with timestamps and who submitted each version

---

## RP-AGG-004: Reporting Configuration & Collection

### Interpretation

This is a **configurable form system** (not hardcoded profile/membership forms), plus file management and versioning.

### Deliverables

- **Admin Form Builder**
  - field types: text, number, date, select, multi-select, checkbox, file upload, repeating sections
  - required fields and validations (min/max, pattern, conditional required)
  - field descriptions/help text

- **File Attachment Management**
  - upload, preview, download, replace, delete
  - file audit trail (who uploaded, when)

- **Form Versioning**
  - publishing workflow: Draft → Published
  - new edits create a new version; old submissions remain tied to old version
  - ability to compare versions at a high level (field changes)

### UI surfaces

- Admin: `/dashboard/reports/forms`
- User: `/dashboard/reports/tasks/:taskId` → form fill + attachments

### Data + permissions

- Entities:
  - `form_templates` (with JSON schema/config)
  - `form_template_versions`
  - `form_assignments` (template version assigned to task/org/cycle)
  - `form_submissions` (response JSONB)
  - `submission_files` (file metadata + storage key)

- Storage:
  - object storage (S3 or equivalent), signed URLs for download

### Acceptance tests

- Admin creates a form template with required fields.
- Admin publishes it and assigns it to a reporting task.
- Org user sees the form, must complete required fields, can upload attachments.
- Admin edits the form; a new version is created; existing submissions remain valid with prior version.

---

## RP-AGG-005: Self-Service Analytics & Data Export

### Interpretation

This is a “report builder” capability with:

- charts + pivots
- underlying dataset export
- strict access controls
- saved reports

### Deliverables

- **Analytics Builder UI**
  - choose dataset (memberships, submissions, events, org metadata, etc.)
  - select dimensions/measures
  - build charts (bar/line/pie) + pivot tables

- **Export**
  - CSV and Excel (XLSX) at minimum; JSON optional
  - export respects field-level access rules and org scoping

- **Saved Reports**
  - save report definitions (filters, chart config, aggregation)
  - share with org roles or specific users
  - optional: “scheduled report delivery” (email attachment/link)

### UI surfaces

- `/dashboard/reports/analytics`
- Report library: `/dashboard/reports/saved`

### Data + permissions

- Entities:
  - `analytics_reports` (definition JSON)
  - `analytics_report_shares` (who can access)

- Access control:
  - field-level visibility rules; can reuse the idea you already have in members directory privacy settings, but generalized

### Acceptance tests

- Authorized user builds a chart and exports underlying data.
- Another user without permission cannot see restricted fields in the export.
- User saves a report; it appears in “My Reports” and loads with the same configuration.

---

# USER INTERFACE

## UI-AGG-002: Personalized Dashboard

### Interpretation

You already have role-based dashboards, but this requirement adds **user-configurable widgets** and **role defaults**, plus reporting progress.

### Deliverables

- Dashboard widget framework:
  - widget library (Reporting status, Tasks, Deadlines, Recent submissions, Quick actions, etc.)
  - add/remove/reorder widgets (drag/drop or up/down controls)
  - role-based default layouts (Org Admin vs Reporter vs viaSport Staff)

- Reporting progress indicators integrated from RP-AGG-003
- Quick action shortcuts per role

### UI surfaces

- `/dashboard` with “Customize dashboard”
- `/dashboard/settings/dashboard` (optional)

### Data + permissions

- Entities:
  - `dashboard_layouts` (per user)
  - `dashboard_defaults` (per role)

- Permissions:
  - user can modify their own layout; admins can set role defaults

### Acceptance tests

- User rearranges widgets; refresh persists order.
- Different roles see different default widgets.
- Reporting widget shows accurate task statuses and deadlines.

---

## UI-AGG-003: Responsive and Inclusive Design

### Interpretation

You’re mostly there structurally, but the RFP needs hard requirements:

- WCAG 2.1 AA audit and fixes
- contrast mode
- keyboard navigation

### Deliverables

- WCAG 2.1 AA audit report + remediation list
- Implement high contrast mode toggle (distinct from just dark mode)
- Keyboard navigation improvements:
  - focus states, tab order, skip link, accessible dialogs/menus/tables

### UI surfaces

- Global: header/settings toggle, applied across modules

### Acceptance tests

- Demonstrate keyboard-only navigation across:
  - sidebar navigation
  - data table sorting/pagination
  - dialogs and dropdown menus

- Provide contrast testing evidence (automated + manual checks)

---

## UI-AGG-004: Communication: Task & Notification Management

### Interpretation

This is a full notification center + scheduling + preferences + templates.

### Deliverables

- In-app notifications:
  - bell icon + panel
  - unread count
  - mark read/unread

- Notification preferences:
  - per category (reporting reminders, ticket updates, system alerts)
  - channel (email/in-app)
  - frequency/digest settings (optional)

- Task reminder scheduling integrated with RP-AGG-003
- Customizable templates (admin-managed)

### UI surfaces

- Global header notification bell
- `/dashboard/settings/notifications`

### Data + permissions

- Entities:
  - `notifications`
  - `notification_preferences`
  - `notification_templates`

- Scheduler integration with SendGrid wrapper

### Acceptance tests

- User receives an in-app notification and email for an assigned reporting deadline.
- User disables email for one category; email stops but in-app continues.
- Admin edits a template and future notifications reflect the change.

---

## UI-AGG-005: Content Navigation & Interaction

### Interpretation

You have “local search” in members page; this calls for “global” and “advanced” search patterns.

### Deliverables

- Global search across key entities (organizations, users, reports, forms, templates, tickets)
- Advanced filtering UI (multi-criteria filters)
- Saved filter/search presets
- Search term highlighting
- Category-based navigation (results grouped by entity)

### UI surfaces

- Global search bar in header or sidebar
- Search results page: `/dashboard/search?q=...`

### Data + permissions

- Search implementation:
  - Postgres full-text search or a search engine (RFP can allow either)

- Must enforce org scoping and permission-based results

### Acceptance tests

- Search returns only entities the user is allowed to see.
- Saved search preset can be reapplied from a dropdown.
- Matches are highlighted in results.

---

## UI-AGG-006: User Support & Feedback Mechanism

### Interpretation

Needs a ticketing system + admin workflow + notifications.

### Deliverables

- Ticket submission form
- Ticket list + status tracking (Open / In Progress / Resolved)
- Admin ticket management interface (assign, respond, change status)
- Email + in-app notifications on ticket updates
- Feedback collection (rating/comment after resolution)

### UI surfaces

- User: `/dashboard/support`
- Admin: `/dashboard/admin/support`

### Data + permissions

- Entities:
  - `support_tickets`
  - `ticket_messages`
  - `ticket_assignments`
  - `ticket_ratings`

- Notifications integrated with UI-AGG-004

### Acceptance tests

- User submits a ticket and sees it in their list.
- Admin responds; user receives notification.
- Ticket resolution triggers feedback prompt.

---

## UI-AGG-007: Consistent Visual Language & Branding

### Interpretation

You have consistent components, but the RFP should require:

- documented standards
- optional white-labeling
- auditing consistency

### Deliverables

- Brand guidelines documentation (colors, typography, spacing, component usage)
- Theme customization (if SIN requires multiple org branding)
- Component style audit + remediation

### UI surfaces

- Admin branding settings page if white-labeling required

### Acceptance tests

- Provide brand guide artifact.
- Demonstrate theme change (logo/colors) applied consistently across modules.

---

# TRAINING & ONBOARDING

## TO-AGG-001: Template Support & Integration

### Interpretation

This is a managed library of downloadable templates and context-aware linking inside forms.

### Deliverables

- Templates library page with categories/tags
- Template preview (PDF viewer) and download
- Contextual template suggestions from data-entry items
  - e.g., a reporting form field “Upload Financial Statement” shows “Download required template”

### UI surfaces

- `/dashboard/templates`
- Inline template links within reporting forms (RP-AGG-004)

### Data + permissions

- Entities:
  - `templates`
  - `template_categories`
  - `template_links` (template ↔ form/field/task)

- File storage integration

### Acceptance tests

- User can find a template in library and download.
- From within a form, user sees relevant template links.

---

## TO-AGG-002: Guided Learning & Walkthroughs

### Interpretation

You have onboarding routing; this requires interactive walkthroughs and progress tracking.

### Deliverables

- Guided tours (step-by-step tooltips) for key workflows:
  - first login dashboard tour
  - “how to submit a report”
  - “how to manage org profile”

- First-time user detection
- Tour completion tracking and ability to replay

### UI surfaces

- On-demand “Help / Tour” button in key screens

### Data + permissions

- Entities:
  - `user_onboarding_state` (completed tours, timestamps)

- Role-based tour assignment

### Acceptance tests

- New user receives onboarding tour automatically on first visit.
- User can skip and later replay.
- Completion is tracked and not shown again unless requested.

---

## TO-AGG-003: Reference Materials & Support

### Interpretation

Help center + FAQ with search + contextual links.

### Deliverables

- Help center pages with categories (Reporting, Profile, Data Entry, Admin)
- FAQ section with search
- Contextual “Help” links embedded throughout UI

### UI surfaces

- `/dashboard/help`
- contextual links in reporting forms, dashboards, templates, support pages

### Data + permissions

- Can be static content (markdown) or admin-managed content, depending on preference
- Search should respect content visibility (some admin-only docs)

### Acceptance tests

- User searches FAQ and finds articles.
- Contextual help link opens relevant article from a form/task page.

---

## 4) How to package this into an RFP section (copy/paste structure)

If you’re turning this into an RFP document section, use this structure per requirement:

- **Requirement ID / Title**
- **Objective**
- **Functional Requirements (MUST)**
- **Non-Functional Requirements (MUST/SHOULD)**
- **User Roles Involved**
- **Data/Integration Needs**
- **Evidence / Demonstration Required from Vendor**
- **Acceptance Criteria (Given/When/Then)**

That format makes proposals comparable and prevents “hand-wavy yes” answers.

---

## 5) Suggested implementation sequencing (dependency-aware, RFP-friendly)

If you want the RFP to encourage realistic plans, group deliverables into workstreams:

1. **Foundation:** Organization model + delegated access + audit logging
2. **Notifications engine:** in-app + email + preferences + scheduling
3. **Reporting core:** cycles/tasks/deadlines + submission statuses + dashboards
4. **Configurable forms + file storage + versioning**
5. **Analytics builder + export ACLs + saved reports**
6. **UX enhancements:** dashboard personalization, search, accessibility, branding
7. **Enablement:** templates, walkthroughs, help center, support tickets

This also helps evaluation: vendors who ignore dependencies can be scored down.

---

## If you want, I can produce a “proposal-ready” deliverable in one of these formats

No need to clarify—just tell me which one you want and I’ll output it in that format:

1. **RFP Requirements Matrix** (scorable checklist, each item MUST/SHOULD/COULD)
2. **Vendor Response Draft** (“We will deliver…” narrative aligned to each ID)
3. **Statement of Work** (deliverables, assumptions, out-of-scope, acceptance)
