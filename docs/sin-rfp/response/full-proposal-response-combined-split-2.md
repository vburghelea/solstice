---
# System Requirements Compliance Crosswalk

This table summarizes compliance status for all 25 requirements. Detailed implementation notes follow in subsequent sections.

## Status Legend

| Status                                           | Meaning                                                                                                                              |
| :----------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **Implemented (Demoable Now)**                   | Platform capability is fully built and available in the evaluation environment                                                       |
| **Implemented; Requires viaSport Configuration** | Capability is built; final values/content (templates, labels, policies, branding) are configured with viaSport during implementation |
| **Requires Production Data Confirmation**        | Capability is built; final migration mappings and edge cases are validated once BCAR/BCSI access is available                        |
| **Optional / Post-Award**                        | Not required for initial launch unless viaSport elects to scope it in                                                                |

## Data Management (DM-AGG)

| Req ID     | Title                                 | Status                                           | Evaluation Environment (Jan 2026)               | Finalization Scope                                |
| :--------- | :------------------------------------ | :----------------------------------------------- | :---------------------------------------------- | :------------------------------------------------ |
| DM-AGG-001 | Data Collection and Submission        | Implemented; Requires viaSport Configuration     | Form builder, file uploads, submission tracking | Load viaSport templates during discovery          |
| DM-AGG-002 | Data Processing and Integration       | Optional / Post-Award                            | Import and export, validation, audit logging    | Optional: scope external integrations if required |
| DM-AGG-003 | Data Governance and Access Control    | Implemented (Demoable Now)                       | RBAC, org scoping, data catalog                 | Finalize taxonomy with viaSport during discovery  |
| DM-AGG-004 | Data Quality and Integrity            | Implemented (Demoable Now)                       | Validation, alerting with thresholds            | Configure thresholds during discovery             |
| DM-AGG-005 | Data Storage and Retention            | Implemented; Requires viaSport Configuration     | Backups, archiving, retention enforcement       | Confirm durations during discovery                |
| DM-AGG-006 | Legacy Data Migration and Bulk Import | Requires Production Data Confirmation            | Smart import with autofix, dynamic templates    | Confirm extraction method once access granted     |

## Reporting (RP-AGG)

| Req ID     | Title                                  | Status                                           | Evaluation Environment (Jan 2026)            | Finalization Scope                  |
| :--------- | :------------------------------------- | :----------------------------------------------- | :------------------------------------------- | :---------------------------------- |
| RP-AGG-001 | Data Validation and Submission Rules   | Implemented (Demoable Now)                       | Validation rules and error messaging         | None                                |
| RP-AGG-002 | Reporting Information Management       | Implemented; Requires viaSport Configuration     | Reporting metadata schema, delegated access  | Configure metadata during discovery |
| RP-AGG-003 | Reporting Flow and Support             | Implemented (Demoable Now)                       | Reminders, resubmission tracking, dashboards | None                                |
| RP-AGG-004 | Reporting Configuration and Collection | Implemented (Demoable Now)                       | Form builder, file management                | None                                |
| RP-AGG-005 | Self-Service Analytics and Data Export | Implemented (Demoable Now)                       | Native BI, pivots, charts, export            | None                                |

## Security (SEC-AGG)

| Req ID      | Title                             | Status                     | Evaluation Environment (Jan 2026)                               | Finalization Scope |
| :---------- | :-------------------------------- | :------------------------- | :-------------------------------------------------------------- | :----------------- |
| SEC-AGG-001 | Authentication and Access Control | Implemented (Demoable Now) | MFA, RBAC, password policy, org scoping                         | None               |
| SEC-AGG-002 | Monitoring and Threat Detection   | Implemented (Demoable Now) | AWS WAF, rate limiting, pre-auth lockout, CloudTrail CIS alarms | None               |
| SEC-AGG-003 | Privacy and Regulatory Compliance | Implemented (Demoable Now) | Encryption, Canadian hosting, retention controls                | None               |
| SEC-AGG-004 | Audit Trail and Data Lineage      | Implemented (Demoable Now) | Immutable audit log, hash chain                                 | None               |

## Training and Onboarding (TO-AGG)

| Req ID     | Title                            | Status                                       | Evaluation Environment (Jan 2026)     | Finalization Scope                       |
| :--------- | :------------------------------- | :------------------------------------------- | :------------------------------------ | :--------------------------------------- |
| TO-AGG-001 | Template Support and Integration | Implemented; Requires viaSport Configuration | Template hub with preview, versioning | Load viaSport templates during discovery |
| TO-AGG-002 | Guided Learning and Walkthroughs | Implemented; Requires viaSport Configuration | Auto-launch tours, progress tracking  | Final content review during discovery    |
| TO-AGG-003 | Reference Materials and Support  | Implemented; Requires viaSport Configuration | Role-scoped help, support with SLA    | Refine content during discovery          |

## User Interface (UI-AGG)

| Req ID     | Title                                   | Status                                       | Evaluation Environment (Jan 2026)         | Finalization Scope                       |
| :--------- | :-------------------------------------- | :------------------------------------------- | :---------------------------------------- | :--------------------------------------- |
| UI-AGG-001 | User Access and Account Control         | Implemented (Demoable Now)                   | Login, MFA, recovery, RBAC                | None                                     |
| UI-AGG-002 | Personalized Dashboard                  | Implemented (Demoable Now)                   | Role-aware dashboards                     | None                                     |
| UI-AGG-003 | Responsive and Inclusive Design         | Implemented (Demoable Now)                   | Responsive UI, accessibility scans        | None                                     |
| UI-AGG-004 | Task and Notification Management        | Implemented (Demoable Now)                   | Notifications and reminders               | None                                     |
| UI-AGG-005 | Content Navigation and Interaction      | Implemented (Demoable Now)                   | Search, filtering, command palette        | None                                     |
| UI-AGG-006 | User Support and Feedback               | Implemented (Demoable Now)                   | Support with priority, SLA, notifications | None                                     |
| UI-AGG-007 | Consistent Visual Language and Branding | Implemented; Requires viaSport Configuration | Design system and theming                 | Apply viaSport branding during discovery |

## Summary

| Category                | Total  | Implemented |
| :---------------------- | :----- | :---------- |
| Data Management         | 6      | 6           |
| Reporting               | 5      | 5           |
| Security                | 4      | 4           |
| Training and Onboarding | 3      | 3           |
| User Interface          | 7      | 7           |
| **Total**               | **25** | **25**      |

All 25 requirements are implemented. Finalization scope items (viaSport-specific configuration, templates, branding) are completed during discovery and implementation.

---

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

- viaSport specific templates and field definitions (confirmed during Discovery).

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

- Catalog taxonomy and tagging refinement with viaSport (confirmed during Discovery).

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

- Threshold tuning and alert recipients confirmed with viaSport (confirmed during Discovery).

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

# System Requirements: Reporting (RP-AGG)

## Compliance Summary

| Req ID     | Title                                  | Status                                       | Evaluation Environment (Jan 2026)                  | Finalization Scope              |
| :--------- | :------------------------------------- | :------------------------------------------- | :------------------------------------------------- | :------------------------------ |
| RP-AGG-001 | Data Validation and Submission Rules   | Implemented (Demoable Now)                   | Validation rules and error messaging               | None                            |
| RP-AGG-002 | Reporting Information Management       | Implemented; Requires viaSport Configuration | Reporting metadata schema and access controls      | viaSport metadata configuration |
| RP-AGG-003 | Reporting Flow and Support             | Implemented (Demoable Now)                   | Reminders, resubmission tracking, dashboards       | None                            |
| RP-AGG-004 | Reporting Configuration and Collection | Implemented (Demoable Now)                   | Form builder, file management, admin configuration | None                            |
| RP-AGG-005 | Self-Service Analytics and Data Export | Implemented (Demoable Now)                   | Native BI, pivots, charts, CSV and Excel export    | None                            |

## RP-AGG-001: Data Validation and Submission Rules

**Requirement:**

The system shall validate submissions to ensure they are complete, clean, use the correct file types, and contain valid data fields such as dates and contact information.

**Acceptance Criteria:**

Submissions that fail validation are rejected with appropriate error messages.

**How We Meet It:**

- Required fields and validation rules are enforced on submit.
- File uploads are validated by MIME type and size.
- Errors are shown inline with actionable messages.

**Evaluation Environment (Jan 2026):**

- Zod-based validation for forms and imports.
- Server-side enforcement to prevent bypassing client checks.
- File upload validation and safe storage keys.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Continue to refine validation rules during Discovery based on viaSport templates.

**Evidence:** Evidence is summarized in Section 1.3.

## RP-AGG-002: Reporting Information Management

**Requirement:**

The system shall manage metadata related to reporting including but not limited to contribution agreements, NCCP, contact details, fiscal periods, organization profiles, and delegated access rights.

**Acceptance Criteria:**

Users can update relevant metadata and access reporting features accordingly.

**How We Meet It:**

- Reporting metadata schema includes fiscal periods, contribution agreements, and NCCP fields.
- Organization profiles and delegated access are managed through roles and invites.
- Reporting tasks and submissions are tied to organizations and cycles.

**Evaluation Environment (Jan 2026):**

- Reporting metadata schema and update endpoints.
- Organization profile and role management with delegated access.
- Reporting cycles and tasks with due dates and reminders.

**Finalization Scope:**

- viaSport metadata configuration and UI refinement for specific fields (confirmed during Discovery).

**viaSport Dependencies:**

- Data dictionary and field definitions for contribution agreements and NCCP.

**Approach:** Configure metadata fields during Discovery and validate in UAT. See **System Requirements: Training and Onboarding (TO-AGG)** for change adoption.

**Evidence:** Evidence is summarized in Section 1.3.

## RP-AGG-003: Reporting Flow and Support

**Requirement:**

The system shall support automated reporting reminders, allow users to track data resubmissions, and visualize submitted data through dashboards.

**Acceptance Criteria:**

Users are reminded, track changes, and view data in a dashboard format.

**How We Meet It:**

- Reporting tasks track status across cycles and due dates.
- Reminder schedules generate in-app and email notifications.
- Submission history records resubmissions and status changes.

**Evaluation Environment (Jan 2026):**

- Reporting dashboard with status and due dates.
- Reminder schedules and notification delivery.
- Submission history and resubmission tracking.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Reminder cadence and reporting dashboards will be tuned with viaSport during Discovery.

**Evidence:** Evidence is summarized in Section 1.3.

## RP-AGG-004: Reporting Configuration and Collection

**Requirement:**

The system shall allow system administrators to configure customizable reporting forms, define required fields, display files for users to read, edit, delete, and download.

**Acceptance Criteria:**

System admin can configure reporting information and forms.

**How We Meet It:**

- Administrators build forms and set required fields.
- File uploads are visible with read, download, and delete controls.
- Form versions preserve historical submissions.

**Evaluation Environment (Jan 2026):**

- Form builder and versioning for reporting forms.
- File management for submissions with delete and download actions.
- Admin reporting configuration tools.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Continue to refine reporting form templates during Discovery.

**Evidence:** Evidence is summarized in Section 1.3.

## RP-AGG-005: Self-Service Analytics and Data Export

**Requirement:**

Enable authorized users to build ad-hoc charts, pivot tables, and export raw or aggregated datasets in CSV, Excel, or JSON (optional) without developer intervention.

**Acceptance Criteria:**

User builds a custom chart and exports underlying dataset to CSVs; export respects field-level access rules.

**How We Meet It:**

- Native BI supports pivot tables, charts, and dashboards.
- Exports are available in CSV, Excel, and JSON.
- Field-level access and step-up authentication protect sensitive data.

**Evaluation Environment (Jan 2026):**

- Pivot builder and charting with ECharts.
- CSV, XLSX, and JSON exports with audit logging.
- Field-level access control and step-up authentication on export.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Continue to expand datasets and templates as viaSport priorities are defined.

**Evidence:** Evidence is summarized in Section 1.3.

---

# System Requirements: Security (SEC-AGG)

## Shared Responsibility Model

See Section 1.2 for the shared responsibility summary and AWS Artifact references.

## Compliance Summary

| Req ID      | Title                             | Status                     | Evaluation Environment (Jan 2026)                               | Finalization Scope |
| :---------- | :-------------------------------- | :------------------------- | :-------------------------------------------------------------- | :----------------- |
| SEC-AGG-001 | Authentication and Access Control | Implemented (Demoable Now) | MFA, RBAC, org scoping, user admission                          | None               |
| SEC-AGG-002 | Monitoring and Threat Detection   | Implemented (Demoable Now) | AWS WAF, rate limiting, pre-auth lockout, CloudTrail CIS alarms | None               |
| SEC-AGG-003 | Privacy and Regulatory Compliance | Implemented (Demoable Now) | Encryption, Canadian hosting, retention controls                | None               |
| SEC-AGG-004 | Audit Trail and Data Lineage      | Implemented (Demoable Now) | Immutable audit log with hash chain                             | None               |

## SEC-AGG-001: Authentication and Access Control

**Requirement:**

The system shall enforce multi-factor authentication, support secure password recovery, restrict access based on user roles and affiliations, and allow organizational leaders to manage user admission.

**Acceptance Criteria:**

Users log in securely; only authorized individuals gain access based on role and affiliation.

**How We Meet It:**

- MFA with TOTP and backup codes is supported.
- Password reset uses time-limited email tokens.
- Password complexity enforced on signup and reset (uppercase, lowercase, number, symbol).
- RBAC and organization scoping are enforced in the API layer.
- Organization owners and admins manage invites and join requests.

**Evaluation Environment (Jan 2026):**

- MFA enrollment and recovery flows.
- Server-side password policy enforcement (validated: weak passwords blocked with inline errors).
- Role-based permissions and org membership enforcement.
- User invitation and join request workflows.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Continue to validate flows during UAT. See **Service Approach: Testing and Quality Assurance**.

**Evidence:** Evidence is summarized in Section 1.2.

## SEC-AGG-002: Monitoring and Threat Detection

**Requirement:**

The system shall detect and flag suspicious activities such as unusual login patterns or behavior anomalies and automatically lock accounts where appropriate.

**Acceptance Criteria:**

Security anomalies are flagged, logged, and result in appropriate account safeguards.

**How We Meet It:**

- Heuristic threat detection uses configurable thresholds to flag suspicious patterns.
- CloudFront edge security provides DDoS protection, security headers, and AWS WAF managed rules with rate limiting.
- Failed logins trigger account flagging and lockouts.
- Rate limiting protects authentication and API endpoints.
- CloudTrail with CIS Benchmark alarms detects infrastructure-level anomalies.
- Admins receive security alerts for flagged activity.

**CORS and Network Architecture:** The application uses a same-origin architecture where the frontend and API are served from the same CloudFront distribution, eliminating the need for CORS preflight requests. AWS WAF rules are configured for standard HTTPS traffic without requiring cross-origin exceptions.

**Network Isolation Option:** For environments requiring enhanced network isolation, AWS WAF can be configured with IP-based allow lists to restrict access to authorized networks. The current configuration uses rate limiting and managed rule sets; IP allow lists can be added per viaSport's security policy.

**Evaluation Environment (Jan 2026):**

- Pre-auth lockout gating blocks sign-in for locked users before authentication.
- Rate limiting with Redis-backed sliding window algorithm (5 requests/15 min for auth, in-memory fallback).
- Login failure thresholds: 5 failures in 15 minutes triggers 30-minute account lockout.
- AWS WAF WebACL deployed on CloudFront with AWS Managed Rule Groups (Common Rule Set, SQLi, Known Bad Inputs) and edge rate limiting.
- Security event logging to `security_events` table with CloudWatch metrics.
- CloudTrail audit logging with CIS Benchmark alarms (root usage, IAM changes, security group changes, VPC changes, unauthorized API calls).
- CloudWatch alarms for anomalous request patterns and error rate spikes.
- Admin notifications for login anomalies and account lockouts.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Security rules are tuned with viaSport and validated in UAT.

**Evidence:** Evidence is summarized in Section 1.2.

## SEC-AGG-003: Privacy and Regulatory Compliance

**Requirement:**

The system shall comply with relevant data protection laws (e.g., PIPEDA) to ensure secure handling, storage, and access to personal information.

**Acceptance Criteria:**

All sensitive data is encrypted and stored securely.

**How We Meet It:**

The platform is designed to be compliant with PIPA (Personal Information Protection Act, BC) and PIPEDA (federal):

- **Data minimization:** Collection is limited to information necessary for identified purposes. Configurable retention policies ensure data is retained only as long as necessary.
- **Data accuracy:** Validation rules ensure completeness and correctness at submission.
- **Security safeguards:** Reasonable security measures protect personal information from unauthorized access, collection, use, disclosure, copying, modification, disposal, or destruction.
- **Data residency:** Canadian hosting (ca-central-1) for all primary data stores (see Section 1.1).
- **Access controls:** Role-based and field-level access controls protect PII.
- **Retention controls:** Retention policies and legal holds support data minimization and regulatory compliance.

**Privacy Officer:** Austin Wallace (Delivery Lead) is designated as Privacy Officer responsible for PIPA/PIPEDA compliance. The Privacy Officer has access to all information related to personal data processing and will coordinate with viaSport on privacy impact assessments, data handling procedures, and incident response.

**Evaluation Environment (Jan 2026):**

- Canadian hosting region (ca-central-1) for all primary data stores (see Section 1.1).
- AES-256 encryption via AWS KMS for RDS and S3 (encryption at rest).
- Sensitive authentication fields (e.g., TOTP secrets, backup codes) encrypted before database storage using application-level symmetric encryption with secrets managed in AWS Secrets Manager.
- TLS 1.2+ for all client-server and server-database connections (encryption in transit).
- Retention enforcement and legal hold tooling.
- CloudTrail API audit logging with CIS Benchmark alarms (root usage, IAM changes, security group changes).

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Provide compliance artifacts as noted in Section 1.2 (Security Model Summary).

**Evidence:** Evidence is summarized in Section 1.2.

## SEC-AGG-004: Audit Trail and Data Lineage

**Requirement:**

The system shall maintain an immutable audit log of user actions, data changes, authentication events, and administrative configurations, supporting forensic review and regulatory reporting.

**Acceptance Criteria:**

Auditors can filter logs by user or record ID and export results; tamper-evident hashing verifies integrity of log entries.

**How We Meet It:**

- Audit log records user actions, auth events, and admin changes.
- Hash chain verification detects tampering: each log entry hashes the previous entry, creating a tamper-evident trail. Archived logs are stored with S3 Object Lock (immutable storage) for long-term integrity.
- Admins can filter and export logs.

**Evaluation Environment (Jan 2026):**

- Append-only audit log with hash chain verification.
- Export and filter UI for audit logs.
- Audit log archives stored in S3 Deep Archive.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Continue to validate audit integrity during UAT and provide evidence as noted in Section 1.2.

**Evidence:** Evidence is summarized in Section 1.2.

---

# System Requirements: Training and Onboarding (TO-AGG)

## Compliance Summary

| Req ID     | Title                            | Status                                       | Evaluation Environment (Jan 2026)     | Finalization Scope                                |
| :--------- | :------------------------------- | :------------------------------------------- | :------------------------------------ | :------------------------------------------------ |
| TO-AGG-001 | Template Support and Integration | Implemented; Requires viaSport Configuration | Template hub with preview, versioning | viaSport templates content                        |
| TO-AGG-002 | Guided Learning and Walkthroughs | Implemented; Requires viaSport Configuration | Auto-launch tours, progress tracking  | Final content review (confirmed during Discovery) |
| TO-AGG-003 | Reference Materials and Support  | Implemented; Requires viaSport Configuration | Role-scoped help, support with SLA    | Content refinement with viaSport                  |

## TO-AGG-001: Template Support and Integration

**Requirement:**

The system shall provide a centralized templates tab and offer contextual template access directly from each data entry item to guide users through required formats.

**Acceptance Criteria:**

Users can easily locate and access the correct template when needed.

**How We Meet It:**

- Templates hub centralizes all templates in one location.
- Contextual links surface templates from forms, imports, and reporting.
- Templates are tagged by context for search and filtering.

**Evaluation Environment (Jan 2026):**

- Templates hub UI with inline preview URLs and version grouping.
- Admin panel to manage global and organization templates.
- Contextual links on form detail pages with preview/download actions.
- Template shortcuts surfaced on form, reporting, and import screens.

**Finalization Scope:**

- viaSport specific templates and sample data (confirmed during Discovery).

**viaSport Dependencies:**

- Template content and formatting requirements.

**Approach:** Collect templates during Discovery and load into the hub prior to UAT.

**Evidence:** Evidence is summarized in Section 1.3.

## TO-AGG-002: Guided Learning and Walkthroughs

**Requirement:**

The system shall offer onboarding and data upload tutorials to help users navigate key processes, especially during their first-time use.

**Acceptance Criteria:**

Users can complete tasks independently with support from walkthroughs.

**How We Meet It:**

- Guided walkthroughs highlight key UI elements.
- Tutorials cover onboarding and data upload workflows.
- Progress tracking allows users to resume or restart.

**Evaluation Environment (Jan 2026):**

- Onboarding tour auto-launches after first organization selection when no prior progress exists.
- Guided tours for onboarding and data upload with restart controls.
- Tutorial panel with progress tracking and dismissal.
- Contextual launch points on portal pages.

**Finalization Scope:**

- Final content review with viaSport stakeholders (confirmed during Discovery).

**Approach:** Refine tutorial copy and steps during Discovery and UAT.

**Evidence:** Evidence is summarized in Section 1.3.

## TO-AGG-003: Reference Materials and Support

**Requirement:**

The system shall provide categorized guides and a frequently asked questions (FAQ) section to help users resolve issues and understand system functionality.

**Acceptance Criteria:**

Users can find accurate answers and instructional material without needing direct support.

**How We Meet It:**

- Help center organizes guides by role and category.
- FAQ entries surface common questions.
- Search filters content by keyword.

**Evaluation Environment (Jan 2026):**

- Help center with searchable guides and FAQ.
- Role-scoped content with audience badges visible to users.
- In-app support requests with priority selection, SLA targets, and response notifications.

**Finalization Scope:**

- Content refinement based on viaSport terminology (confirmed during Discovery).

**Approach:** Review help content during Discovery and incorporate viaSport feedback.

**Evidence:** Evidence is summarized in Section 1.3.

---

# System Requirements: User Interface (UI-AGG)

## Compliance Summary

| Req ID     | Title                                   | Status                                       | Evaluation Environment (Jan 2026)         | Finalization Scope              |
| :--------- | :-------------------------------------- | :------------------------------------------- | :---------------------------------------- | :------------------------------ |
| UI-AGG-001 | User Access and Account Control         | Implemented (Demoable Now)                   | Login, MFA, recovery, RBAC                | None                            |
| UI-AGG-002 | Personalized Dashboard                  | Implemented (Demoable Now)                   | Role-aware dashboards                     | None                            |
| UI-AGG-003 | Responsive and Inclusive Design         | Implemented (Demoable Now)                   | Responsive UI and accessibility           | None                            |
| UI-AGG-004 | Task and Notification Management        | Implemented (Demoable Now)                   | Automated reminders and notifications     | None                            |
| UI-AGG-005 | Content Navigation and Interaction      | Implemented (Demoable Now)                   | Search, filtering, command palette        | None                            |
| UI-AGG-006 | User Support and Feedback Mechanism     | Implemented (Demoable Now)                   | Support with priority, SLA, notifications | None                            |
| UI-AGG-007 | Consistent Visual Language and Branding | Implemented; Requires viaSport Configuration | Design system and tenant branding         | viaSport branding configuration |

## UI-AGG-001: User Access and Account Control

**Requirement:**

The system shall support secure login/logout (MFA), individual and organizational account registration, account recovery, and system administrator account management with role-based access.

**Acceptance Criteria:**

Users and system admin can perform account-related tasks securely.

**How We Meet It:**

- Secure login with MFA and session management.
- Password recovery via time-limited tokens.
- Admin tools for user management and role assignment.

**Evaluation Environment (Jan 2026):**

- MFA enrollment and recovery flows.
- Organization invite and join request workflows.
- Admin settings panel for user access management.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Validate account flows during UAT and incorporate viaSport policy guidance.

**Evidence:** Evidence is summarized in Section 1.3.

## UI-AGG-002: Personalized Dashboard

**Requirement:**

The system shall provide the capability to create personalized dashboard for each user role, summarizing relevant data, actions, and reporting progress.

**Acceptance Criteria:**

Users can view personalized dashboards based on their roles.

**How We Meet It:**

- Dashboards show different cards and metrics by role.
- Reporting status and tasks surface at the top of the portal.
- Admin dashboards include cross-org visibility.

**Evaluation Environment (Jan 2026):**

- Role-aware portal dashboard.
- Reporting status and overdue indicators.
- Quick actions for forms, analytics, and imports.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Refine dashboard widgets based on viaSport priorities.

**Evidence:** Evidence is summarized in Section 1.3.

## UI-AGG-003: Responsive and Inclusive Design

**Requirement:**

The system shall provide a responsive interface across devices and include accessibility features such as screen reader compatibility, color contrast tools, and etc.

**Acceptance Criteria:**

System is functional on all devices and meets accessibility compliance.

**How We Meet It:**

- **Mobile-first layout** with responsive breakpoints for desktop, tablet, and mobile.
- **WCAG 2.1 Level AA compliance** validated through automated Axe-core testing in CI.
- **Keyboard accessibility throughout:**
  - Skip navigation links ("Skip to main content", "Skip to navigation")
  - Focus management on route changes (focus moves to main content for screen reader users)
  - All interactive elements reachable via Tab navigation
  - Drag-and-drop alternatives: Pivot builder and dashboard widgets offer button-based manipulation mode for keyboard users
- **Screen reader support:**
  - Live region announcements for toasts, form errors, and step changes
  - Form error summary component auto-focuses and provides clickable links to error fields
  - "View data table" toggle provides accessible alternative to charts
  - Semantic HTML with proper heading hierarchy and ARIA landmarks
- **Visual accessibility:**
  - High Contrast (WCAG) color scheme option for charts (3:1+ minimum contrast)
  - Visible focus indicators (ring-3 pattern) on all interactive elements
  - Reduced motion support via `prefers-reduced-motion` media query

**Evaluation Environment (Jan 2026):**

- Responsive portal and admin screens.
- A11y scan completed and recorded.
- Keyboard navigation and accessible components across workflows.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Continue to validate accessibility during UAT.

**Evidence:** Evidence is summarized in Section 1.3.

## UI-AGG-004: Task and Notification Management

**Requirement:**

The system shall enable automated and customizable notification messages and task reminders that alert users of pending actions and updates, both on the platform and via email.

**Acceptance Criteria:**

Users receive timely and relevant notifications and reminders.

**How We Meet It:**

- Scheduled reminders are generated from reporting tasks.
- In-app notifications surface updates and status changes.
- Email delivery uses AWS SES with delivery logging.

**Evaluation Environment (Jan 2026):**

- Notification scheduler and in-app notification feed.
- Email delivery with SES logging.
- Reminder cadence configurable per task.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Tune reminder cadence with viaSport during Discovery.

**Evidence:** Evidence is summarized in Section 1.3.

## UI-AGG-005: Content Navigation and Interaction

**Requirement:**

The system shall allow users to efficiently locate and interact with information using validated categorization, search and filtering capabilities.

**Acceptance Criteria:**

Users can retrieve accurate results through search and filter functions.

**How We Meet It:**

- Global search and command palette support quick navigation.
- List views include filtering, sorting, and pagination.
- Data catalog and template hubs provide structured categorization.

**Evaluation Environment (Jan 2026):**

- Command palette with actions and global search results.
- List filtering and sorting across forms, templates, and reporting.
- Data catalog and templates hub.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Expand search datasets as viaSport priorities are defined.

**Evidence:** Evidence is summarized in Section 1.3.

## UI-AGG-006: User Support and Feedback Mechanism

**Requirement:**

The system shall enable users to submit support inquiries and feedback and allow administrators to respond through a managed interface.

**Acceptance Criteria:**

Users can submit and receive responses to inquiries within the system.

**How We Meet It:**

- Support requests are submitted in-app with category and priority.
- Admin panel manages responses and status updates.
- Users receive email and in-app updates on responses.

**Evaluation Environment (Jan 2026):**

- Support request form with attachments, priority selection (Low/Normal/High/Urgent), and SLA targets.
- Admin support queue with status tracking and response form.
- Response and status changes dispatch in-app and email notifications.
- Audit logging for support actions.

**Finalization Scope:**

- None. Fully implemented.

**Approach:** Confirm SLA targets and escalation rules with viaSport.

**Evidence:** Evidence is summarized in Section 1.3.

## UI-AGG-007: Consistent Visual Language and Branding

**Requirement:**

The system shall maintain a consistent design style, color scheme, and branding across all modules.

**Acceptance Criteria:**

All UI components follow a standardized visual style.

**How We Meet It:**

- Design system components are shared across all screens.
- Tenant branding supports logo and color configuration.
- Typography, spacing, and iconography are standardized.

**Evaluation Environment (Jan 2026):**

- shadcn/ui component system applied across the portal.
- Tenant branding configuration available in admin settings.
- Consistent navigation and layout patterns.

**Finalization Scope:**

- viaSport branding assets and theme configuration (confirmed during Discovery).

**viaSport Dependencies:**

- Logo, color palette, and typography guidance.

**Approach:** Apply viaSport branding during Discovery and validate in UAT.

**Evidence:** Evidence is summarized in Section 1.3.

---

# Capabilities and Experience

## Demonstrated Success Delivering Similar Systems

Austin Wallace Tech brings experience delivering information systems in sports and data-intensive environments. For project-based delivery examples, see **Relevant Delivery Portfolio** in Vendor Fit to viaSport's Needs.

### The Solstice Prototype as Proof

The most relevant evidence is the Solstice prototype itself, built for viaSport requirements.

| Metric                | Value                                                                                                   |
| :-------------------- | :------------------------------------------------------------------------------------------------------ |
| Requirements coverage | 25 of 25 (100%) System Requirements Addendum items implemented                                          |
| Load testing          | 20M rows, p95 162ms, 25 concurrent users, 0 server errors                                               |
| Server errors         | Zero under concurrent load                                                                              |
| Test coverage         | Automated test suite covering core workflows (login, submission, import, export, RBAC, audit integrity) |
| Accessibility         | WCAG 2.1 Level AA compliance, Axe-core automated testing in CI, Lighthouse Accessibility 100/100        |

## Delivery and Advisory Team

### Delivery Lead

| Role                              | Name           | Responsibilities                                                 | Status    |
| :-------------------------------- | :------------- | :--------------------------------------------------------------- | :-------- |
| Project Lead / Solution Architect | Austin Wallace | Architecture, data engineering, development, delivery governance | Committed |

### Advisory Partners

| Focus Area                  | Name            | Contribution                                  | Status    |
| :-------------------------- | :-------------- | :-------------------------------------------- | :-------- |
| UX and Accessibility        | Ruslan Hétu     | UX research lead, design, accessibility       | Committed |
| Sport Sector / Navigator    | Soleil Heaney   | System navigator connecting team to PSO needs | Committed |
| Technical Architecture      | Will Siddall    | Architecture review and development support   | Committed |
| Security and Risk           | Parul Kharub    | Security strategy and risk advisory           | Committed |
| Security and Infrastructure | Michael Casinha | Infrastructure security review                | Committed |
| Security and Compliance     | Tyler Piller    | Security operations and compliance validation | Committed |

### Oversight Mechanisms

- Daily coordination on implementation priorities
- Weekly deliverable reviews
- Code review required for all changes
- Security sign-off for auth and access control changes
- Direct accountability to viaSport with no organizational layers

### Accessibility Expertise

Ruslan Hétu leads UX research and accessibility validation with 6 years of experience in inclusive design. The team's accessibility approach includes:

- **Automated validation:** Axe-core accessibility tests run on every commit in CI
- **Manual verification:** Keyboard navigation, screen reader compatibility, and focus management testing
- **Inclusive design patterns:** Alternative interaction modes (button vs drag), data table alternatives for charts, form error summaries with field links

### Continuity of Services

Continuity is supported by:

- Infrastructure as code (SST)
- Automated testing and CI
- Operational runbooks and documentation
- Principal-led delivery continuity

## Relevant Non-Profit, Public Sector, and Sport Clients

### Sport Sector Experience

| Organization                        | Relationship              | Scope                                                                           |
| :---------------------------------- | :------------------------ | :------------------------------------------------------------------------------ |
| International Quidditch Association | Chair, Board of Directors | Led governance, data, and technology strategy for 30+ national governing bodies |
| Volunteer Media Organization        | CEO                       | Managed operations for a 70-person volunteer organization                       |

### Public and Enterprise Experience

| Team Member    | Organization                           | Sector                                    |
| :------------- | :------------------------------------- | :---------------------------------------- |
| Austin Wallace | Teck Resources                         | Publicly traded resource sector           |
| Austin Wallace | Clio                                   | Legal technology, public interest clients |
| Parul Kharub   | Canadian Border Services Agency (CBSA) | Federal Law Enforcement Agency            |
| Will Siddall   | Teck Resources                         | Publicly traded resource sector           |

## Case Studies

### Primary Case Study: Solstice Platform (viaSport)

**Context:** viaSport requires replacement of BCAR and BCSI with a modern information system.

**Approach:** Deliver a prototype that meets the System Requirements Addendum and demonstrate performance at scale.

**Deliverables:**

- Data submission portal with form builder and file uploads
- Native analytics with pivots, charts, and export
- Role-based access control and organization scoping
- MFA, anomaly detection, and tamper-evident audit logs
- Import tooling with mapping, validation, preview, rollback
- Guided walkthroughs and help center

**Results:**

- 20M rows tested, p95 162ms (25 concurrent users)
- Zero server errors under concurrent load
- Prototype available for evaluator validation

### Supporting Case Study: Qdrill

A production training application used by competitive athletes, including Team Canada. Demonstrates ability to ship and operate a real user-facing sports application.

### Supporting Case Study: New Jersey Devils Data Platform

Processed 10 million rows per game for NHL tracking data and supported multi-million dollar decision making.

## Automation and AI

### Automation (Production-Ready)

| Feature                 | Schedule        | Purpose                                     |
| :---------------------- | :-------------- | :------------------------------------------ |
| Scheduled notifications | Every 5 minutes | Process reminder and alert queue            |
| Retention enforcement   | Daily           | Archive and purge data per policy           |
| Data quality monitoring | Daily           | Detect missing fields and validation errors |
| Batch import worker     | On demand       | Process large imports with checkpointing    |
| Health monitoring       | On demand       | Service health checks with alerts           |

### AI Enablement Foundation (Built)

Austin Wallace Tech (AWT) provides a pre-configured AI infrastructure within the Solstice platform, designed to enhance data quality and reporting efficiency without compromising viaSport's data residency or governance requirements. The AI foundation is fully implemented in the current prototype and resides exclusively within the AWS Canada (Central) region. This infrastructure includes:

| Component                    | Description                                                                                                                            |
| :--------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| AWS Bedrock integration      | Foundation models via AWS Bedrock in ca-central-1                                                                                      |
| Central AI service           | Unified interface with retries, timeouts, and error handling                                                                           |
| Prompt template registry     | Versioned prompts with audit trail and rollback capability                                                                             |
| Structured output validation | Zod schema validation ensuring AI responses match expected formats                                                                     |
| Usage logging and costs      | Per-request tracking of tokens, latency, cost estimates by org and user. Usage reports/exports available to viaSport for auditability. |
| Quota enforcement            | Rate limiting and budget controls per tenant and user                                                                                  |
| Embedding support            | Amazon Titan embeddings for semantic search                                                                                            |

AI features use AWS Bedrock hosted in AWS Canada (Central) (ca-central-1). We log per-request token usage, latency, and cost estimates by organization/user for auditability, and we can provide usage reports/exports to viaSport. No AI provider outside Canada will be used without explicit written authorization from viaSport, and viaSport data will not be used for model fine-tuning/training without explicit written approval.

### AI Feature Candidates

The following AI feature candidates are available for prioritization with viaSport. AI features are optional modules enabled only with explicit governance decisions. During Discovery, we will conduct UX research with viaSport staff and PSO representatives to determine which features deliver the highest value.

| Feature                  | Description                                                                                   | Target Users         | Value                                   |
| :----------------------- | :-------------------------------------------------------------------------------------------- | :------------------- | :-------------------------------------- |
| AI report narratives     | Generate natural language summaries from analytics dashboards for board reports and briefings | viaSport admins      | Reduce manual report writing by 60-80%  |
| Natural language query   | Ask questions in plain English and receive structured answers from the data warehouse         | viaSport admins, PSO | Self-service analytics without SQL      |
| AI dashboard builder     | Describe a visualization in words and generate chart configurations automatically             | viaSport admins      | Faster dashboard creation               |
| Semantic document search | Search submissions and documents by meaning rather than exact keywords                        | All users            | Find relevant records faster            |
| Data quality AI          | Detect anomalies and outliers in submissions with plain-language explanations                 | viaSport admins      | Catch errors before they affect reports |
| Submission assistant     | Contextual guidance and suggestions while completing forms based on historical patterns       | PSO staff            | Reduce submission errors and rework     |

### Prioritization Approach

AI features will not be enabled without user research. Our approach:

1. **Discovery interviews** with viaSport staff and PSO representatives to understand pain points
2. **Value mapping** to identify which features address the highest-impact workflows
3. **Prototype testing** of prioritized features with real users before production release
4. **Iterative rollout** starting with the highest-value feature, gathering feedback before expanding

The foundation work is complete. We will implement the AI features that drive real value for viaSport and PSOs based on what we learn during research.

## Responsible AI Governance

| Principle                | Implementation                                                                                       |
| :----------------------- | :--------------------------------------------------------------------------------------------------- |
| Transparency             | All AI-generated content is clearly labeled; users see when AI assisted                              |
| Human-in-the-loop        | AI outputs require human review before publishing or external sharing                                |
| Privacy by design        | No PII in prompts; data aggregated or anonymized before AI processing                                |
| No unauthorized training | viaSport data is never used for model training without explicit consent                              |
| Bias mitigation          | Regular review of AI outputs for demographic or organizational bias                                  |
| Audit trail              | All AI requests logged with prompt version, user, timestamp, and response characteristics            |
| Data residency           | AWS Bedrock in ca-central-1 only; no non-Canadian AI providers without written consent from viaSport |

## Open Standards, APIs, and Open Source

### Open Standards

- TOTP (RFC 6238\) for MFA
- CSV and Excel for import and export
- JSON for data interchange
- TLS 1.2+ for transport security
- AES-256 for encryption at rest

### APIs

Internal APIs are structured for extension. External integrations will be scoped with viaSport during Discovery.

### Open Source Foundations

| Layer          | Technologies                                                 |
| :------------- | :----------------------------------------------------------- |
| Frontend       | React 19, TanStack Start, TypeScript, Radix UI, Tailwind CSS |
| Backend        | TanStack Start, Node.js, Drizzle ORM                         |
| Database       | PostgreSQL                                                   |
| Infrastructure | SST                                                          |
| Testing        | Vitest, Playwright, Testing Library                          |
| Validation     | Zod                                                          |

The application code is proprietary to Austin Wallace Tech, with source access available under mutually agreed terms.

---

# Commercial Model and Pricing

## Procurement Structure

Austin Wallace Tech proposes Solstice as a **3-year base term subscription** with two optional 1-year extensions at viaSport's discretion (3+1+1). This structure avoids a separate annual RFP for operations and provides predictable multi-year budgeting.

## Pricing Summary

| Component                                         | Price           | Notes                                                                                                  |
| :------------------------------------------------ | :-------------- | :----------------------------------------------------------------------------------------------------- |
| Implementation Cost                               | $600,000        | Discovery, configuration, migration, UAT support, training, rollout, go-live/hypercare                 |
| Platform Subscription \+ Managed Service (annual) | $200,000 / year | Hosting, monitoring, patching, support, reliability management, product updates, 200 enhancement hours |

## Total Cost View

| Term                                   | Total      |
| :------------------------------------- | :--------- |
| 3-year base term                       | $1,200,000 |
| 5-year total (if extensions exercised) | $1,600,000 |

## What is Included

### Cost Element Breakdown

| Cost Element                               | Included In    | Notes                                         |
| :----------------------------------------- | :------------- | :-------------------------------------------- |
| Discovery + UX research                    | Implementation | Interviews, IA testing, prototypes            |
| Configuration (forms, templates, metadata) | Implementation | viaSport-specific setup                       |
| Migration implementation                   | Implementation | Mapping templates, pilot + phased waves       |
| Training materials + sessions              | Implementation | Cohorts finalized with viaSport               |
| UAT support + hypercare                    | Implementation | Defect remediation, go-live support           |
| Hosting \+ monitoring                      | Subscription   | AWS infrastructure, logging, on-call response |
| Security patching \+ dependency updates    | Subscription   | Monthly \+ expedited for critical vulns       |
| Support channels                           | Subscription   | In-app \+ email with SLA-based response       |
| DR exercises \+ backups                    | Subscription   | Quarterly validation, 35-day retention        |
| Enhancement hours (200/year)               | Subscription   | Feature requests, configuration changes       |

### Implementation Cost

- Discovery and requirements confirmation against the prototype
- viaSport-specific configuration (forms, templates, metadata, branding)
- Legacy data extraction approach, pilot migration, full migration, and reconciliation
- UAT support and defect remediation
- Training delivery (viaSport admin, train-the-trainer, PSO rollout enablement)
- Go-live support and defined hypercare period

### Platform Subscription \+ Managed Service

- Canadian-hosted production infrastructure and routine operations
- Monitoring, alerting, and incident response coordination
- Security patching and dependency updates
- Routine backups and quarterly DR exercises (results reported to viaSport)
- Support channels (in-app and email) with severity-based response targets
- Ongoing product updates and non-custom feature improvements
- **200 hours per year** for enhancements, minor feature requests, and configuration changes

## Enhancements and Change Requests

viaSport will have evolving needs. The subscription includes **200 hours per year** for enhancements, minor feature requests, and configuration changes beyond routine operations.

Additional work beyond the included hours is available at **$175/hour** with prior approval. A change control process ensures transparency:

1. Change request submitted
2. Impact assessment (scope, timeline, hours)
3. Proposal with options
4. Mutual agreement documented
5. Work proceeds after sign-off

## Payment Schedule

| Milestone        | Percentage | Amount   | Trigger                          |
| :--------------- | :--------- | :------- | :------------------------------- |
| Contract Signing | 25%        | $150,000 | Signed agreement                 |
| UAT Sign-Off     | 25%        | $150,000 | User acceptance testing complete |
| Go-Live          | 50%        | $300,000 | Production deployment            |

Annual subscriptions are billed quarterly in advance ($50,000 per quarter).

## Factors That Do Not Trigger Price Adjustments

- Normal data volume growth within PostgreSQL capacity
- Standard security updates and patches
- Configuration changes within existing features
- Work within the included 200 enhancement hours

## Factors That May Trigger Cost Adjustments

The following scope changes may require adjustment to pricing or timeline:

- Net-new integrations or real-time API requirements beyond agreed scope
- Mandatory SSO integration at launch (depends on IdP and coordination effort)
- Material increase in migration scope (attachment volume, additional legacy systems)
- 24/7 response coverage (optional add-on, already priced below)
- Third-party penetration testing (optional add-on, already priced below)

Any scope changes will be handled through the change control process described above, with transparent impact assessment before proceeding.

## Renewal and Price Protection

Renewal years can be priced:

- At the same annual rate ($200,000), or
- With a mutually agreed inflation cap (e.g., CPI-capped adjustments)

Renewal terms will be discussed no later than 90 days before the end of each contract year.

## Optional Risk Reduction: Exit and Continuity

To reduce vendor risk, viaSport may select from the following continuity options:

| Option                              | Description                                                                                                              | Included                    |
| :---------------------------------- | :----------------------------------------------------------------------------------------------------------------------- | :-------------------------- |
| Data portability \+ runbooks        | Full data export (CSV, JSON, database dump) plus operational runbooks                                                    | Baseline (included)         |
| Source code escrow                  | Source code deposited with escrow agent, released upon defined trigger conditions (insolvency, failure to support, etc.) | Optional                    |
| Perpetual license to customizations | At end of contract, viaSport receives perpetual license to viaSport-specific configuration and customizations            | Optional                    |
| Transition support                  | Support for transition to a replacement system if viaSport chooses not to renew                                          | Available at standard rates |

Details on escrow and perpetual license options are provided in the Exit and Portability Appendix.

## Optional Add-Ons

### Third-Party Penetration Testing

**Estimated:** $10,000 to $20,000 per assessment

Independent penetration testing by a qualified third-party security firm. Can be scheduled pre-go-live or annually. Austin Wallace Tech coordinates with the testing firm and remediates findings.

### Extended Support Coverage (24/7)

**Estimated:** $30,000 to $50,000 per year additional

Adds after-hours monitoring and response outside business hours. After-hours Sev 1 response target: 2 hours (with 24/7 add-on).

### Operations Portal (Events and Team Management)

**Estimated:** $50,000 to $100,000 implementation, plus ongoing support

The Solstice platform includes an operations portal used by Quadball Canada. This could be extended to viaSport and PSOs to unify reporting and operations.

## Pricing Philosophy

Pricing is based on the 30-week delivery plan described in **Project Plan, Timeline, and Delivery Schedule**.

- The **one-time implementation** covers discovery, viaSport configuration, migration execution and reconciliation, UAT support, training, rollout, and go-live/hypercare to operationalize the existing baseline.
- The **annual subscription + managed service** covers hosting, monitoring, support, security patching, backups/DR validation, ongoing product updates, and 200 hours/year of enhancement capacity.

---

# Project Plan, Timeline, and Delivery Schedule

## Timeline and Milestones

Austin Wallace Tech proposes a 30-week implementation timeline targeting Fall 2026 launch. While the Solstice core platform is functional today, this timeline ensures the transition from legacy systems (BCAR/BCSI) to the new environment is smooth, compliant, and widely adopted by the PSO community.

| Phase                         | Duration | Key Activities                                                                      | Milestone           |
| :---------------------------- | :------- | :---------------------------------------------------------------------------------- | :------------------ |
| Discovery and Research        | 6 weeks  | User research, user observation sessions, legacy system analysis                    | Research Synthesis  |
| Information Architecture (IA) | 4 weeks  | User-driven categorization exercises, navigation validation testing                 | IA Approval         |
| Design and Prototyping        | 8 weeks  | Wireframes, high-fidelity design, interactive prototyping                           | Design Finalization |
| User Acceptance Testing       | 4 weeks  | Usability testing, accessibility validation, Assistive Technology (AT) user testing | UAT Sign-Off        |
| Remediation and Refinement    | 4 weeks  | Address UAT findings, design QA, launch preparation                                 | Launch Approval     |
| Training and Launch           | 4 weeks  | Training materials, soft launch, phased rollout                                     | Full Rollout        |

**Total Duration:** 30 weeks

**Target Dates:**

- Project Start: Upon contract award (estimated Q1 2026)
- Soft Launch: Week 29 (pilot cohort)
- Full Rollout: Week 30 (Fall 2026\)

### Why This Timeline

- **Privacy and Legislative Alignment:** Early weeks support viaSport's Privacy Impact Assessment (PIA) and security review processes, ensuring system configuration meets FOIPPA requirements
- **Legacy Data Integrity:** Migrating ~20M rows requires rigorous mapping and validation to prevent data loss or corruption during the transition from BCAR/BCSI
- **Community-Wide Adoption:** UX research and community liaison (led by our System Navigator) ensures the interface reflects actual PSO workflows, reducing post-launch support volume

The timeline reflects our commitment to getting the user experience right. The baseline system already implements the requirement set, so project time focuses on:

- **Proper user research** with viaSport staff and PSO representatives across British Columbia
- **Community-informed design** with Soleil Heaney as system navigator connecting the team to sport sector needs
- **Accessibility validation** including assistive technology user testing
- **Phased rollout** with pilot cohorts before full deployment

| Phase                       | Status           | Remaining Work                        |
| :-------------------------- | :--------------- | :------------------------------------ |
| Architecture                | Complete         | None                                  |
| Authentication and Security | Complete         | Production hardening                  |
| Core Features               | Largely complete | UX refinements per community research |
| Analytics Platform          | Complete         | Dataset tuning with viaSport          |
| Migration Tooling           | Complete         | Extraction from BCAR and BCSI         |

## Phase Details

**Phase 1: Discovery and Research (Weeks 1-6)**

- Finalize UX team engagement and research protocols
- Stakeholder alignment workshop with viaSport
- User observation sessions in work environment (12-15 participants)
- User research interviews (15-20 participants)
- Diary studies during actual reporting periods (6-8 participants)
- Legacy system analytics audit (support tickets, usage patterns)
- Migration discovery (legacy access, schema documentation)
- Brand asset collection

**Deliverables:** User personas, current-state journey maps, research synthesis report, design principles

**Milestone:** Week 6 \- Research Findings Presentation

**Phase 2: Information Architecture (Weeks 7-10)**

- User-driven categorization exercises to inform navigation (25-30 participants)
- Analysis and navigation structure options
- Navigation validation testing with 2-3 navigation variants (25-30 participants)
- Findability measurement and label refinement
- Information Architecture (IA) documentation and stakeholder review
- Migration mapping and transformation begins

**Deliverables:** Validated navigation taxonomy, site map with role-based views, findability report

**Milestone:** Week 10 - Information Architecture (IA) Approval Gate

**Phase 3: Design and Prototyping (Weeks 11-18)**

- Low-fidelity wireframes for priority screens (\~25-30 screens)
- Core workflow mapping
- viaSport branding application
- Design system expansion (components, patterns, tokens)
- High-fidelity mockups for core modules
- Interactive design prototyping with working interactions
- Edge cases, error states, empty states
- Data migration execution with validation
- Production environment preparation

**Deliverables:** High-fidelity designs, interactive prototype, design system documentation, development handoff specifications

**Milestone:** Week 18 - Design Finalization and UAT Ready

**Phase 4: User Acceptance Testing (Weeks 19-22)**

- UAT preparation and test scenario finalization
- Participant recruitment (10-12 users across roles)
- Moderated usability testing sessions (60 min each)
- System Usability Scale (SUS) measurement
- Accessibility validation:
  - Axe-core automated scans for WCAG 2.1 Level AA compliance
  - Keyboard navigation testing (skip links, focus management, tab order)
  - Assistive Technology (AT) testing with 3-5 users:
    - Screen reader users (NVDA, VoiceOver)
    - Keyboard-only users
  - Alternative interaction mode validation (button vs drag in pivot builder)
- Quantitative and qualitative analysis
- Prioritized recommendations

**Deliverables:** UAT Report, prioritized remediation backlog, success metrics baseline, accessibility validation

**Milestone:** Week 22 \- Remediation Planning Workshop

**Phase 5: Remediation and Refinement (Weeks 23-26)**

- Fix critical and high-severity issues
- Design refinements based on feedback
- Accessibility remediations
- Development QA and regression testing
- Final validation and launch readiness assessment

**Deliverables:** Remediated design and implementation, regression test results, launch readiness recommendation

**Milestone:** Week 26 \- Launch Approval Gate

**Phase 6: Training and Launch (Weeks 27-30)**

- Training material finalization
- Video tutorial production
- Help center content review
- Train-the-trainer preparation
- Soft launch with pilot cohort (10-15 PSOs)
- Intensive monitoring and rapid response
- Full rollout with phased PSO onboarding
- Legacy systems archived

**Deliverables:** Training materials package, launch monitoring plan, post-launch UX roadmap

See **Service Approach: Data Migration** for the detailed cutover plan, including data freeze window, hypercare period, and rollback criteria.

## Governance and Communications

### Communication Cadence

| Frequency | Participants                                | Purpose                           |
| :-------- | :------------------------------------------ | :-------------------------------- |
| Weekly    | Austin Wallace and viaSport Project Manager | Status updates and blockers       |
| Bi-weekly | Steering committee                          | Milestone review and escalations  |
| As needed | Technical stakeholders                      | UX reviews and migration planning |
| Monthly   | Research readouts                           | Share findings with broader team  |

### Reporting

viaSport will receive:

- Weekly status reports
- Research synthesis reports at phase gates
- Milestone completion reports with sign-off
- Defect status reports during UAT
- Post-go-live support reports (monthly)

### Decision-Making

| Decision Type              | Authority                         |
| :------------------------- | :-------------------------------- |
| Day-to-day implementation  | Austin Wallace                    |
| Requirements clarification | viaSport Project Manager          |
| UX research direction      | Ruslan Hétu with viaSport input   |
| Scope changes              | Mutual agreement via change order |
| Go-live readiness          | viaSport Project Sponsor          |

## Risks, Assumptions, and Dependencies

### Dependencies on viaSport

| Dependency                               | Timing      | Impact if Delayed           |
| :--------------------------------------- | :---------- | :-------------------------- |
| Legacy data access                       | Week 1      | Migration timeline at risk  |
| Brand assets                             | Week 11     | Branding work delayed       |
| Subject Matter Expert (SME) availability | Weeks 1-6   | Research quality reduced    |
| Research participants                    | Weeks 1-10  | User research scope limited |
| UAT testers                              | Weeks 19-22 | UAT duration extended       |
| PSO coordination                         | Weeks 27-30 | Rollout schedule impacted   |

### Assumptions

- viaSport can provide export capability or schema documentation for BCAR and BCSI
- viaSport staff and PSO representatives are available for research and reviews
- Participants can be recruited for user research sessions (we will work with Soleil as system navigator)
- No major scope changes after design finalization
- PSOs are responsive to onboarding communications

### Risk Register

| Risk                       | Likelihood | Impact | Mitigation                             |
| :------------------------- | :--------- | :----- | :------------------------------------- |
| Legacy data access delayed | Medium     | High   | Begin migration discovery in Week 1    |
| Data quality issues        | Medium     | Medium | Validation tooling and pilot migration |
| Research recruitment slow  | Medium     | Medium | Leverage Soleil's sector relationships |
| viaSport SME availability  | Low        | Medium | Schedule interviews early              |
| Scope creep                | Low        | High   | Weekly check-ins and change control    |
| PSO adoption resistance    | Low        | Medium | Train-the-trainer and PSO champions    |

## Timeline Commitment

The timeline is structured around quality gates (discovery sign-off, IA approval, UAT sign-off, launch readiness) rather than feature build completion. This reflects our assessment based on the existing baseline and the need for user research and collaboration with the sport sector community. We will identify blockers early and communicate any required adjustments.

---

# Appendices

## Appendix A: Prototype Evaluation Access

A working prototype is available for viaSport evaluation in a dedicated UAT environment using synthetic data only.

**Demo URL:** [https://sinuat.solsticeapp.ca](https://sinuat.solsticeapp.ca)

**Environment:** `sin-uat` (User Acceptance Testing environment with evaluator access and CloudTrail monitoring)

### Environment Details

- Synthetic test data only (no confidential viaSport data was used)
- Environment monitoring enabled (CloudTrail with CIS Benchmark alarms)
- Production-equivalent security controls active
- Performance testing is executed separately in `sin-perf`

### Demo Credentials

Credentials are provided below for the evaluation period. **Credentials valid during evaluation period only** and will be rotated after review concludes.

| User                      | Password        | Platform Role  | Org Membership              | Access Scope                      |
| :------------------------ | :-------------- | :------------- | :-------------------------- | :-------------------------------- |
| `viasport-staff@demo.com` | testpassword123 | viaSport Admin | viaSport BC (owner)         | Full access including Analytics   |
| `global-admin@demo.com`   | demopassword123 | Solstice Admin | None                        | Platform admin pages only         |
| `pso-admin@demo.com`      | testpassword123 | None           | BC Hockey (admin)           | BC Hockey org features, Analytics |
| `club-reporter@demo.com`  | testpassword123 | None           | North Shore Club (reporter) | Club reporting, Analytics         |
| `member@demo.com`         | testpassword123 | None           | Vancouver Minor (viewer)    | View-only access (no Analytics)   |

**Recommended starting account:** `viasport-staff@demo.com` provides full access to all platform features.

**MFA:** Disabled on all demo accounts for convenience. To evaluate the MFA capability, navigate to **Settings > Security** to enroll your own authenticator app.

**Rate limiting:** Evaluator-friendly thresholds are configured (approximately 30 login attempts per 15 minutes per account). If you get locked out, email `support@solsticeapp.ca` for immediate unlock.

### Suggested Evaluation Walkthrough

| Step | Action                                                         | Requirement |
| :--: | :------------------------------------------------------------- | :---------- |
|  1   | Login with viasport-staff@demo.com (password: testpassword123) | SEC-AGG-001 |
|  2   | View dashboard and role-based navigation                       | UI-AGG-002  |
|  3   | Admin → Forms → Open a form → Submit test data                 | DM-AGG-001  |
|  4   | Admin → Import → Upload CSV → Map fields → Complete import     | DM-AGG-006  |
|  5   | Admin → Reporting → Create cycle → Assign tasks                | RP-AGG-003  |
|  6   | Analytics → Explore → Build pivot table → Export to CSV        | RP-AGG-005  |
|  7   | Admin → Audit → Filter by date → Verify hash chain             | SEC-AGG-004 |
|  8   | Settings → Security → Enable MFA (optional)                    | SEC-AGG-001 |

For a complete requirement-by-requirement walkthrough, see the **Prototype Evaluation Guide**.

### Video Demonstrations

| ID  | Title                      | Duration | File                                            |
| :-- | :------------------------- | :------- | :---------------------------------------------- |
| V1  | Authentication & MFA Login | 24s      | `SEC-AGG-001-auth-mfa-login-flow-FINAL.mp4`     |
| V2  | Form Submission Workflow   | 29s      | `DM-AGG-001-form-submission-flow-FINAL.mp4`     |
| V3  | Data Import Wizard         | 54s      | `DM-AGG-006-import-wizard-flow-FINAL.mp4`       |
| V4  | Reporting Workflow Cycle   | 10s      | `RP-AGG-003-reporting-workflow-flow-FINAL.mp4`  |
| V5  | Analytics & Export         | 26s      | `RP-AGG-005-analytics-export-flow-FINAL.mp4`    |
| V6  | Audit Trail Verification   | 25s      | `SEC-AGG-004-audit-verification-flow-FINAL.mp4` |

**Primary access:** YouTube links (TBD - to be provided before submission)

**Fallback:** If YouTube is blocked, see `/videos/` folder in the submission ZIP.

### Support During Evaluation

**Email:** support@solsticeapp.ca

**Response time:** Within 4 business hours during evaluation period

**Available support:**

- Account unlock requests
- Technical questions about the platform
- Demo data reset (restores baseline if evaluators change settings)

## Appendix B: System Architecture

### High-Level Architecture

A formatted architecture diagram is provided in the Evidence Pack.

The platform runs entirely in AWS Canada (Central) (ca-central-1) using a serverless architecture: CloudFront CDN for edge delivery, Lambda for application compute, RDS PostgreSQL for the database, S3 for object storage, SQS for message queuing, ElastiCache Redis for caching, EventBridge for scheduling, CloudWatch for monitoring, and SES for email delivery.

### Technology Stack

| Layer          | Technologies                                                 |
| :------------- | :----------------------------------------------------------- |
| Frontend       | React 19, TanStack Start, TypeScript, Radix UI, Tailwind CSS |
| Backend        | TanStack Start, Node.js, Drizzle ORM                         |
| Database       | PostgreSQL on AWS RDS                                        |
| Caching        | Redis for rate limiting, BI caching, permissions             |
| Infrastructure | SST, AWS Lambda, CloudFront, ECS Fargate                     |
| Authentication | Better Auth with TOTP MFA                                    |
| Monitoring     | AWS CloudWatch, CloudTrail                                   |

## Appendix C: Performance Evidence

Load testing was conducted in the sin-perf environment on January 8, 2026. Results: p95 latency of 162ms (target: <500ms), 25 concurrent users, zero server errors.

### Data Volume

| Table            | Rows    |
| :--------------- | :------ |
| audit_logs       | 10.0M   |
| form_submissions | 8.0M    |
| notifications    | 2.0M    |
| **Total**        | **20M** |

### Performance Results

| Metric              | Value      | Target  | Status |
| :------------------ | :--------- | :------ | :----- |
| p95 latency         | 162ms      | \<500ms | Pass   |
| p50 latency         | 98ms       | N/A     | Pass   |
| Concurrent users    | 25         | N/A     | Pass   |
| Throughput          | 12.3 req/s | N/A     | Pass   |
| Server errors (5xx) | 0          | 0       | Pass   |

### Lighthouse Scores

| Metric                   | Value   | Target | Status |
| :----------------------- | :------ | :----- | :----- |
| Performance Score        | 90/100  | \>80   | Pass   |
| First Contentful Paint   | 1.0s    | \<1.8s | Pass   |
| Largest Contentful Paint | 1.0s    | \<2.5s | Pass   |
| Time to Interactive      | 1.1s    | \<3.8s | Pass   |
| Cumulative Layout Shift  | 0       | \<0.1  | Pass   |
| Accessibility Score      | 100/100 | \>90   | Pass   |

### DR Exercise Results (2026-01-08)

| Metric                         | Target   | Achieved | Status |
| :----------------------------- | :------- | :------- | :----- |
| Recovery Point Objective (RPO) | 1 hour   | 0 min    | Pass   |
| Recovery Time Objective (RTO)  | 4 hours  | 16 min   | Pass   |
| Records validated              | 20M rows | 20M rows | Pass   |

## Appendix D: Security Architecture Summary

### Shared Responsibility Model

The security model follows the AWS shared responsibility approach: AWS secures the underlying cloud infrastructure, and we implement and operate the application controls, configuration, and monitoring required for viaSport's use case. AWS compliance reports (SOC, ISO) are available via AWS Artifact upon request.

### Data Residency

Primary data stores (RDS PostgreSQL, S3 object storage, backups, and audit archives) are hosted in AWS Canada (Central) (ca-central-1). Authenticated content is configured to avoid edge caching. Email notifications are sent via AWS Simple Email Service (SES) in AWS Canada (Central) (ca-central-1). Once delivered to recipients, messages may transit or be stored by external email providers outside AWS.

### Encryption

| Scope              | Standard                                       |
| :----------------- | :--------------------------------------------- |
| In Transit         | TLS 1.2+                                       |
| At Rest (Database) | AES-256 via AWS KMS                            |
| At Rest (Storage)  | AES-256 via AWS KMS                            |
| Secrets            | AWS Secrets Manager (SST-managed, deploy-time) |

### Authentication

| Feature                     | Implementation                           |
| :-------------------------- | :--------------------------------------- |
| Multi-Factor Authentication | TOTP with backup codes                   |
| Password Requirements       | Configurable password policy             |
| Session Management          | Secure cookies, configurable expiry      |
| Account Lockout             | Automatic after failed attempt threshold |

### Authorization

| Feature                   | Implementation                            |
| :------------------------ | :---------------------------------------- |
| Role-Based Access Control | Owner, Admin, Reporter, Viewer roles      |
| Organization Scoping      | All queries scoped to user's organization |
| Field-Level Permissions   | Sensitive fields restricted by role       |
| Step-Up Authentication    | Required for admin actions and exports    |

### Audit Trail

| Feature      | Implementation                                                                                                   |
| :----------- | :--------------------------------------------------------------------------------------------------------------- |
| Scope        | All user actions, data changes, auth events                                                                      |
| Immutability | Append-only with hash chain verification; archived to S3 Object Lock (immutable storage) for long-term integrity |
| Retention    | Retention policies and legal holds (durations to be confirmed with viaSport during Discovery)                    |

### Compliance

- PIPEDA aligned data handling practices
- AWS Data Processing Addendum (DPA) in place
- CloudTrail API audit logging with CIS Benchmark alarms (root usage, IAM changes, security group changes)

## Appendix E: User Personas

| Persona        | Portal Access             | Key Capabilities                                    |
| :------------- | :------------------------ | :-------------------------------------------------- |
| viaSport Admin | Full platform             | Admin console, cross-org analytics, user management |
| PSO Admin      | Organization-scoped       | Reporting oversight, user invitations, analytics    |
| PSO Reporter   | Organization-scoped       | Form submission, file uploads, imports              |
| Viewer         | Read-only                 | Dashboard viewing, report access                    |
| Auditor        | Admin console (read-only) | Audit log access, compliance review                 |

## Appendix F: Team Biographies

### Austin Wallace, Project Lead and Solution Architect

Austin Wallace is the delivery lead and solution architect for Solstice. He leads platform architecture, data migration strategy, and delivery governance. He has 9+ years of enterprise data engineering experience and sport governance leadership.

### Ruslan Hétu, UX and Accessibility Lead

Ruslan Hétu is a design and research freelancer with a background in human-centered design and systems thinking. He earned a master's degree in design and has 6 years of experience applying mixed-methods research to public sector projects, healthcare, and startups.

### Soleil Heaney, System Navigator

Soleil Heaney has been involved in the sports industry for 10 years. Her work as the Executive Director with Quadball Canada, Manager of Member Services with BC Soccer, General Manager of Victoria Ultimate and President of several local sports club Boards gives her a practical end-user perspective of the needs of sports governing bodies.

### Will Siddall, Technical Advisor

With 15+ years of development and business consulting experience across many industries, Will is ensuring a stable product can be delivered to customers with a focus on customer collaboration and user experience (UX).

He's designed, delivered, and trained a variety of products for customers of all types and sizes, with most of his experience developing and delivering products to air-gapped environments. Industries he's supported in the past include mining, VFX, hydrography and ocean exploration, oil and gas, civil engineering and cadastral/bathymetric surveys.

### Parul Kharub, Security and Risk Advisor

Parul is the strategic cybersecurity and risk advisor with 16 years of practical experience in Fortune 100 companies across the globe. She also brings experience working with regulators and privacy officers to offer breadth of security, privacy and regulatory coverage.

### Michael Casinha, Security and Infrastructure Advisor

A 30+ year veteran of the dotcom internet era bringing generational lessons of best practices to an agile era of cloud development. Having worked with American Finance, Aviation and Canadian quantum computing startups. All relying on consistent, secure, repeatable development practices learned over years of successful achievements and hard lessons learned.

### Tyler Piller, Security and Compliance Advisor

Tyler Piller is a cybersecurity veteran with over 10 years of experience in operational defense and strategic risk management. He currently directs an Information Security Risk Management program, providing strategic advisory to align technical risk with enterprise business objectives.

## Appendix G: Glossary

| Term | Definition                                                |
| :--- | :-------------------------------------------------------- |
| AT   | Assistive Technology                                      |
| BCAR | BC Activity Reporter, legacy system being replaced        |
| BCSI | BC Sport Information System, legacy system being replaced |
| CIS  | Center for Internet Security                              |
| IA   | Information Architecture                                  |
| MFA  | Multi-Factor Authentication                               |
| PSO  | Provincial Sport Organization                             |
| RBAC | Role-Based Access Control                                 |
| RDS  | Amazon Relational Database Service                        |
| SIN  | Strength in Numbers (project name)                        |
| SME  | Subject Matter Expert                                     |
| SST  | Serverless Stack (infrastructure as code framework)       |
| SUS  | System Usability Scale                                    |
| TOTP | Time-based One-Time Password                              |
| UAT  | User Acceptance Testing                                   |

## Appendix H: Contact Information

**Primary Contact:**

Austin Wallace Project Lead, Austin Wallace Tech Email: [austin@solsticeapp.ca](mailto:austin@solsticeapp.ca) Location: Victoria, British Columbia

Austin Wallace Tech welcomes the opportunity to present the prototype and discuss how Solstice can serve viaSport's Strength in Numbers initiative.

## Appendix I: Evidence Pack

The Evidence Pack provides supporting screenshots from the prototype.

| Evidence Item                   | Description                                  |
| :------------------------------ | :------------------------------------------- |
| 01-prototype-dashboard.png      | Role-based admin dashboard view              |
| 02-audit-log-integrity.png      | Audit log view with integrity verification   |
| 03-import-wizard-validation.png | Import wizard preview and validation results |

## Appendix J: OWASP Top 10:2025 Mapping

Our security testing program maps to the OWASP Top 10 categories:

- **A01: Broken Access Control** \- Attackers bypassing authorization to access other users' data (critical for SEC-AGG-001).
- **A02: Security Misconfiguration** \- Unsecured S3 buckets, default passwords, or overly permissive cloud settings.
- **A03: Software Supply Chain Failures** \- Vulnerabilities in third-party libraries or compromised build pipeline.
- **A04: Cryptographic Failures** \- Weak encryption or plain-text data storage (directly impacts PIPEDA compliance).
- **A05: Injection** \- SQL, NoSQL, or command injection.
- **A06: Insecure Design** \- Architectural flaws that cannot be fixed by coding.
- **A07: Authentication Failures** \- Weak MFA, credential stuffing, or session hijacking (directly impacts SEC-AGG-001).
- **A08: Software and Data Integrity Failures** \- Tampering with updates or data without verification.
- **A09: Security Logging and Alerting Failures** \- Lack of real-time monitoring (directly impacts SEC-AGG-002 and SEC-AGG-004).
- **A10: Mishandling of Exceptional Conditions** \- Error messages that leak sensitive info or systems that fail open.
