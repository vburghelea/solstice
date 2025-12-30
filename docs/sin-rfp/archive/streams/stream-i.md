# Worklog — Stream I - Notifications and email integrity

## Instructions

- Use `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md` (Stream I - Notifications and email integrity) as the source of truth.
- Keep this log updated during implementation and link any new ADRs.
- Follow TanStack Start server-only import patterns.
- Run `pnpm lint` and `pnpm check-types` before completing large task batches.
- Use Playwright MCP for UI verification when applicable.

## Scope (from consolidated backlog)

- [x] I1 Lock down createNotification (session or server-only); set audit actor
      from session or system.
- [x] I2 Require admin for template creation and scheduling; force isSystem=false
      for non-admins.
- [x] I3 Fix audit actor for dispatch/digest; keep recipient in metadata/target.
- [x] I4 Add email idempotency tracking when in-app notifications are disabled.
- [x] I5 Support scheduled org/role broadcasts by resolving recipients when
      userId is null.
- [x] I6 Enforce SES-only in SIN production; document SendGrid policy.

## Dependencies

- See `docs/sin-rfp/worklogs/master.md`.

## Questions for User

## Decisions Made

- Implemented ADR D0.3: createNotification is server-only with a separate
  admin-only manual dispatch endpoint (step-up enforced).
- Implemented ADR D0.14: SES-backed email service used everywhere; SendGrid
  disabled and documented.

## Blockers

## Files Modified This Session

- `docs/sin-rfp/archive/streams/stream-i-context.md`
- `docs/sin-rfp/worklogs/master.md`
- `docs/sin-rfp/decisions/ADR-2025-12-26-d0-14-email-provider-policy.md`
- `src/lib/notifications/create.ts`
- `src/features/notifications/notifications.mutations.ts`
- `src/lib/notifications/send.ts`
- `src/lib/notifications/digest.ts`
- `src/lib/notifications/scheduler.ts`
- `src/cron/notification-worker.ts`
- `src/db/schema/notifications.schema.ts`
- `src/db/migrations/0015_notification_email_deliveries.sql`
- `src/db/migrations/meta/_journal.json`
- `src/lib/email/sendgrid.ts`

## Session Log

### 2025-12-27: Session Start

- Initialized worklog.

### 2025-12-27: Stream I implementation

- Created `docs/sin-rfp/archive/streams/stream-i-context.md` summarizing Stream I
  findings and decisions.
- I1: Moved createNotification into a server-only helper and added an
  admin-only manual dispatch endpoint with step-up; audit actor now sourced from
  session or system.
- I2: Enforced admin + auth middleware on template create/update/delete and
  scheduling endpoints; isSystem defaults to false for new templates.
- I3: Corrected audit actor for dispatch/digest to system; stored recipient in
  audit metadata/target.
- I4: Added notification email delivery table + migration and wired
  sendNotification to track email idempotency even when in-app is disabled.
- I5: Scheduler now resolves org/role broadcast recipients and uses stable
  notification IDs per recipient with retry-safe handling.
- I6: Reworked email service to SES-only and documented SendGrid policy update
  in ADR.
- Follow-up (Stream H): consider adding notification email deliveries to DSAR
  erasure cleanup alongside notifications/preferences.
- `pnpm lint` fails due to pre-existing unused vars and a parsing error in
  privacy retention plus reports/organizations test warnings (see CLI output).
- `pnpm check-types` fails due to pre-existing privacy/reporting/reports/audit
  type errors.
