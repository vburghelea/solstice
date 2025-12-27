# ADR-2025-12-26-d0-4-forms-multifile-support: Forms multi-file support

Status: Accepted
Date: 2025-12-26

## Decision

Clamp file uploads to maxFiles = 1 and reject array payloads until multi-file support is implemented end-to-end.

## Context

- This decision maps to D0.4 in `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`.
- See `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md` for options
  and rationale.

## Options considered

- See the D0.4 section in `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md`.

## Rationale

- Aligns with the recommended choice documented in the D0 analysis.

## Consequences

- Unblocks Stream D work.
- Requires implementation updates and tests per the consolidated backlog.

## Links

- `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md`
- `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`
