# System Requirements: Data Management (DM-AGG)

## Compliance Summary

| Req ID     | Title                                 | Status                                       | Evaluation Environment (Jan 2026)                                  | Finalization Scope                           |
| :--------- | :------------------------------------ | :------------------------------------------- | :----------------------------------------------------------------- | :------------------------------------------- |
| DM-AGG-001 | Data Collection and Submission        | Implemented; Requires viaSport Configuration | Form builder, file uploads, submission tracking                    | viaSport templates and field definitions     |
| DM-AGG-002 | Data Processing and Integration       | Optional / Post-Award                        | Import and export, validation, audit logging                       | External integrations (optional, post-award) |
| DM-AGG-003 | Data Governance and Access Control    | Implemented (Demoable Now)                   | RBAC, org scoping, data catalog                                    | Catalog taxonomy refinement                  |
| DM-AGG-004 | Data Quality and Integrity            | Implemented (Demoable Now)                   | Validation rules, quality alerting with thresholds                 | Threshold tuning with viaSport               |
| DM-AGG-005 | Data Storage and Retention            | Implemented; Requires viaSport Configuration | Backups, archiving, retention enforcement                          | Retention durations (viaSport Discovery)     |
| DM-AGG-006 | Legacy Data Migration and Bulk Import | Requires Production Data Confirmation        | Smart import with error categorization, autofix, dynamic templates | Legacy extraction (awaiting BCAR/BCSI)       |

## DM-AGG-001: Data Collection and Submission

**Requirement:**

The system shall enable customizable form building, support flexible data entry through variable formats (forms, file uploads), with capabilities for real-time submission tracking, editing, and historical data migration.

**Acceptance Criteria:**

Users and System Admin can successfully submit, track, and edit data.

**How We Meet It:**

- Administrators build and publish custom forms without code changes.
- Submissions support file uploads and status tracking.
- Users can edit submissions and view version history.

**Evaluation Environment (Jan 2026):**

- Form builder with 11 field types (text, number, email, phone, date, select, multiselect, checkbox, file, textarea, rich text).
- Submission statuses with history and audit entries.
- File uploads validated and stored in S3 with access controls.
- Import jobs link historical data to form submissions.

**Finalization Scope:**

- viaSport specific templates and field definitions (TBD).

**viaSport Dependencies:**

- Final form templates and data dictionary.

**Approach:** Template and field definitions will be finalized during Discovery. See **Service Approach: Data Submission and Reporting Web Portal** for UX approach.

**Evidence:** Evidence is summarized in Section 1.3.

## DM-AGG-002: Data Processing and Integration

**Requirement:**

The system shall enable standardization of data formatting, logging of transformation processes, and integration with external platforms through API (optional), and data import/export mechanisms.

**Acceptance Criteria:**

Incoming data is processed uniformly, logged for traceability, and exchanged with external platforms.

**How We Meet It:**

- Import and export pipelines normalize data types and validate required fields.
- Transformation and import events are logged in the audit trail.
- Export formats support CSV, Excel, and JSON.

**Evaluation Environment (Jan 2026):**

- Import parser with typed validation and row level error logging.
- Mapping templates and audit logging for import jobs.
- Export controls enforced through BI and reporting pipelines.

**Finalization Scope:**

- External API integrations scoped with viaSport and legacy system owners.
- Standardized mapping rules for cross system integrations.

**viaSport Dependencies:**

- Integration targets, API access, and data exchange requirements.

**Approach:** Define integration scope during Discovery, then implement connectors and validation. See **Service Approach: Data Migration** for methodology.

**Evidence:** Evidence is summarized in Section 1.3.

## DM-AGG-003: Data Governance and Access Control

**Requirement:**

The system shall enforce role-based access to data and provide administrators with secure database access, along with data cataloging and indexing capabilities for discoverability.

**Acceptance Criteria:**

Users can only access data based on permission.

**How We Meet It:**

- Role-based access control with organization scoping is enforced on every query.
- Field-level access control is applied in analytics and exports.
- Data catalog indexes forms, templates, and reports for discoverability.

**Evaluation Environment (Jan 2026):**

- Predefined roles (owner, admin, reporter, viewer) with permission checks.
- Data catalog and global search for forms, templates, and reports.
- Admin access to data through audited BI and SQL workbench.

### Data Catalog (What It Is)

In Solstice, the Data Catalog is a searchable inventory of forms, fields, templates, reports, and saved analytics views, with permission-aware access. It helps users discover what data exists and where it is used. It is not a document management system. Uploaded files are stored in S3 and referenced from submissions and catalog entries through secure links and access controls.

During discovery, we will confirm the proportion of structured submission data versus document-centric reporting and adjust catalog tagging and search priorities accordingly.

**Finalization Scope:**

- Catalog taxonomy and tagging refinement with viaSport (TBD).

**viaSport Dependencies:**

- Preferred catalog taxonomy and indexing priorities.

**Approach:** Refine catalog categories during Discovery. See **Service Approach: Platform Design and Customization** for governance approach.

**Evidence:** Evidence is summarized in Section 1.3.

## DM-AGG-004: Data Quality and Integrity

**Requirement:**

The system shall ensure relational integrity and continuously monitor data quality using validation rules and automated checks.

**Acceptance Criteria:**

Submitted data meets validation rules.

**How We Meet It:**

- Database constraints enforce relational integrity.
- Forms and imports validate required fields and formats.
- Automated quality checks identify missing fields and validation errors.

**Evaluation Environment (Jan 2026):**

- Server-side validation with Zod schemas and form rules.
- Data quality monitoring job with threshold evaluation and change-only admin notifications.
- Global alert thresholds with optional org-level overrides via organization settings.
- Admin dashboard view for data quality metrics with notification link.

**Finalization Scope:**

- Threshold tuning and alert recipients confirmed with viaSport (TBD).

**viaSport Dependencies:**

- Data quality threshold preferences and escalation contacts.

**Approach:** Configure thresholds during Discovery and validate in UAT. See **Service Approach: Testing and Quality Assurance**.

**Evidence:** Evidence is summarized in Section 1.3.

## DM-AGG-005: Data Storage and Retention

**Requirement:**

The system shall support regular backups, disaster recovery mechanisms, data archiving, and secure cloud hosting aligned with retention policies.

**Acceptance Criteria:**

Data is backed up, archived as scheduled, and securely hosted in the cloud.

**How We Meet It:**

- RDS backups with point in time recovery are enabled.
- Retention enforcement and legal hold workflows protect regulated data.
- Audit logs are immutable and archived to S3 Deep Archive.

**Evaluation Environment (Jan 2026):**

- Backup retention configured per environment (35 days in production).
- Retention policy engine with legal holds and audit log archiving.
- S3 Object Lock enabled for artifacts storage.

**Finalization Scope:**

- Retention durations to be confirmed with viaSport during Discovery.

**viaSport Dependencies:**

- Confirm retention durations and DR schedule.

**Approach:** Run final DR and retention validation in sin-perf or sin-prod. See **Service Approach: Data Warehousing**.

**Evidence:** Evidence is summarized in Appendix C (Performance Evidence) and Appendix D (Security Architecture Summary).

## DM-AGG-006: Legacy Data Migration and Bulk Import

**Requirement:**

The system shall provide tooling and configurable mapping templates to import historical data from CSV/Excel, legacy databases, or APIs, including validation, error-handling, and rollback.

**Acceptance Criteria:**

Administrators can map legacy fields to system fields, preview results, and execute import; import logs stored for audit.

**How We Meet It:**

- Smart import wizard supports CSV and Excel uploads with intelligent error handling.
- Pattern detection identifies column type mismatches and suggests fixes.
- One-click autofix for common issues with confidence scoring.
- Import jobs are auditable and reversible within the rollback window.

**Evaluation Environment (Jan 2026):**

- **Intelligent Error Categorization:** Errors grouped by root cause (structural, data quality, completeness, referential) instead of row-by-row display
- **Pattern Detection:** 13 pattern detectors (email, date formats, phone, currency, postal codes, UUID, etc.) automatically identify column type mismatches
- **Autofix with Confidence Scoring:** One-click fixes for column swaps, date format conversion, boolean normalization; dynamic confidence based on pattern match ratio, header hints, and sample size
- **In-App Correction:** Inline cell editing with real-time validation, eliminating re-upload for minor fixes
- **Dynamic Templates:** Generate XLSX/CSV templates from any form definition with field descriptions, example values, and Excel data validation dropdowns
- **Virtualized Preview:** TanStack Virtual for 10k+ row previews without performance degradation
- **Admin Template Management:** Template CRUD, version tracking, import history with rollback
- **Batch Processing:** ECS Fargate worker for large file processing (deployed in sin-perf and sin-uat)

**Finalization Scope:**

- Legacy extraction and BCAR or BCSI mapping rules.
- Additional migration pipelines for organization and user records (pending viaSport legacy access).

**viaSport Dependencies:**

- Legacy export access and schema documentation.
- SME review for mapping templates.

**Approach:** Finalize extraction approach during Discovery, then execute pilot and phased migration. See **Service Approach: Data Migration**.

**Demo Path:** Dashboard → Admin → Imports (Smart wizard with autofix demo)

**Evidence:** Evidence is summarized in Section 1.3.

---
