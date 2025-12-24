import type { Context } from "aws-lambda";

export async function handler(_event: unknown, context?: Context) {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  const { processScheduledNotifications } = await import("~/lib/notifications/scheduler");
  const { processNotificationDigests } = await import("~/lib/notifications/digest");

  const [scheduled, digests] = await Promise.all([
    processScheduledNotifications(),
    processNotificationDigests(),
  ]);

  return { scheduled, digests };
}
