# Worklog — Stream I - Notifications and email integrity

## Instructions

- Use `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md` (Stream I - Notifications and email integrity) as the source of truth.
- Keep this log updated during implementation and link any new ADRs.
- Follow TanStack Start server-only import patterns.
- Run `pnpm lint` and `pnpm check-types` before completing large task batches.
- Use Playwright MCP for UI verification when applicable.

## Scope (from consolidated backlog)

- [ ] I1 Lock down createNotification (session or server-only); set audit actor
      from session or system.
- [ ] I2 Require admin for template creation and scheduling; force isSystem=false
      for non-admins.
- [ ] I3 Fix audit actor for dispatch/digest; keep recipient in metadata/target.
- [ ] I4 Add email idempotency tracking when in-app notifications are disabled.
- [ ] I5 Support scheduled org/role broadcasts by resolving recipients when
      userId is null.
- [ ] I6 Enforce SES-only in SIN production; document SendGrid policy.

## Dependencies

- See `docs/sin-rfp/worklogs/master.md`.

## Questions for User

## Decisions Made

## Blockers

## Files Modified This Session

## Session Log

### 2025-12-27: Session Start

- Initialized worklog.
