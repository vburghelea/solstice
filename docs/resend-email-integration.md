# Resend Email Integration

> This document replaces the legacy email integration notes and mirrors the content in
> [`docs/email-system-usage-with-resend.md`](./email-system-usage-with-resend.md) for
> teams that still reference this path.

## Overview

The Roundup Games platform now uses [Resend](https://resend.com/) for all transactional
and notification emails. The service is wrapped in typed helpers that select a mock
implementation when credentials are absent so local development never sends real
messages.

## Implementation Status

- **Status**: ✅ Active (March 2025)
- **Package**: `resend` SDK v2+
- **Type**: Transactional emails with roadmap for digests
- **Environments**: Mock (development/test) and live (preview/production)

## Environment Variables

```env
RESEND_API_KEY=your-api-key
RESEND_FROM_EMAIL=noreply@roundup.games
RESEND_FROM_NAME=Roundup Games
WELCOME_EMAIL_ENABLED=true   # optional toggle
INVITE_EMAIL_ENABLED=true    # optional toggle
```

When `RESEND_API_KEY` is missing or `NODE_ENV` is set to `test`, the platform loads the
mock sender that logs payloads to stdout. Preview builds and production require verified
sender domains configured inside Resend.

## Code Architecture

Email helpers live in `src/lib/email/resend.ts` and expose strongly typed functions such
as `sendTeamInvitationEmail` and `sendMembershipPurchaseReceipt`. Each helper:

1. Validates inputs with Zod before sending.
2. Normalizes `from` values using `RESEND_FROM_EMAIL`/`RESEND_FROM_NAME`.
3. Logs a correlation ID for observability.
4. Falls back to the mock sender when credentials are unavailable.

The helpers are loaded via `serverOnly()` and dynamic imports inside server functions to
ensure the Resend SDK never reaches the client bundle.

## Templates & Previewing

Email templates are written in TypeScript/JSX and live alongside the senders. During
development you can preview renders at the `/dev/emails` route, which shows the HTML and
text versions used in Resend API calls.

## Usage Example

```ts
import { sendTeamInvitationEmail } from "~/lib/email/resend";

await sendTeamInvitationEmail({
  to: { email: "captain@example.com", name: "Team Captain" },
  teamName: "Roundup Games Demo",
  teamSlug: "roundup-demo",
  invitedByName: "Avery Admin",
  invitedByEmail: "avery@roundup.games",
});
```

## Testing

- Unit test senders with mocks under `src/lib/email/__tests__`.
- Use `pnpm test` to run the suite; the mock sender ensures deterministic output.
- For end-to-end verification, run preview deployments and check Resend activity logs.

## Additional Resources

- [Email System Usage with Resend](./email-system-usage-with-resend.md)
- [Resend Dashboard](https://resend.com/dashboard)
- [Notification Feature Flags](../rate-limiting-with-pacer.md)
