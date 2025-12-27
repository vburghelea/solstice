# ADR-2025-12-26-d0-8-import-error-retention: Import rollback error retention

Status: Accepted
Date: 2025-12-26

## Decision

Sanitize import errors on rollback: keep metadata, remove raw values.

## Context

- This decision maps to D0.8 in `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`.
- See `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md` for options
  and rationale.

## Options considered

- See the D0.8 section in `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md`.

## Rationale

- Aligns with the recommended choice documented in the D0 analysis.

## Consequences

- Unblocks Stream E work.
- Requires implementation updates and tests per the consolidated backlog.

## Links

- `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md`
- `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`
