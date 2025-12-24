import { createServerOnlyFn } from "@tanstack/react-start";
import { sendNotification, type NotificationDispatch } from "./send";

type EnqueueResult =
  | { mode: "direct"; inApp: boolean; email: boolean; notificationId: string }
  | { mode: "sqs"; queued: true; messageId: string | null; notificationId: string };

export const enqueueNotification = createServerOnlyFn(
  async (payload: NotificationDispatch): Promise<EnqueueResult> => {
    const { randomUUID } = await import("crypto");

    const notificationId = payload.notificationId ?? randomUUID();
    const enriched: NotificationDispatch = {
      ...payload,
      notificationId,
      metadata: {
        ...(payload.metadata ?? {}),
        notificationId,
      },
    };

    const queueUrl = process.env["SIN_NOTIFICATIONS_QUEUE_URL"];
    if (!queueUrl) {
      // Dev fallback: direct send when queue URL not configured
      const result = await sendNotification(enriched);
      return { mode: "direct", ...result, notificationId };
    }

    const region = process.env["AWS_REGION"] ?? "ca-central-1";
    const { SQSClient, SendMessageCommand } = await import("@aws-sdk/client-sqs");

    const client = new SQSClient({ region });
    const body = JSON.stringify(enriched);

    const isFifo = queueUrl.endsWith(".fifo");

    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: body,
      ...(isFifo
        ? {
            MessageGroupId: enriched.userId,
            MessageDeduplicationId: notificationId,
          }
        : {}),
    });

    const resp = await client.send(command);
    return {
      mode: "sqs",
      queued: true,
      messageId: resp.MessageId ?? null,
      notificationId,
    };
  },
);
