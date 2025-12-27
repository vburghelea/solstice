# ADR-2025-12-26-d0-16-analytics-charts-pivots-scope: Analytics charts and pivots scope

Status: Accepted
Date: 2025-12-26

## Decision

Deliver a full pivot builder with charts and export using Apache ECharts
(via `echarts-for-react`), @tanstack/react-table, @tanstack/react-virtual, and
@dnd-kit. Keep server-side aggregation and existing XLSX export.

## Context

- This decision maps to D0.16 in `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`.
- See `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md` for options
  and rationale.

## Options considered

- See the D0.16 section in `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md`.

## Rationale

- Aligns with the recommended choice documented in the D0 analysis.

## Consequences

- Unblocks Stream M work.
- Requires implementation updates and tests per the consolidated backlog.
- Library choices: Apache ECharts via `echarts-for-react`, @tanstack/react-table +
  @tanstack/react-virtual (pivot table rendering/virtualization), @dnd-kit
  (pivot builder drag/drop), existing xlsx for Excel export.

## Links

- `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md`
- `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`
