# Data Migration Strategy

This document outlines the migration approach for legacy data into SIN.
It is aligned with the v2 backlog migration checklist.

## Pre-Migration Checklist

- Inventory legacy tables, row counts, and relationships.
- Run data quality assessment (nulls, duplicates, invalid formats).
- Produce field mapping document (legacy -> SIN schema).
- Define transformation rules (dates, phone normalization, enums).
- Finalize rollback plan (legacy system remains read-only during cutover).

## Migration Phases

1. **Schema creation**
   - Run all SIN migrations in a clean environment.

2. **Organization hierarchy**
   - Insert viaSport, PSOs, and Clubs in correct parent/child order.

3. **User migration**
   - Migrate users, normalize emails, and send password reset invitations.

4. **Historical submissions**
   - Use Lane 2 batch import with checkpoints and error reporting.

5. **Document migration**
   - Bulk copy files to S3 with metadata tracking.

6. **Validation**
   - Produce reconciliation reports (row counts, checksums).

7. **Cutover**
   - Switch DNS, set legacy system to read-only, monitor errors.

## Batch Import Configuration (20M+ Rows)

Recommended ECS batch settings:

- CPU: 2048
- Memory: 4096
- Chunk size: 5000 rows
- Checkpoint interval: 10000 rows
- Max retries: 3
- Connection pool: unpooled

Errors are written to S3 in CSV format for audit and review.

## Rollback Strategy

- All imports are tagged with `import_job_id`.
- Rollback removes tagged rows within the rollback window.
- Retain legacy system in read-only mode until reconciliation passes.

---

## Migration Artifacts (Synthetic placeholders)

These artifacts are synthesized from the SIN RFP context (BCAR/BCSI legacy
systems, 20M+ rows) when real exports are unavailable. Replace these estimates
with actual extracts before production migration.

### Legacy Data Inventory (synthetic)

| Legacy Table              | Owner System | Row Count (est.) | Primary Key | Relationships                   | Notes                             |
| ------------------------- | ------------ | ---------------- | ----------- | ------------------------------- | --------------------------------- |
| bcar_organizations        | BCAR         | 1,200            | org_id      | parent_org_id → organizations   | PSOs, clubs, affiliates, viaSport |
| bcar_contacts             | BCAR         | 15,000           | contact_id  | org_id → organizations          | Reporters/admin contacts          |
| bcar_activity_reports     | BCAR         | 120,000          | report_id   | org_id → organizations          | One per org per period            |
| bcar_activity_report_rows | BCAR         | 18,000,000       | row_id      | report_id → activity_reports    | Participant/program metrics       |
| bcsi_member_registry      | BCSI         | 1,800,000        | member_id   | org_id → organizations          | Membership + demographics         |
| bcsi_coaches              | BCSI         | 150,000          | coach_id    | member_id → members             | NCCP certification info           |
| reporting_periods         | Shared       | 200              | period_id   | period_id → activity_reports    | Fiscal/season windows             |
| legacy_documents          | Shared       | 55,000           | document_id | report_id/org_id → reports/orgs | Attachments + templates           |

### Data Quality Assessment (synthetic)

| Table                     | Null % (est.) | Duplicate % (est.) | Invalid Format Examples                    | Remediation Plan                                                      |
| ------------------------- | ------------- | ------------------ | ------------------------------------------ | --------------------------------------------------------------------- |
| bcar_organizations        | 5%            | 1%                 | Postal codes missing space, mixed case     | Normalize addresses, dedupe by name + city                            |
| bcar_contacts             | 18%           | 4%                 | Emails missing/invalid, phone formats      | Lowercase emails, drop rows without email for login, normalize phones |
| bcar_activity_reports     | 12%           | 0.2%               | Missing submitted_at, period overlaps      | Derive status from submitted_at, validate period ranges               |
| bcar_activity_report_rows | 8%            | 0.5%               | Gender codes M/F/U, age outliers           | Map enums, clamp ages, flag outliers                                  |
| bcsi_member_registry      | 22%           | 3%                 | Missing DOB, inconsistent membership types | Keep DOB optional, map membership enums, dedupe by org + email        |
| bcsi_coaches              | 10%           | 2%                 | NCCP levels as free text                   | Normalize to standard NCCP levels                                     |
| legacy_documents          | 40%           | 0%                 | Missing checksum, inconsistent filenames   | Recompute checksums, normalize filenames                              |

### Field Mapping Document (synthetic)

| Legacy Field                         | Legacy Type | SIN Table            | SIN Field              | Transform                                | Notes                                  |
| ------------------------------------ | ----------- | -------------------- | ---------------------- | ---------------------------------------- | -------------------------------------- |
| bcar_organizations.org_id            | string      | organizations        | metadata.legacyOrgId   | copy                                     | Preserve legacy IDs in metadata        |
| bcar_organizations.org_name          | string      | organizations        | name                   | trim                                     | -                                      |
| bcar_organizations.org_type          | enum        | organizations        | type                   | map to governing_body/pso/club/affiliate | -                                      |
| bcar_organizations.parent_org_id     | string      | organizations        | parentOrgId            | map via crosswalk                        | Requires org ID map                    |
| bcar_organizations.status            | enum        | organizations        | status                 | map active/pending/archived              | -                                      |
| bcar_contacts.email                  | string      | user                 | email                  | lowercase                                | Use for identity                       |
| bcar_contacts.first_name + last_name | string      | user                 | name                   | concat + trim                            | -                                      |
| bcar_contacts.phone                  | string      | user                 | phone                  | E.164 normalize                          | -                                      |
| bcar_contacts.role                   | enum        | organization_members | role                   | map admin/reporter/viewer                | -                                      |
| bcar_activity_reports.report_id      | string      | form_submissions     | payload.legacyReportId | copy                                     | Stored in payload for traceability     |
| bcar_activity_reports.\*summary      | mixed       | form_submissions     | payload.summary        | normalize numbers                        | Fields like participant_total          |
| bcar_activity_report_rows.\*         | mixed       | form_submissions     | payload.rows[]         | normalize enums                          | Store rows array in submission payload |
| bcsi_member_registry.\*              | mixed       | form_submissions     | payload.members[]      | normalize fields                         | Member registry form per org/period    |
| legacy_documents.file_name           | string      | submission_files     | file_name              | sanitize                                 | Linked by legacy report crosswalk      |
| legacy_documents.storage_path        | string      | submission_files     | storage_key            | prefix legacy/                           | S3 key with legacy prefix              |

### Transformation Rules (synthetic)

| Rule Name               | Source Fields    | Target Fields          | Logic                                   | Example                       |
| ----------------------- | ---------------- | ---------------------- | --------------------------------------- | ----------------------------- |
| Date normalization      | *date, *at       | timestamps             | Parse multiple formats → ISO 8601       | 03/31/2024 → 2024-03-31       |
| Phone normalization     | phone            | user.phone             | Strip non-digits, add +1, format E.164  | (604) 555-0100 → +16045550100 |
| Postal normalization    | postal_code      | metadata.postalCode    | Uppercase, insert space                 | v6c1t2 → V6C 1T2              |
| Gender enum mapping     | gender           | payload.gender         | Map M/F/U/X → male/female/unknown/other | M → male                      |
| Membership type mapping | membership_type  | payload.membershipType | Map free-text to enums                  | "annual" → annual             |
| Status mapping          | status           | organizations.status   | Map legacy to active/pending/archived   | "inactive" → archived         |
| Duplicate contact merge | email + name     | user                   | Keep latest updated_at                  | 2 rows → 1 user               |
| Period normalization    | reporting_period | reporting_cycles       | Map to FY/quarter labels                | 2024-Q1 → FY2024 Q1           |

### Sample Legacy Export Files (synthetic)

- `docs/sin-rfp/legacy-data-samples/bcar_organizations.csv`
- `docs/sin-rfp/legacy-data-samples/bcar_contacts.csv`
- `docs/sin-rfp/legacy-data-samples/bcar_activity_reports.csv`
- `docs/sin-rfp/legacy-data-samples/bcar_activity_report_rows.csv`
- `docs/sin-rfp/legacy-data-samples/bcsi_member_registry.csv`
- `docs/sin-rfp/legacy-data-samples/legacy_documents.csv`

### Rollback Plan (Detailed)

1. Freeze legacy system to read-only for cutover window.
2. Execute batch import with `import_job_id` tags.
3. Validate row counts + checksums against legacy extracts.
4. If validation fails, run rollback script to delete by `import_job_id`.
5. Restore legacy system to active mode if rollback executed.
