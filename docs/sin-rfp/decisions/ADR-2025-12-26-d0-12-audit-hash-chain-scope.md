# ADR-2025-12-26-d0-12-audit-hash-chain-scope: Audit hash chain scope

Status: Accepted
Date: 2025-12-26

## Decision

Use a per-tenant audit hash chain with advisory locking for fork prevention.

## Context

- This decision maps to D0.12 in `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`.
- See `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md` for options
  and rationale.

## Options considered

- See the D0.12 section in `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md`.

## Rationale

- Aligns with the recommended choice documented in the D0 analysis.

## Consequences

- Unblocks Stream G work.
- Requires implementation updates and tests per the consolidated backlog.

## Links

- `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md`
- `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`
