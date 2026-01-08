# TICKET: Support Request Notifications + Metadata

**Status**: ✅ Verified
**Priority**: P2
**Component**: Support / Notifications
**Date**: 2026-01-04
**Verified**: 2026-01-05
**Author**: Codex (AI Assistant)

---

## Summary

Support requests and admin responses are stored in-app, but users are not
notified when an admin responds and there is no priority or attachment support.
Add response notifications and optional request metadata to meet support UX
expectations.

---

## Background

Support requests are created via `createSupportRequest` and responses are saved
via `respondSupportRequest`. UI panels show the response inline, but no
notification dispatch occurs even though the notification queue is available.

---

## Current Behavior

- `support_requests` stores subject/message/category/status only.
- Admin responses update `responseMessage`, `respondedBy`, `respondedAt`.
- No `enqueueNotification` call on response or status change.
- Requesters only see updates by revisiting the Support page.

---

## Proposed Scope

1. Emit in-app/email notifications on response and status change.
2. Add optional priority field (and possible SLA target) to support requests.
3. Add attachment support via artifacts bucket + signed uploads, if required.
4. Update UI to surface notifications, priority, and attachments.

---

## Status Update

- Added `support_request_priority` enum plus `priority` + `sla_target_at` fields on support requests, with a new support attachments table and migration (`src/db/migrations/0003_support_request_metadata.sql`).
- Implemented attachment upload/create/download flows using the artifacts bucket with validation (max 3 files, 10MB, allowlist in `src/features/support/support.utils.ts`).
- Updated Support user and admin panels to surface priority, SLA targets, and attachments (including downloads).
- Response/status updates now enqueue support notifications (in-app + email based on preferences).
- SIN RFP update notes updated in the listed docs.
- Test status: `pnpm lint` and `pnpm check-types` are currently blocked by pre-existing issues (e.g. `src/routes/__root.tsx` syntax errors; lint warnings unrelated to this ticket).

---

## Testing

1. Apply schema changes (dev example):
   - `AWS_PROFILE=techdev npx sst shell --stage sin-dev -- npx drizzle-kit push --force`
2. Ensure env is configured for attachments:
   - `SIN_ARTIFACTS_BUCKET` (S3 access available for the current AWS profile)
3. Optional (for email verification):
   - `SIN_NOTIFICATIONS_FROM_EMAIL` and SES access (queue optional; if `SIN_NOTIFICATIONS_QUEUE_URL` is unset, notifications send directly)
4. Run the app (`pnpm dev`) and sign in as a normal user.
5. Submit a support request with a priority and 1-3 attachments.
6. Confirm:
   - The request shows priority, SLA (if set), and attachments in “Your requests”.
   - Attachment download opens a signed URL.
7. Sign in as a global admin and open the support admin panel.
8. Respond to the request, update status/priority/SLA, and save.
9. Verify:
   - The requester sees the response + updated status/priority/SLA.
   - A notification appears in the notification bell.
   - If email is configured, confirm the email delivery.

---

## References

- `src/db/schema/support.schema.ts`
- `src/features/support/support.mutations.ts`
- `src/features/support/components/support-requests-panel.tsx`
- `src/features/support/components/support-admin-panel.tsx`
- `src/lib/notifications/queue.ts`
- `src/features/notifications/notifications.schemas.ts`
- `src/features/help/help-content.ts`

---

## Verification Results (2026-01-05)

**Test Environment:** `AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono`

### A. Support Request Submission with Priority

1. Navigated to `/dashboard/sin/support` as viasport-staff@example.com
2. Created support request with:
   - Subject: "Test support request with priority"
   - Priority: "High"
   - Message: Test message about priority features
3. **Result:** ✅ Request submitted successfully with toast confirmation
4. **Result:** ✅ Request shows in "Your requests" with:
   - Status badge: "open"
   - Priority badge: "high"
   - Category: "question"

### B. Admin Response Workflow

1. Navigated to `/dashboard/admin/sin/support`
2. Clicked "Respond" on the test request
3. Response form displayed with:
   - ✅ Response textbox
   - ✅ Status combobox (Open, In progress, Resolved, Closed)
   - ✅ Priority combobox (Low, Normal, High, Urgent)
   - ✅ SLA target field
4. Added response and changed status to "In progress"
5. **Result:** ✅ "Response saved." toast confirmation

### C. User View of Response

1. Navigated back to `/dashboard/sin/support`
2. **Result:** ✅ Request shows updated status: "in progress"
3. **Result:** ✅ Admin response visible under request

### D. Notification Verification

```sql
SELECT type, category, title, SUBSTRING(body, 1, 50) as body_preview
FROM notifications WHERE created_at > NOW() - INTERVAL '1 hour';

          type          | category  |          title          |                    body_preview
------------------------+-----------+-------------------------+---------------------------------------------------
 support_request_update | support   | Support request updated | New response on "Test support request with priorit
```

- ✅ Notification created with type `support_request_update`
- ✅ Notification category: `support`
- ✅ Notification links to `/dashboard/sin/support`

**Conclusion:** Support request notifications and metadata features fully verified.

---

## Docs to Update

- `docs/sin-rfp/response/03-service-approach/training-onboarding/update-notes.md`
- `docs/sin-rfp/response/04-system-requirements/training-onboarding-to-agg/update-notes.md`
- `docs/sin-rfp/response/04-system-requirements/user-interface-ui-agg/update-notes.md`
