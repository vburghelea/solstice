# System Requirements: Reporting (RP-AGG)

## Compliance Summary

| Req ID     | Title                                  | Status  | Built Today                                        | Remaining Scope                 |
| ---------- | -------------------------------------- | ------- | -------------------------------------------------- | ------------------------------- |
| RP-AGG-001 | Data Validation and Submission Rules   | Built   | Validation rules and error messaging               | None                            |
| RP-AGG-002 | Reporting Information Management       | Partial | Reporting metadata schema and access controls      | viaSport metadata configuration |
| RP-AGG-003 | Reporting Flow and Support             | Built   | Reminders, resubmission tracking, dashboards       | None                            |
| RP-AGG-004 | Reporting Configuration and Collection | Built   | Form builder, file management, admin configuration | None                            |
| RP-AGG-005 | Self-Service Analytics and Data Export | Built   | Native BI, pivots, charts, CSV and Excel export    | None                            |

## RP-AGG-001: Data Validation and Submission Rules

**Requirement:**

> The system shall validate submissions to ensure they are complete, clean, use the correct file types, and contain valid data fields such as dates and contact information.

**Acceptance Criteria:**

> Submissions that fail validation are rejected with appropriate error messages.

**How We Meet It:**

- Required fields and validation rules are enforced on submit.
- File uploads are validated by MIME type and size.
- Errors are shown inline with actionable messages.

**Built Today:**

- Zod-based validation for forms and imports.
- Server-side enforcement to prevent bypassing client checks.
- File upload validation and safe storage keys.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Continue to refine validation rules during Discovery based on viaSport templates.

**Evidence:**
Evidence is summarized in Section 1.3.

## RP-AGG-002: Reporting Information Management

**Requirement:**

> The system shall manage metadata related to reporting including but not limited to contribution agreements, NCCP, contact details, fiscal periods, organization profiles, and delegated access rights.

**Acceptance Criteria:**

> Users can update relevant metadata and access reporting features accordingly.

**How We Meet It:**

- Reporting metadata schema includes fiscal periods, contribution agreements, and NCCP fields.
- Organization profiles and delegated access are managed through roles and invites.
- Reporting tasks and submissions are tied to organizations and cycles.

**Built Today:**

- Reporting metadata schema and update endpoints.
- Organization profile and role management with delegated access.
- Reporting cycles and tasks with due dates and reminders.

**Remaining Scope:**

- viaSport metadata configuration and UI refinement for specific fields (TBD).

**viaSport Dependencies:**

- Data dictionary and field definitions for contribution agreements and NCCP.

**Approach:**
Configure metadata fields during Discovery and validate in UAT. See **System Requirements: Training and Onboarding (TO-AGG)** for change adoption.

**Evidence:**
Evidence is summarized in Section 1.3.

## RP-AGG-003: Reporting Flow and Support

**Requirement:**

> The system shall support automated reporting reminders, allow users to track data resubmissions, and visualize submitted data through dashboards.

**Acceptance Criteria:**

> Users are reminded, track changes, and view data in a dashboard format.

**How We Meet It:**

- Reporting tasks track status across cycles and due dates.
- Reminder schedules generate in-app and email notifications.
- Submission history records resubmissions and status changes.

**Built Today:**

- Reporting dashboard with status and due dates.
- Reminder schedules and notification delivery.
- Submission history and resubmission tracking.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Reminder cadence and reporting dashboards will be tuned with viaSport during Discovery.

**Evidence:**
Evidence is summarized in Section 1.3.

## RP-AGG-004: Reporting Configuration and Collection

**Requirement:**

> The system shall allow system administrators to configure customizable reporting forms, define required fields, display files for users to read, edit, delete, and download.

**Acceptance Criteria:**

> System admin can configure reporting information and forms.

**How We Meet It:**

- Administrators build forms and set required fields.
- File uploads are visible with read, download, and delete controls.
- Form versions preserve historical submissions.

**Built Today:**

- Form builder and versioning for reporting forms.
- File management for submissions with delete and download actions.
- Admin reporting configuration tools.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Continue to refine reporting form templates during Discovery.

**Evidence:**
Evidence is summarized in Section 1.3.

## RP-AGG-005: Self-Service Analytics and Data Export

**Requirement:**

> Enable authorized users to build ad-hoc charts, pivot tables, and export raw or aggregated datasets in CSV, Excel, or JSON (optional) without developer intervention.

**Acceptance Criteria:**

> User builds a custom chart and exports underlying dataset to CSVs; export respects field-level access rules.

**How We Meet It:**

- Native BI supports pivot tables, charts, and dashboards.
- Exports are available in CSV, Excel, and JSON.
- Field-level access and step-up authentication protect sensitive data.

**Built Today:**

- Pivot builder and charting with ECharts.
- CSV, XLSX, and JSON exports with audit logging.
- Field-level access control and step-up authentication on export.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Continue to expand datasets and templates as viaSport priorities are defined.

**Evidence:**
Evidence is summarized in Section 1.3.
