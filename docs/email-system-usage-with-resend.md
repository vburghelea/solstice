# Email System Usage with Resend

This guide covers configuring and using the Resend-backed email system. It includes
environment setup, platform integration examples, and patterns for rate-limited batch
sends.

## Environment Setup

Set the following variables in Netlify or your local `.env`:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME`
- `WELCOME_EMAIL_ENABLED` (optional)
- `INVITE_EMAIL_ENABLED` (optional)

The Resend client is only loaded on the server. If `RESEND_API_KEY` is absent or the
environment is `test`, the mock email service logs payloads instead of sending.

## Sending Emails

Email senders live in `src/lib/email/resend.ts` and are exposed via server functions.
Use `serverOnly()` or dynamic imports so server-only modules stay out of the client
bundle.

```ts
import { serverOnly } from "@tanstack/react-start";
import { createServerFn } from "@tanstack/start";

const sendGameInvite = serverOnly(async () => {
  const { sendGameInvitation } = await import("~/lib/email/resend");
  return sendGameInvitation;
});

export const inviteToGame = createServerFn()
  .validator(z.object({ email: z.string().email(), gameId: z.string() }).parse)
  .handler(async ({ data }) => {
    const send = await sendGameInvite();
    await send({ ...data, gameName: "Demo", expiresAt: new Date() });
  });
```

## Rate-Limited Batch Sends

Scheduled jobs and bulk operations should throttle dispatches with the `paceBatch`
helper. It caps bursts at 15 emails per second while maintaining throughput.

```ts
import { paceBatch } from "~/shared/lib/pacer";

await paceBatch(participants, 15, (p) => sendReminder(p));
```

## Integration with Platform Events

Server functions trigger emails for domain events:

- Membership purchases send receipts.
- Game and campaign invitations send after participant creation.
- Status updates use `summarizeEventChanges` to describe diffs.
- Scheduled Netlify functions send reminders and weekly digests.

Each sender logs a correlation ID and masks recipient addresses to protect PII.

## Smoke Testing

During development, use the mock service and preview templates at `/dev/emails`.
Logs show the rendered HTML and metadata for verification.

## Deployment

1. Set the environment variables above in Netlify.
2. Run `pnpm lint`, `pnpm check-types`, and `pnpm test`.
3. Deploy to a preview environment and confirm logs and email flows.
4. Promote the preview once validation passes.

## Best Practices

- Keep senders server-only and strongly typed.
- Validate payloads with Zod before calling senders.
- Respect user notification preferences.
- Use Pacer for all rate-limited paths.
- Monitor structured logs for successes and failures.
