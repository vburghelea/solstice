# ADR-2025-12-26-d0-1-saved-reports-null-org-scope: Saved reports null-org scope

Status: Accepted
Date: 2025-12-26

## Decision

Treat organizationId = null as personal scope (owner-only), with global admin override.

## Context

- This decision maps to D0.1 in `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`.
- See `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md` for options
  and rationale.

## Options considered

- See the D0.1 section in `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md`.

## Rationale

- Aligns with the recommended choice documented in the D0 analysis.

## Consequences

- Unblocks Stream C work.
- Requires implementation updates and tests per the consolidated backlog.

## Links

- `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md`
- `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`
