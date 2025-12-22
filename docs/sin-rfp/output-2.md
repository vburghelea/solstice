Below is a structured, “RFP-ready” way to reason from what you have today (code + patterns) to what SIN needs for **Bundle 2: Data Collection, Forms & Validation**—and to translate that into a credible requirements response.

I’m going to do three things:

1. **Call out what’s already in place** in this codebase that materially supports the RFP
2. **Define the missing capabilities as RFP deliverables** (with specific UI + data model + APIs)
3. **Map each requirement (DM-AGG-001/002/004/005/006 + RP-AGG-001)** to concrete system behavior, acceptance evidence, and implementation approach

---

## What you already have that’s “real” for the RFP

This repo isn’t a form-builder platform yet, but it _does_ have a solid foundation you can legitimately claim as progress toward Bundle 2.

### 1) Validated field component library (client)

You have a consistent, reusable set of field components:

- `ValidatedInput`, `ValidatedSelect`, `ValidatedCombobox`, `ValidatedCheckbox`
- `ValidatedDatePicker` (already thinking about UTC consistency + age bounds)
- `ValidatedPhoneInput` (normalizes canonical storage, formats for display)
- `ValidatedFileUpload` (file type filtering, size limits, preview)

This matters because SIN’s “customizable forms” requirement becomes primarily a **metadata-driven rendering** problem, not a “build 30 bespoke forms” problem.

### 2) A validation pattern that’s enforceable server-side

You’re already using:

- **Zod schemas** for strong validation (`events.schemas.ts`, `profile.schemas.ts`, etc.)
- Server functions with `.inputValidator(...)` and handler patterns (`createServerFn`)
- Structured error return patterns in several places

This matters because SIN validation must not rely only on client behavior; it needs server enforcement and auditability.

### 3) A Postgres + Drizzle data layer with JSONB experience

You have:

- Drizzle schemas with constraints, foreign keys, indices
- JSONB usage for flexible “extra” fields (events metadata, roster, payment metadata)
- `atomicJsonbMerge` and related JSONB helper functions for safe concurrent updates

This matters because **dynamic forms and submissions** naturally fit a hybrid model:

- normalized columns for core things you query constantly
- JSONB payloads for flexible per-form data

### 4) Role scaffolding you can extend for admin features

You have `roles`, `userRoles`, permission JSONB, and scoped roles (teamId, eventId).

That’s a credible base to claim “Admin UI for form creation and data governance will be access-controlled.”

### 5) Environment-aware DB connections (important for import/migration)

You have:

- pooled connection for serverless
- unpooled connection for long ops/migrations (`getUnpooledDb`)

This is key for DM-AGG-006 and “20+ million rows” migration: you will need a mode that is not “one request = one import.”

---

## What the SIN RFP actually implies (the “shape” of the missing system)

Bundle 2 is not “add a couple more Zod schemas.” It’s asking for a **Form & Data Governance subsystem**. Practically, you need these product-level modules:

1. **Form Definition & Template Module**
2. **Submission Module (tracking, editing, version history, attachments)**
3. **Import/Migration Module (CSV/Excel, mapping templates, preview, rollback, audit)**
4. **Processing & Transformation Logging Module**
5. **Data Quality Module (dashboard, scheduled checks, completeness scoring)**
6. **Retention & Archiving Module (policy config, archive/retrieve, backup verification evidence)**
7. **Validation Rule Builder (admin-configurable rules)**

If you describe it that way in the RFP response, it reads like a coherent system rather than a list of features.

---

## Proposed architecture for Bundle 2 (RFP-friendly)

### A. Metadata-driven form engine

**Core idea:** Form definitions live in the database as versioned metadata. UI renders forms by mapping “field types” → your existing validated components.

- **Form definitions**: stored as JSONB with a typed schema (see “Data model additions” below)
- **Form versions**: immutable once published; edits create a new version
- **Validation rules**: stored as rule metadata and compiled to Zod (or evaluated by a rule engine) on the server

This aligns with:

- customizable forms
- per-form custom validation
- historical migration compatibility (submissions can reference the form version used at the time)

### B. Submission lifecycle + auditability

Treat each submission as a record with:

- `status` (“draft”, “submitted”, “validated”, “rejected”, “archived”, etc.)
- `payload` (JSONB)
- `attachments` (object storage references + metadata)
- `versions` (who changed what and when)

This aligns with:

- submission tracking
- editing
- version history
- audit requirements and rollback

### C. Import/migration pipeline designed for both “admin UI” and “20M rows”

You need two lanes:

- **Interactive Admin Import (UI-driven)** for manageable files
- **Bulk Migration Tooling** (worker/CLI/batch pipeline) for the legacy-scale initial load

Both should share:

- mapping templates
- validation logic
- transformation logging
- import audit logs

---

## Requirement-by-requirement breakdown (RFP-ready)

### DM-AGG-001: Data Collection & Submission

**What it means in SIN terms**

- Admins need to define data collection instruments without developer intervention
- Users need to submit through forms and uploads
- Admins need visibility into submissions (status, volume, errors) and ability to correct data with history

**What you have today**

- A strong library of validated field components
- Zod validation patterns
- No dynamic builder, no submission store, no tracking dashboard

**What you must deliver (system capabilities)**

1. **Admin Form Builder UI**

- Drag-and-drop field palette using existing components:
  - Text, number, email, select/combobox, checkbox, date, phone, file upload, etc.

- Field configuration panel:
  - label, help text, required, default value
  - validation rules (min/max length, pattern, allowed file types/sizes, etc.)
  - conditional logic (optional but a common RFP expectation)

2. **Form Template System**

- Save form configurations as templates
- Clone existing forms
- Versioning:
  - “Draft” → “Published”
  - publishing locks a version; edits create a new version

3. **Submission Tracking Dashboard**

- Filter by form, date range, submitter type, status, error counts
- “Near real-time” updates:
  - implement via react-query refetch interval, or SSE where supported

- Drill-down:
  - open submission, view validation status, attachments, audit trail

4. **Submission Editing with Version History**

- Admin edits create a new submission version
- Version diff/snapshot stored
- Ability to restore prior version (if policy allows)

5. **File upload support (multiple formats)**

- Expand file handling to support:
  - documents: PDF, DOCX
  - spreadsheets: CSV, XLSX
  - images as needed

- Store:
  - file metadata (size, mimeType, checksum)
  - storage pointer (object key / URL)

- Enforce:
  - allowed type list per field
  - size limits per field/form

- (Optional but strong for RFP) virus scanning integration point

**Acceptance evidence you can write into the RFP**

- Demonstrate creating a custom form, publishing it, collecting submissions, editing a submission, and viewing version history and attachment list.

---

### DM-AGG-002: Data Processing & Integration

**What it means in SIN terms**

- Data arriving from different sources must be standardized consistently
- Transformations must be traceable (audit)
- There must be import/export capabilities and optionally API integration

**What you have today**

- Zod schemas normalize and validate inputs in existing domains
- A client-side CSV export utility exists (`exportToCSV`)
- No bulk import pipeline, no transformation logs, no API layer for external platforms

**What you must deliver**

1. **Standardization layer**

- Define canonical field formats per form:
  - dates stored in ISO format consistently (you already lean this way)
  - phone stored in canonical + display formatting
  - enumerations stored as stable internal values

- Apply normalization server-side before persistence

2. **Transformation Logging**
   Create a persistent log of processing actions:

- “what changed” during standardization
- when it changed
- who/what triggered it (user id / job id)
- before/after snapshots (or patch)

This is exactly the kind of audit SIN stakeholders want for accountability.

3. **Bulk Import from CSV/Excel**

- UI flow:
  1. Upload file
  2. Detect columns + data types
  3. Map columns → target fields
  4. Preview first N rows with validation results
  5. Execute import (chunked)
  6. Provide a post-import report + audit record

4. **Field Mapping UI**

- Auto-suggest mappings by name similarity
- Show required fields and missing mappings
- Allow transformations per column (trim, date parse, enum mapping)
- Save mapping as a **reusable template** (ties to DM-AGG-006)

5. **Export to Multiple Formats**

- CSV (existing) + Excel + JSON
- For large datasets: server-side streaming exports rather than browser-only generation

6. **Optional REST API integration**

- Provide scoped API tokens with role permissions (reuse roles/permissions model)
- Endpoints for:
  - list forms, get form schema
  - submit data (for integrations)
  - export submissions

**Acceptance evidence**

- Import a sample Excel, map fields, preview, execute, produce audit log and transformation log; export results to CSV + JSON.

---

### DM-AGG-004: Data Quality & Integrity

**What it means in SIN terms**

- Beyond “validation on submit,” SIN needs ongoing monitoring:
  - incomplete data
  - invalid data that slipped in via migration
  - referential integrity
  - quality scoring

**What you have today**

- Drizzle constraints + relational integrity foundations
- Zod schema validation in many server functions
- No quality dashboard, no scheduled checks, no per-form custom rules

**What you must deliver**

1. **Data Quality Dashboard**
   For admins:

- Summary metrics:
  - submissions failing validation by form
  - missing required fields counts
  - completeness score distribution

- Drilldown:
  - list of submissions with issues
  - show which rule(s) failed, with field paths

2. **Automated Data Quality Checks (scheduled jobs)**

- Nightly/weekly jobs that:
  - re-run validation rules against stored submissions
  - detect regressions when rules change
  - flag anomalies (out-of-range dates, duplicates, etc.)

- Store issues in a `data_quality_issues` table for audit and workflow

3. **Custom Validation Rules per Form/Field**

- Admin-configurable rule sets (ties to RP-AGG-001)
- Rules evaluated server-side on submit and on scheduled checks

4. **Data Completeness Scoring**

- Define a scoring model:
  - percent of required fields present
  - weighted optional fields
  - penalties for invalid formats

- Store score per submission and aggregate per org/program area

**Acceptance evidence**

- Show a dashboard where an admin can identify problem submissions, see why, and track resolution.

---

### DM-AGG-005: Data Storage & Retention

**What it means in SIN terms**

- Not just “we use Neon backups”
- Must show:
  - retention policy configurability
  - archiving workflow
  - restore/verification procedures

**What you have today**

- Neon Postgres (managed backups)
- Netlify hosting
- Connection handling is reliability-aware

**What you must deliver**

1. **Retention Policy Configuration**

- Admin UI + DB policy records:
  - retention windows by data type/form/category
  - archive-after and purge-after thresholds
  - legal hold flags if needed

2. **Automated Archiving**

- Scheduled jobs to:
  - move old submissions into archive tables (or mark archived + relocate attachments to cheaper storage tier)
  - optionally compress payload JSON (if appropriate)

- Maintain searchability via minimal indexed metadata

3. **Archive Retrieval Workflow**

- Admin can:
  - search archived submissions
  - restore to active dataset (creates audit entry)
  - access archived attachments

4. **Backup Verification / Testing Procedures**

- Not just “backups exist”—you need operational evidence:
  - periodic backup restore test to a staging environment
  - documented runbook
  - recorded outcomes (date, operator, success/failure)

**Acceptance evidence**

- Provide retention policies, demonstrate an archive run, show retrieval, and show documented backup verification logs.

---

### DM-AGG-006: Legacy Data Migration & Bulk Import

**What it means in SIN terms**

- A serious migration toolchain:
  - mapping templates
  - validation + error reporting
  - preview
  - rollback
  - audit logs

- Must scale to very large volumes (20M+ rows)

**What you have today**

- Nothing implemented yet (per the bundle)

**What you must deliver**

1. **Bulk Import UI (CSV/Excel)**

- Upload, map, preview, validate, execute
- Validation error reporting:
  - by row
  - by field
  - include human-readable message + rule reference

2. **Import Rollback**
   You need an explicit rollback model. Two credible patterns:

- **Staging-first**: import into staging tables keyed by `import_job_id`, validate fully, then “promote” into production tables in a controlled merge step
  - rollback = discard staging / don’t promote

- **Batch tagging**: production inserts tagged with `import_job_id` and rollback deletes/undoes that batch
  - rollback = delete where import_job_id = X (plus attachments)

For SIN, staging-first reads best for risk control.

3. **Import Audit Logs**
   Track:

- who ran it
- when
- file used (hash + storage pointer)
- mapping template used
- counts: rows processed, succeeded, failed
- status + error summaries

4. **Configurable Mapping Templates**

- Save and reuse mappings
- Version templates
- Share across admins

5. **Support for legacy databases or APIs**

- At minimum: an ingestion adapter pattern:
  - CSV/Excel now
  - DB/API connectors later

- The RFP language says “CSV/Excel, legacy databases, or APIs”—you can implement connectors incrementally, but the architecture should anticipate it.

6. **Scaling for 20M+ rows**
   For the RFP response, you should explicitly acknowledge:

- **UI imports are not the right mechanism for initial 20M row migration**
- Provide a dedicated batch pipeline approach using:
  - unpooled DB connection
  - chunked streaming parsing
  - resumable jobs
  - idempotency keys
  - robust error capture

That honesty reads as competence, not a weakness.

**Acceptance evidence**

- Import a representative legacy extract, map and preview, run import, show audit log, and demonstrate rollback.

---

### RP-AGG-001: Data Validation & Submission Rules

**What it means in SIN terms**

- Validation rules must be configurable per submission type/form
- Errors must be clear and actionable
- Completeness must be determinable
- Validation must be enforced server-side

**What you have today**

- Zod validation across server functions
- Field-level errors in UI
- `ValidatedFileUpload` has client-side file type/size gating
- Date + phone utilities exist but aren’t generalized into a “rule builder”

**What you must deliver**

1. **Configurable validation rules per submission type**

- Admin defines:
  - required fields
  - format constraints (email, phone, date ranges)
  - cross-field rules (if X then Y required)
  - file constraints (type, size, count)

2. **Validation Rule Builder UI**

- Build rules through UI, store as metadata
- Generate server-side validation from the rule set
  - stays consistent with your Zod-first architecture
  - avoids “client-only” validation gaps

3. **Enhanced helpers**

- Centralize:
  - date parsing + timezone rules (you already started this)
  - phone validation (canonical + display)
  - email validation (Zod supports email; you already use it in places)

- Ensure consistency across form engine, imports, and APIs

4. **Submission completeness checker**

- A single source of truth:
  - required fields from form definition + rules
  - computed on submission create/update/import
  - stored as score + missing fields list

**Acceptance evidence**

- Create a form with rules, submit invalid data, show meaningful errors; submit valid data, show completeness score; import rows and show row-level errors.

---

## Concrete data model additions you should describe in the RFP response

To make this credible, describe the core tables/modules you will add (even at a high level).

### Forms

- `forms`
  - `id`, `name`, `slug`, `description`
  - `status` (draft/published/archived)
  - `createdBy`, `createdAt`, `updatedAt`

- `form_versions`
  - `id`, `formId`, `versionNumber`, `publishedAt`, `publishedBy`
  - `definition` (JSONB: fields, layout, rules)

- (Optional) `form_templates` if you want templates separate from forms

### Submissions

- `form_submissions`
  - `id`, `formId`, `formVersionId`
  - `submitterId` (nullable for system imports)
  - `status`, `createdAt`, `updatedAt`
  - `payload` (JSONB)
  - `completenessScore`, `missingFields` (JSONB array)

- `form_submission_versions`
  - `id`, `submissionId`, `versionNumber`
  - `changedBy`, `changedAt`
  - `payloadSnapshot` (JSONB) or `patch` (JSONB)
  - `changeReason`

### Attachments

- `submission_files`
  - `id`, `submissionId`, `fieldKey`
  - `fileName`, `mimeType`, `sizeBytes`, `checksum`
  - `storageKey`, `storageUrl` (or signed URL mechanism)
  - `createdAt`

### Imports / Migration

- `import_jobs`
  - `id`, `type` (csv/excel/api/db)
  - `sourceFileKey`, `sourceFileHash`
  - `mappingTemplateId`
  - `status`, `createdBy`, `createdAt`, `startedAt`, `completedAt`
  - `stats` JSONB (rowsProcessed, rowsSucceeded, rowsFailed)
  - `errorSummary` JSONB

- `import_job_errors`
  - `jobId`, `rowNumber`, `field`, `message`, `rawValue`, `severity`

### Processing / Quality / Retention

- `transformation_logs`
- `data_quality_issues`
- `retention_policies`
- `archive_runs` / `backup_verification_runs`

You don’t need every table on day one, but describing them makes the plan feel implementable.

---

## How to tie this back to existing patterns in your code (important for credibility)

In the RFP response, explicitly state you will follow the established patterns:

- **Server fn pattern**: `createServerFn({ method })...inputValidator(zod$())...handler(...)`
- **Schema pattern**: Zod schemas derived from form definitions and validated server-side
- **DB access**: `getDb()` for request paths, `getUnpooledDb()` for imports/migration and long operations
- **Concurrency safety**: use atomic JSONB updates for metadata/version fields (`atomicJsonbMerge`, `jsonb_set`)
- **UI field library**: your existing validated field components are the render targets for the form engine

That shows this isn’t a greenfield rewrite—more like a structured extension.

---

## Suggested RFP “response structure” you can paste directly

If you need this to read like an RFP section, you can frame it as:

- **Overview / Approach**
- **Compliance Mapping (per requirement)**
- **System Components & Screens**
- **Data Model & Auditability**
- **Security & Access Control**
- **Testing & Acceptance**
- **Risks & Mitigations (migration scale, serverless limits, file handling)**

---

## The one hard truth to include in the RFP (so you don’t get trapped later)

Because SIN explicitly mentions **20+ million rows**, the RFP response should clearly distinguish:

- **Interactive admin imports** (common operational use, smaller datasets)
- **Enterprise migration pipeline** (batch, resumable, staged, high-volume)

If you present one UI import tool as the answer for 20M rows, evaluators who’ve done migrations will see it as naive. If you present both lanes, it reads as mature and realistic.

---

If you want, I can turn the above into a **tight RFP compliance matrix** (Requirement → Proposed Solution → Deliverables → Acceptance Evidence) in the exact style procurement teams prefer, using your requirement codes verbatim.
