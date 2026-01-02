# Context Notes - Appendices

## RFP Prompts

- Include supporting evidence and detailed materials.
- Keep appendices referenced from section content.
- Appendices list per template (A-I): requirements matrix, architecture
  diagrams, data migration plan, security documentation, training materials,
  case studies/references, team bios, pricing worksheets, optional add-ons.

## Evidence Targets

- Detailed requirements response matrix (status, how met, evidence links).
- Architecture diagrams (logical, data flow, network).
- Data migration methodology, mapping, validation, rollback, and runbook
  artifacts.
- Security documentation (controls, audit/retention, backup/DR, residency).
- Training materials samples (templates, tutorials, help center, support).
- Case studies and references.
- Team bios/resumes.
- Pricing worksheets.
- Optional add-ons/value-adds.

## Sources

- docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md
- docs/sin-rfp/source/initial-template-rfp-response.md
- docs/sin-rfp/requirements/requirements-coverage-matrix.md
- docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md
- docs/sin-rfp/phase-0/architecture-reference.md
- docs/sin-rfp/phase-0/migration-strategy.md
- docs/sin-rfp/phase-0/import-batch-worker.md
- docs/sin-rfp/legacy-data-samples/README.md
- docs/sin-rfp/phase-0/security-controls.md
- docs/sin-rfp/phase-0/audit-retention-policy.md
- docs/sin-rfp/phase-0/backup-dr-plan.md
- docs/sin-rfp/phase-0/data-residency.md
- docs/sin-rfp/phase-0/data-classification-guide.md
- docs/sin-rfp/requirements/user-stories-and-flows.md

## Context Highlights (source-backed)

- Requirements coverage matrix exists with status, modules, and evidence links.
  (docs/sin-rfp/requirements/requirements-coverage-matrix.md)
- Verification report provides evidence screenshots and status deltas for each
  requirement. (docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md)
- Architecture reference includes logical, data flow, and network diagrams.
  (docs/sin-rfp/phase-0/architecture-reference.md)
- Migration strategy covers pre-migration checklist, phases, data quality,
  mapping, batch import settings, and rollback. (docs/sin-rfp/phase-0/migration-strategy.md)
- Batch import worker draft defines the ECS task contract for Lane 2 imports.
  (docs/sin-rfp/phase-0/import-batch-worker.md)
- Legacy data sample CSVs exist for BCAR/BCSI stand-ins. (docs/sin-rfp/legacy-data-samples/README.md)
- Security documentation set includes controls, audit retention, backup/DR,
  residency, and data classification. (docs/sin-rfp/phase-0/\*.md)
- Training-related evidence exists via templates, tutorials, and help center
  verification screenshots. (docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md)

## Draft Bullets for final.md (notes only)

### Appendix A - Detailed Requirements Matrix

- Base matrix on `docs/sin-rfp/requirements/requirements-coverage-matrix.md`.
- Align status with verification report; call out any deltas explicitly.
- Link evidence screenshots from `docs/sin-rfp/review-plans/evidence/`.

### Appendix B - Architecture Diagrams

- Include logical, data flow, and network diagrams from
  `docs/sin-rfp/phase-0/architecture-reference.md`.
- Export mermaid to static images for submission packaging.

### Appendix C - Data Migration Plan

- Summarize methodology and phases from
  `docs/sin-rfp/phase-0/migration-strategy.md`.
- Include data quality assessment, mapping tables, and rollback plan.
- Reference batch import worker draft for large-scale imports:
  `docs/sin-rfp/phase-0/import-batch-worker.md`.
- List sample legacy export files from `docs/sin-rfp/legacy-data-samples/`.

### Appendix D - Security Documentation

- Provide security controls overview and requirement mapping:
  `docs/sin-rfp/phase-0/security-controls.md`.
- Include audit/retention policy:
  `docs/sin-rfp/phase-0/audit-retention-policy.md`.
- Include backup/DR plan and targets:
  `docs/sin-rfp/phase-0/backup-dr-plan.md`.
- Include data residency statement and classification guide:
  `docs/sin-rfp/phase-0/data-residency.md`,
  `docs/sin-rfp/phase-0/data-classification-guide.md`.

### Appendix E - Training Materials

- Include templates, tutorial panel, and help center evidence from verification
  report screenshots. (docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md)
- Ground audience needs in the Support & Training Coordinator stories.
  (docs/sin-rfp/requirements/user-stories-and-flows.md)

### Appendix F - Case Studies and References

- Add vendor-provided case studies and reference contacts.

### Appendix G - Team Bios

- Add project team bios/resumes and org chart.

### Appendix H - Pricing Worksheets

- Add detailed pricing worksheets and assumptions from cost model.

### Appendix I - Optional Add-Ons

- List optional add-ons or value-add services with scope and pricing.
