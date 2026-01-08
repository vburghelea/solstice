# Remaining Scope Verification - System Requirements (04)

This document verifies the "Remaining Scope" items in the System Requirements
responses against the current codebase. Each item includes code evidence showing
why the work is still pending.

Source requirements:

- docs/sin-rfp/response/04-system-requirements/00-compliance-crosswalk/final.md
- docs/sin-rfp/response/04-system-requirements/data-management-dm-agg/final.md
- docs/sin-rfp/response/04-system-requirements/reporting-rp-agg/final.md
- docs/sin-rfp/response/04-system-requirements/training-onboarding-to-agg/final.md
- docs/sin-rfp/response/04-system-requirements/user-interface-ui-agg/final.md

## Data Management (DM-AGG)

### DM-AGG-001: Data Collection and Submission

Remaining scope: viaSport templates and field definitions.

Code evidence:

- Form definitions are seeded with generic, placeholder field sets rather than
  viaSport-approved templates. `scripts/seed-sin-data.ts:1053`
- Template uploads in the seed script use sample CSV bodies instead of
  viaSport-provided template content. `scripts/seed-sin-data.ts:1955`

Status: Still to-do; templates/field definitions are placeholders.

### DM-AGG-002: Data Processing and Integration

Remaining scope: external integrations and mapping rules.

Code evidence:

- Import types are constrained to CSV and Excel only. `src/features/imports/imports.schemas.ts:4`
- File parsing only supports CSV/XLSX and rejects other formats. `src/features/imports/imports.utils.ts:30`

Status: Still to-do; no external connector or API integration layer exists.

### DM-AGG-003: Data Governance and Access Control

Remaining scope: catalog taxonomy refinement.

Code evidence:

- Data catalog entries are tagged with hardcoded, generic tags
  (e.g., "form", "report", "template") without configurable taxonomy.
  `src/features/data-catalog/data-catalog.service.ts:36`

Status: Still to-do; taxonomy is fixed and not refined for viaSport.

### DM-AGG-004: Data Quality and Integrity

Remaining scope: threshold tuning with viaSport.

Code evidence:

- Default alert thresholds are hardcoded and used when no overrides exist.
  `src/features/data-quality/data-quality.alerts.ts:18`

Status: Still to-do; thresholds are still defaults pending viaSport tuning.

### DM-AGG-005: Data Storage and Retention

Remaining scope: final DR and retention validation.

Code evidence:

- Retention enforcement exists, but there is no DR validation routine or drill
  automation in the codebase. `src/lib/privacy/retention.ts:18`

Status: Still to-do; DR validation remains an operational task.

### DM-AGG-006: Legacy Data Migration and Bulk Import

Remaining scope: legacy extraction and BCAR/BCSI mapping rules.

Code evidence:

- Only a single, sample mapping template is seeded (BC Hockey annual stats).
  `scripts/seed-sin-data.ts:1908`
- Import schemas still accept CSV/Excel only, with no legacy-system connector.
  `src/features/imports/imports.schemas.ts:4`

Status: Still to-do; legacy extraction/mapping rules are not implemented.

## Reporting (RP-AGG)

### RP-AGG-002: Reporting Information Management

Remaining scope: viaSport metadata configuration and UI refinement.

Code evidence:

- Reporting metadata schema is a fixed set of fields with no tenant-specific
  configuration. `src/features/reporting/reporting.schemas.ts:33`
- The metadata UI renders generic inputs (no viaSport-specific labels/options).
  `src/routes/dashboard/sin/reporting.tsx:320`
- Seed data uses sample metadata values rather than viaSport-approved values.
  `scripts/seed-sin-data.ts:793`

Status: Still to-do; metadata configuration is still generic/sample.

## Training and Onboarding (TO-AGG)

### TO-AGG-001: Template Support and Integration

Remaining scope: viaSport template content.

Code evidence:

- Template seed content is sample CSV data, not viaSport templates.
  `scripts/seed-sin-data.ts:1955`

Status: Still to-do; templates are placeholders.

### TO-AGG-002: Guided Learning and Walkthroughs

Remaining scope: final content review with viaSport.

Code evidence:

- Tutorial copy is static and generic in config. `src/features/tutorials/tutorials.config.ts:1`

Status: Still to-do; walkthrough content has not been refined with viaSport.

### TO-AGG-003: Reference Materials and Support

Remaining scope: content refinement with viaSport.

Code evidence:

- Help guides and FAQs are static, generic content. `src/features/help/help-content.ts:25`

Status: Still to-do; help content has not been aligned with viaSport terminology.

## User Interface (UI-AGG)

### UI-AGG-007: Consistent Visual Language and Branding

Remaining scope: viaSport branding assets and theme configuration.

Code evidence:

- viaSport branding config only specifies logo variant and a single theme color.
  `src/tenant/tenants/viasport.ts:5`
- Global brand tokens are still labeled for QC, and viaSport overrides only a
  small subset of colors. `src/styles.css:44`
- The base font family remains shared/default, not a viaSport-specific
  typography choice. `src/styles.css:61`

Status: Still to-do; branding is minimal and needs final viaSport assets/palette.
