/**
 * SQS Consumer Worker for Notifications
 *
 * This handler processes notification messages from the SQS queue.
 * It's triggered by SQS events (either via Lambda SQS trigger or manual polling).
 */

import type { Context, SQSEvent, SQSRecord } from "aws-lambda";
import type { JsonRecord } from "~/shared/lib/json";

export type NotificationQueueMessage = {
  notificationId: string;
  userId: string;
  organizationId?: string | null;
  type: string;
  category: string;
  title: string;
  body: string;
  link?: string | null;
  metadata?: JsonRecord;
};

const processRecord = async (record: SQSRecord): Promise<void> => {
  const { sendNotification } = await import("~/lib/notifications/send");

  try {
    const message: NotificationQueueMessage = JSON.parse(record.body);

    await sendNotification({
      notificationId: message.notificationId,
      userId: message.userId,
      organizationId: message.organizationId ?? null,
      type: message.type,
      category: message.category,
      title: message.title,
      body: message.body,
      link: message.link ?? null,
      ...(message.metadata ? { metadata: message.metadata } : {}),
    });
  } catch (error) {
    console.error("[NotificationWorker] Failed to process message:", {
      messageId: record.messageId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // Re-throw to mark message for retry via SQS visibility timeout
    throw error;
  }
};

/**
 * Lambda handler for SQS-triggered execution.
 * Processes a batch of notification messages.
 */
export async function handler(
  event: SQSEvent,
  context?: Context,
): Promise<{
  batchItemFailures: Array<{ itemIdentifier: string }>;
}> {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  const failedIds: string[] = [];

  // Process all records concurrently
  const results = await Promise.allSettled(
    event.Records.map(async (record) => {
      try {
        await processRecord(record);
        return { success: true, messageId: record.messageId };
      } catch {
        return { success: false, messageId: record.messageId };
      }
    }),
  );

  // Collect failed message IDs for partial batch failure response
  for (const result of results) {
    if (result.status === "fulfilled" && !result.value.success) {
      failedIds.push(result.value.messageId);
    } else if (result.status === "rejected") {
      // Should not happen with our try/catch, but be safe
      console.error("[NotificationWorker] Unexpected rejection");
    }
  }

  console.log("[NotificationWorker] Batch complete:", {
    total: event.Records.length,
    succeeded: event.Records.length - failedIds.length,
    failed: failedIds.length,
  });

  // Return partial batch failure response
  // SQS will re-queue only the failed messages
  return {
    batchItemFailures: failedIds.map((id) => ({ itemIdentifier: id })),
  };
}
