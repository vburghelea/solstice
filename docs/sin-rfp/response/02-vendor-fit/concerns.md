# Concerns and Missing Inputs

- Missing company details required by the RFP: legal entity name,
  incorporation date, staff size, location(s), organization structure, and
  org chart. No sources in repo confirm these details.
- Repo describes Solstice as a personal project, which may not align with RFP
  expectations for vendor capacity. Clarify the actual vendor entity and
  staffing plan. (README.md)
- Limited documented sector/client experience: only Quadball Canada references
  and no formal case studies or client references.
  (docs/PROJECT-AUDIT-SUMMARY.md, src/tenant/tenants/qc.ts)
- SIN phase-0 docs mark several items as partial or planned; final response
  must clearly label delivered vs planned.
  (docs/sin-rfp/phase-0/architecture-reference.md,
  docs/sin-rfp/phase-0/security-controls.md,
  docs/sin-rfp/phase-0/data-residency.md,
  docs/sin-rfp/phase-0/backup-dr-plan.md,
  docs/sin-rfp/phase-0/audit-retention-policy.md)
- Potential inconsistency: PROJECT-AUDIT-SUMMARY lists Netlify deployment, while
  current SIN architecture targets SST/AWS. Reconcile before drafting.
  (docs/PROJECT-AUDIT-SUMMARY.md, docs/sin-rfp/phase-0/architecture-reference.md,
  sst.config.ts)
- No evidence artifacts in docs/sin-rfp/response/02-vendor-fit/evidence/ yet;
  need company profile, org chart, leadership bios, and references.
