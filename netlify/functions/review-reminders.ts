// Netlify Scheduled Function: Review Reminders
// Runs daily at 09:30 UTC and asks players to review their GM for completed games.

export const config = {
  schedule: "30 9 * * *",
};

export default async function handler() {
  try {
    const [{ and, eq, gte, lt, sql }, { getDb }] = await Promise.all([
      import("drizzle-orm"),
      import("~/db/server-helpers"),
    ]);
    const db = await getDb();
    const { games, gameParticipants } = await import("~/db/schema/games.schema");
    const { gmReviews } = await import("~/db/schema/social.schema");
    const { user } = await import("~/db/schema/auth.schema");
    const { emailEvents } = await import("~/db/schema/notifications.schema");
    const { sendReviewReminder } = await import("~/lib/email/resend");
    const { getBaseUrl } = await import("~/lib/env.server");

    const baseUrl = getBaseUrl();
    const now = new Date();
    // Look back 7 days for completed games
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Completed games in last 7 days
    const completedGames = await db
      .select({
        id: games.id,
        name: games.name,
        ownerId: games.ownerId,
        dateTime: games.dateTime,
      })
      .from(games)
      .where(
        and(
          eq(games.status, "completed"),
          gte(games.dateTime, sevenDaysAgo),
          lt(games.dateTime, now),
        ),
      );

    for (const g of completedGames) {
      // Approved participants excluding the GM (owner)
      const participants = await db
        .select({
          reviewerId: user.id,
          reviewerEmail: user.email,
          reviewerName: user.name,
          notificationPreferences: user.notificationPreferences,
        })
        .from(gameParticipants)
        .innerJoin(user, eq(user.id, gameParticipants.userId))
        .where(
          and(
            eq(gameParticipants.gameId, g.id),
            eq(gameParticipants.status, "approved"),
            sql`${user.id} <> ${g.ownerId}`,
          ),
        );

      const { paceBatch } = await import("~/lib/pacer/server");
      type NotifPrefs = (typeof user.$inferSelect)["notificationPreferences"];
      await paceBatch(participants, { batchSize: 15, delayMs: 1000 }, async (p) => {
        if (!p.reviewerEmail) return;
        const prefs = p.notificationPreferences as NotifPrefs | null;
        if (prefs?.reviewReminders === false) return; // default true
        // Has a review already?
        const [existingReview] = await db
          .select({ id: gmReviews.id })
          .from(gmReviews)
          .where(and(eq(gmReviews.reviewerId, p.reviewerId), eq(gmReviews.gameId, g.id)))
          .limit(1);
        if (existingReview) return;

        const reviewUrl = `${baseUrl}/games/${g.id}#review`;
        const dedupeKey = `review_reminder:${g.id}:${p.reviewerEmail}`;
        const [existingEvent] = await db
          .select({ id: emailEvents.id })
          .from(emailEvents)
          .where(eq(emailEvents.dedupeKey, dedupeKey))
          .limit(1);
        if (existingEvent) return;

        const res = await sendReviewReminder({
          to: { email: p.reviewerEmail, name: p.reviewerName ?? undefined },
          gmName: "Game Master",
          gameName: g.name,
          dateTime: new Date(g.dateTime as unknown as string),
          reviewUrl,
        });
        if (res.success) {
          await db.insert(emailEvents).values({
            dedupeKey,
            type: "review_reminder",
            entityId: String(g.id),
            recipientEmail: p.reviewerEmail,
          });
        }
      });
    }

    return new Response("Review reminders processed", { status: 200 });
  } catch (error) {
    console.error("Scheduled function review-reminders failed:", error);
    return new Response("Error", { status: 500 });
  }
}
