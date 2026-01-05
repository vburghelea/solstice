# System Requirements: Data Management (DM-AGG)

## Compliance Summary

| Req ID     | Title                                 | Status  | Built Today                                         | Remaining Scope                          |
| ---------- | ------------------------------------- | ------- | --------------------------------------------------- | ---------------------------------------- |
| DM-AGG-001 | Data Collection and Submission        | Built   | Form builder, file uploads, submission tracking     | viaSport templates and field definitions |
| DM-AGG-002 | Data Processing and Integration       | Partial | Import and export, validation, audit logging        | External integrations and mapping rules  |
| DM-AGG-003 | Data Governance and Access Control    | Built   | RBAC, org scoping, data catalog                     | Catalog taxonomy refinement              |
| DM-AGG-004 | Data Quality and Integrity            | Built   | Validation rules, quality alerting with thresholds  | Threshold tuning with viaSport           |
| DM-AGG-005 | Data Storage and Retention            | Built   | Backups, archiving, retention enforcement           | Final DR and retention validation (TBD)  |
| DM-AGG-006 | Legacy Data Migration and Bulk Import | Partial | Import wizard, file field imports, ECS batch worker | Legacy extraction scope and mapping      |

## DM-AGG-001: Data Collection and Submission

**Requirement:**

> The system shall enable customizable form building, support flexible data entry through variable formats (forms, file uploads), with capabilities for real-time submission tracking, editing, and historical data migration.

**Acceptance Criteria:**

> Users and System Admin can successfully submit, track, and edit data.

**How We Meet It:**

- Administrators build and publish custom forms without code changes.
- Submissions support file uploads and status tracking.
- Users can edit submissions and view version history.

**Built Today:**

- Form builder with 11 field types (text, number, email, phone, date, select, multiselect, checkbox, file, textarea, rich text).
- Submission statuses with history and audit entries.
- File uploads validated and stored in S3 with access controls.
- Import jobs link historical data to form submissions.

**Remaining Scope:**

- viaSport specific templates and field definitions (TBD).

**viaSport Dependencies:**

- Final form templates and data dictionary.

**Approach:**
Template and field definitions will be finalized during Discovery. See Section 03 Data Submission and Reporting for UX approach.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/DM-AGG-001-form-builder-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/DM-AGG-001-forms-20251228-1953.png`

## DM-AGG-002: Data Processing and Integration

**Requirement:**

> The system shall enable standardization of data formatting, logging of transformation processes, and integration with external platforms through API (optional), and data import/export mechanisms.

**Acceptance Criteria:**

> Incoming data is processed uniformly, logged for traceability, and exchanged with external platforms.

**How We Meet It:**

- Import and export pipelines normalize data types and validate required fields.
- Transformation and import events are logged in the audit trail.
- Export formats support CSV, Excel, and JSON.

**Built Today:**

- Import parser with typed validation and row level error logging.
- Mapping templates and audit logging for import jobs.
- Export controls enforced through BI and reporting pipelines.

**Remaining Scope:**

- External API integrations scoped with viaSport and legacy system owners.
- Standardized mapping rules for cross system integrations.

**viaSport Dependencies:**

- Integration targets, API access, and data exchange requirements.

**Approach:**
Define integration scope during Discovery, then implement connectors and validation. See Section 03 Data Migration for methodology.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/2025-12-29-import-preview-confirmation.png`
- `src/features/imports/imports.mutations.ts`

## DM-AGG-003: Data Governance and Access Control

**Requirement:**

> The system shall enforce role-based access to data and provide administrators with secure database access, along with data cataloging and indexing capabilities for discoverability.

**Acceptance Criteria:**

> Users can only access data based on permission.

**How We Meet It:**

- Role-based access control with organization scoping is enforced on every query.
- Field-level access control is applied in analytics and exports.
- Data catalog indexes forms, templates, and reports for discoverability.

**Built Today:**

- Predefined roles (owner, admin, reporter, viewer) with permission checks.
- Data catalog and global search for forms, templates, and reports.
- Admin access to data through audited BI and SQL workbench.

**Remaining Scope:**

- Catalog taxonomy and tagging refinement with viaSport (TBD).

**viaSport Dependencies:**

- Preferred catalog taxonomy and indexing priorities.

**Approach:**
Refine catalog categories during Discovery. See Section 03 Platform Design for governance approach.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/DM-AGG-003-data-catalog-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/DM-AGG-003-org-access-20251228-1953.png`

## DM-AGG-004: Data Quality and Integrity

**Requirement:**

> The system shall ensure relational integrity and continuously monitor data quality using validation rules and automated checks.

**Acceptance Criteria:**

> Submitted data meets validation rules.

**How We Meet It:**

- Database constraints enforce relational integrity.
- Forms and imports validate required fields and formats.
- Automated quality checks identify missing fields and validation errors.

**Built Today:**

- Server-side validation with Zod schemas and form rules.
- Data quality monitoring job with threshold evaluation and change-only admin notifications.
- Global alert thresholds with optional org-level overrides via organization settings.
- Admin dashboard view for data quality metrics with notification link.

**Remaining Scope:**

- Threshold tuning and alert recipients confirmed with viaSport (TBD).

**viaSport Dependencies:**

- Data quality threshold preferences and escalation contacts.

**Approach:**
Configure thresholds during Discovery and validate in UAT. See Section 03 Testing and QA.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/DM-AGG-004-data-quality-20251228-1953.png`
- `src/features/data-quality/data-quality.monitor.ts`

## DM-AGG-005: Data Storage and Retention

**Requirement:**

> The system shall support regular backups, disaster recovery mechanisms, data archiving, and secure cloud hosting aligned with retention policies.

**Acceptance Criteria:**

> Data is backed up, archived as scheduled, and securely hosted in the cloud.

**How We Meet It:**

- RDS backups with point in time recovery are enabled.
- Retention enforcement and legal hold workflows protect regulated data.
- Audit logs are immutable and archived to S3 Deep Archive.

**Built Today:**

- Backup retention configured per environment (35 days in production).
- Retention policy engine with legal holds and audit log archiving.
- S3 Object Lock enabled for artifacts storage.

**Remaining Scope:**

- Final production DR drill and retention validation before submission (TBD).

**viaSport Dependencies:**

- Confirm retention durations and DR schedule.

**Approach:**
Run final DR and retention validation in sin-perf or sin-prod. See Section 03 Data Warehousing.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/DR-DRILL-sin-dev-20251230.md`
- `docs/sin-rfp/review-plans/evidence/ENCRYPTION-STATUS-sin-dev-20251231.md`
- `docs/sin-rfp/review-plans/evidence/RETENTION-JOB-sin-dev-20251230.md`

## DM-AGG-006: Legacy Data Migration and Bulk Import

**Requirement:**

> The system shall provide tooling and configurable mapping templates to import historical data from CSV/Excel, legacy databases, or APIs, including validation, error-handling, and rollback.

**Acceptance Criteria:**

> Administrators can map legacy fields to system fields, preview results, and execute import; import logs stored for audit.

**How We Meet It:**

- Import wizard supports CSV and Excel uploads with mapping templates.
- Validation preview highlights errors before commit.
- Import jobs are auditable and reversible within the rollback window.

**Built Today:**

- Import wizard with upload, mapping, preview, and commit flow.
- File field import pipeline supporting JSON file payloads with validation (fileName, mimeType, sizeBytes, storageKey).
- Mapping template library and reusable mappings.
- Rollback support using import job ID and 7-day rollback window.
- Batch processing lane with ECS Fargate worker (verified deployed in sin-dev).

**Remaining Scope:**

- Legacy extraction and BCAR or BCSI mapping rules.
- Additional migration pipelines for organization and user records (TBD).

**viaSport Dependencies:**

- Legacy export access and schema documentation.
- SME review for mapping templates.

**Approach:**
Finalize extraction approach during Discovery, then execute pilot and phased migration. See Section 03 Data Migration.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/DM-AGG-006-imports-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/DM-AGG-006-import-admin-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/2025-12-29-import-preview-confirmation.png`
