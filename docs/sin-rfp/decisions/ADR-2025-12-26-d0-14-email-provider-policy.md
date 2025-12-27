# ADR-2025-12-26-d0-14-email-provider-policy: Email provider policy

Status: Accepted
Date: 2025-12-26

## Decision

Use SES for all tenants/environments and remove SendGrid usage.

## Context

- This decision maps to D0.14 in `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`.
- See `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md` for options
  and rationale.

## Options considered

- See the D0.14 section in `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md`.

## Rationale

- Aligns with the recommended choice documented in the D0 analysis.

## Consequences

- Unblocks Stream I work.
- Requires implementation updates and tests per the consolidated backlog.

## Links

- `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md`
- `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`
