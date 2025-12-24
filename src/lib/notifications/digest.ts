import { createServerOnlyFn } from "@tanstack/react-start";
import type { JsonRecord } from "~/shared/lib/json";

const DIGEST_WINDOWS_MS: Record<string, number> = {
  daily_digest: 24 * 60 * 60 * 1000,
  weekly_digest: 7 * 24 * 60 * 60 * 1000,
};

const buildDigestBody = (
  items: Array<{
    title: string;
    link: string | null;
    createdAt: Date;
  }>,
) => {
  const lines = ["Recent notifications:", ""];

  items.forEach((item) => {
    const timestamp = item.createdAt.toLocaleString();
    const linkLine = item.link ? ` (${item.link})` : "";
    lines.push(`- ${timestamp}: ${item.title}${linkLine}`);
  });

  return lines.join("\n");
};

export const processNotificationDigests = createServerOnlyFn(async () => {
  const { getDb } = await import("~/db/server-helpers");
  const { notificationPreferences, notifications } = await import("~/db/schema");
  const { and, desc, eq, gte, inArray, sql } = await import("drizzle-orm");
  const { sendDigestEmail } = await import("~/lib/notifications/send");
  const { logDataChange } = await import("~/lib/audit");

  const db = await getDb();
  const now = new Date();

  const preferences = await db
    .select()
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.channelEmail, true),
        inArray(notificationPreferences.emailFrequency, [
          "daily_digest",
          "weekly_digest",
        ]),
      ),
    );

  let sent = 0;
  let skipped = 0;

  for (const preference of preferences) {
    const windowMs = DIGEST_WINDOWS_MS[preference.emailFrequency ?? ""] ?? null;
    if (!windowMs) continue;

    const windowStart = new Date(now.getTime() - windowMs);

    const digestSentAtExpr = sql<string>`(${notifications.metadata} ->> 'digestSentAt')`;
    const rows = await db
      .select({
        id: notifications.id,
        title: notifications.title,
        link: notifications.link,
        createdAt: notifications.createdAt,
        metadata: notifications.metadata,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, preference.userId),
          eq(notifications.category, preference.category),
          gte(notifications.createdAt, windowStart),
          sql`${digestSentAtExpr} IS NULL`,
        ),
      )
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    if (rows.length === 0) {
      skipped += 1;
      continue;
    }

    const subject = `You have ${rows.length} ${preference.category} updates`;
    const body = buildDigestBody(rows);

    const result = await sendDigestEmail({
      userId: preference.userId,
      subject,
      bodyText: body,
    });

    if (!result.sent) {
      skipped += 1;
      continue;
    }

    const digestTimestamp = now.toISOString();
    for (const row of rows) {
      const metadata = (row.metadata as JsonRecord | null) ?? {};
      await db
        .update(notifications)
        .set({ metadata: { ...metadata, digestSentAt: digestTimestamp } })
        .where(eq(notifications.id, row.id));
    }

    await logDataChange({
      action: "NOTIFICATION_DIGEST_SENT",
      actorUserId: preference.userId,
      targetType: "notification_digest",
      targetId: preference.userId,
      metadata: {
        category: preference.category,
        count: rows.length,
        window: preference.emailFrequency,
      },
    });

    sent += 1;
  }

  return { sent, skipped };
});
