# Stream I Context (Notifications and email integrity)

## Sources reviewed

- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md`
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/d0-decision-analysis.md`
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/4b.md`
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/4b-implementation.md`
- `docs/sin-rfp/decisions/ADR-2025-12-26-d0-3-create-notification-exposure.md`
- `docs/sin-rfp/decisions/ADR-2025-12-26-d0-14-email-provider-policy.md`

## Stream I scope (from consolidated backlog)

- I1 Lock down createNotification (session or server-only); set audit actor from
  session or system.
- I2 Require admin for template creation and scheduling; force isSystem=false for
  non-admins.
- I3 Fix audit actor for dispatch/digest; keep recipient in metadata/target.
- I4 Add email idempotency tracking when in-app notifications are disabled.
- I5 Support scheduled org/role broadcasts by resolving recipients when userId is
  null.
- I6 Enforce SES-only in SIN production; document SendGrid policy.

## Findings and impacts (4b + D0 analysis)

- createNotification was client-callable and could spoof audit actor; D0.3
  decision is to make it server-only and add an admin-only manual send endpoint.
- Template creation and scheduling lacked admin enforcement (now required per
  backlog) and should prevent non-admin system templates.
- Audit records for NOTIFICATION_DISPATCH and NOTIFICATION_DIGEST_SENT attribute
  the recipient as the actor; actor should be system or initiating admin, with
  recipient stored on target/metadata.
- Email idempotency is tied to notifications metadata, so when in-app is disabled
  (no notification row), email retries can duplicate sends.
- Scheduled notifications schema supports organizationId/roleFilter, but the
  processor throws when userId is null, blocking org/role broadcasts.
- SendGrid usage is still active when SENDGRID_API_KEY is set; SIN requires SES
  only (data residency). D0.14 decision recommends SES everywhere or explicit
  guards in production.

## Implementation guidance to carry forward

- Create a server-only notification creation helper and a separate admin-only
  endpoint (with step-up) for manual notifications (ADR D0.3).
- Update audit logging for dispatch/digest to use actorUserId = null (system) or
  explicit initiating actor; store recipient in targetId/metadata.
- Track email delivery idempotency in a dedicated table or a dispatch record
  even when in-app is disabled (4b finding #25).
- Resolve scheduled broadcasts by selecting active organization members with
  optional roleFilter and enqueue per-user with stable notificationIds.
- Enforce SES-only for SIN production and document SendGrid usage policy (ADR
  D0.14).
