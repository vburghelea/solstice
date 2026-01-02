# Concerns / Missing Inputs

- No UAT schedule or stakeholder sign-off workflow documented beyond the
  internal requirements review plan. (docs/sin-rfp/review-plans/requirements-review-plan.md)
- Performance testing has a plan/runbook but no recorded results or benchmark
  metrics in the repo. (docs/sin-rfp/review-plans/performance-testing-plan.md,
  docs/sin-rfp/review-plans/performance-test-runbook.md)
- Data warehousing/integration gaps remain: no dedicated warehouse/ETL or API
  exchange scope defined, and integration admin stories list missing workflows.
  (docs/sin-rfp/requirements/user-stories-and-flows.md,
  docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md)
- Migration strategy uses synthetic placeholders pending real BCAR/BCSI exports;
  external API/DB import path is not implemented; file-field imports are blocked.
  (docs/sin-rfp/phase-0/migration-strategy.md,
  docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md,
  docs/sin-rfp/decisions/ADR-2025-12-26-d0-4-forms-multifile-support.md)
- Data residency + DR docs note partial implementation items (SES enforcement,
  audit archive automation, production DR evidence). (docs/sin-rfp/phase-0/data-residency.md,
  docs/sin-rfp/phase-0/audit-retention-policy.md,
  docs/sin-rfp/phase-0/backup-dr-plan.md)
- Accessibility scan shows color-contrast/region violations; remediation steps
  are not documented yet. (docs/sin-rfp/review-plans/evidence/a11y-scan-20251231.json)
- Training/support: help content not yet reviewed by stakeholders; no support
  SLA/escalation model or external ticketing integration documented. (docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md,
  docs/sin-rfp/requirements/user-stories-and-flows.md)
