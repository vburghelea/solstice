# Legacy Data Sample Exports (Synthetic)

These CSV files are synthetic stand-ins for BCAR/BCSI exports so the migration
workflow can be exercised without real legacy data. Replace them with actual
exports during migration planning.

## Files

- `bcar_organizations.csv` - Organization hierarchy (viaSport, PSOs, clubs).
- `bcar_contacts.csv` - Legacy user/contact records.
- `bcar_activity_reports.csv` - Period-level activity reporting summaries.
- `bcar_activity_report_rows.csv` - Row-level activity metrics.
- `bcsi_member_registry.csv` - Membership registry demographics.
- `legacy_documents.csv` - Legacy attachments metadata.

## Usage

- Import with the Lane 1 wizard to validate mappings.
- Use mapping templates aligned to the fields in
  `docs/sin-rfp/phase-0/migration-strategy.md`.
