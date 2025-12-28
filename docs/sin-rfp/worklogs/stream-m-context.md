# Stream M Context Summary (Missing requirement features)

## Sources consulted

- `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`
- `docs/sin-rfp/5.2-pro-review-output/5-implementation.md`
- `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md`
- `docs/sin-rfp/decisions/ADR-2025-12-26-d0-15-templates-help-support-rollout.md`
- `docs/sin-rfp/decisions/ADR-2025-12-26-d0-16-analytics-charts-pivots-scope.md`
- `docs/sin-rfp/SIN-REQUIREMENTS.md`
- `docs/sin-rfp/system-requirements-addendum.md`

## Stream M scope (from consolidated backlog)

- **M1 TO-AGG-001 Template hub**: centralized templates feature + schema + routes + contextual links.
- **M2 TO-AGG-002 Guided walkthroughs**: tutorial framework with per-user completion tracking.
- **M3 TO-AGG-003 Reference materials**: Help Center with guides/FAQ.
- **M4 UI-AGG-006 Support/feedback**: support_requests table, server functions, admin response UI.
- **M5 DM-AGG-003 Data catalog/index**: catalog schema + search UI.
- **M6 DM-AGG-004 Data quality monitoring**: cron checks + dashboard.
- **M7 RP-AGG-005 Analytics charts/pivots**: extend report builder to support pivots and charts.

## Requirement context (SIN-REQUIREMENTS + system addendum)

- **TO-AGG-001**: centralized templates tab + contextual template access from data entry items.
- **TO-AGG-002**: onboarding + data upload tutorials; users can complete tasks independently.
- **TO-AGG-003**: categorized guides and FAQ for self-serve support.
- **UI-AGG-006**: users submit support inquiries/feedback; admins respond in managed interface.
- **DM-AGG-003**: data cataloging/indexing for discoverability (admin-accessible).
- **DM-AGG-004**: continuous monitoring with automated data quality checks.
- **RP-AGG-005**: self-service charts/pivots + export (CSV/Excel, optional JSON).

## Decisions applied

- **D0.15 (ADR 2025-12-26)**: build once, deploy everywhere (no staged tenant rollout).
- **D0.16 (ADR 2025-12-26)**: full pivot builder with charts + export using
  `echarts-for-react`, `@tanstack/react-table`, `@tanstack/react-virtual`, `@dnd-kit`.

## Implementation expectations (from 5-implementation)

- Template hub: new `src/features/templates/*`, DB schema, S3 storage, routes,
  and contextual links from forms/imports/reporting.
- Walkthroughs: lightweight tutorial framework + per-user completion tracking,
  surfaced on first visit.
- Help Center: guides/FAQ stored in DB or docs.
- Support requests: table + server functions + admin response UI.
- Data catalog: `data_catalog_entries` table with metadata from forms/imports/
  reports + search UI.
- Data quality: cron job scanning invalid submissions + summary dashboard.
- Analytics charts/pivots: extend existing report builder (`src/features/reports/`).
