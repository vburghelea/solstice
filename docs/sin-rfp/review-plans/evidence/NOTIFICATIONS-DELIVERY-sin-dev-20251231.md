# SIN Notifications Delivery Evidence (sin-dev)

Date: 2025-12-31
Environment: sin-dev (localhost:5173)

## Steps

1. Verified SES identity for `austinwallacetech@gmail.com` (sandbox recipient + sender).
2. Updated user `sin-user-pso-admin-001` email to `austinwallacetech@gmail.com`.
3. Inserted a `reporting_reminder` scheduled notification and processed it with
   `SIN_NOTIFICATIONS_FROM_EMAIL` set to the verified identity.

## Command

```bash
AWS_PROFILE=techdev \
  SIN_NOTIFICATIONS_FROM_EMAIL=austinwallacetech@gmail.com \
  SIN_NOTIFICATIONS_REPLY_TO_EMAIL=austinwallacetech@gmail.com \
  npx sst shell --stage sin-dev -- \
  npx tsx -e "/* insert scheduled notification + processScheduledNotifications */"
```

## Result

- `notification_email_deliveries` logged a successful send:
  - messageId: `010d019b7335d080-ec0707e9-2486-4a16-8f0e-65af0cb1323f-000000`
  - sentAt: `2025-12-31T07:01:05.332Z`
  - userId: `sin-user-pso-admin-001`

## Receipt confirmation

- Delivered to `austinwallacetech@gmail.com` (recipient confirmed receipt).
