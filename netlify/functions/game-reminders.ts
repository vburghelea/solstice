// Netlify Scheduled Function: Game Reminders (24h and 2h windows)
// Runs every 15 minutes and sends reminders for upcoming games to approved participants.

export const config = {
  schedule: "*/15 * * * *", // every 15 minutes
};

export default async function handler() {
  try {
    const [{ and, eq, sql }, { getDb }] = await Promise.all([
      import("drizzle-orm"),
      import("~/db/server-helpers"),
    ]);
    const db = await getDb();
    const { games, gameParticipants, user, emailEvents } = await import("~/db/schema");
    const { sendGameReminder } = await import("~/lib/email/resend");
    // const { getBaseUrl } = await import("~/lib/env.server");

    const now = new Date();
    const minutes = 15; // scheduler cadence

    // Build windows around 24h and 2h ahead (+/- cadence/2)
    const window = (hoursAhead: number) => {
      const center = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
      const half = (minutes / 2) * 60 * 1000;
      return {
        start: new Date(center.getTime() - half),
        end: new Date(center.getTime() + half),
      };
    };

    const w24 = window(24);
    const w2 = window(2);

    // Query scheduled games within either window
    const upcoming = await db
      .select({
        id: games.id,
        name: games.name,
        dateTime: games.dateTime,
        location: games.location,
      })
      .from(games)
      .where(
        and(
          eq(games.status, "scheduled"),
          // dateTime in either [w2] OR [w24]
          sql`(${games.dateTime} BETWEEN ${w2.start} AND ${w2.end}) OR (${games.dateTime} BETWEEN ${w24.start} AND ${w24.end})`,
        ),
      );

    if (!upcoming.length) return new Response("No upcoming windows", { status: 200 });

    // For each game, get approved participants with emails and send reminder
    for (const g of upcoming) {
      // Determine window tag for idempotency ("24h" or "2h")
      const dt = new Date(g.dateTime as unknown as string);
      const diffHours = Math.abs((dt.getTime() - now.getTime()) / 3600000);
      const tag = Math.abs(diffHours - 24) < 0.5 ? "24h" : "2h";
      const participants = await db
        .select({
          email: user.email,
          name: user.name,
          status: gameParticipants.status,
          notificationPreferences: user.notificationPreferences,
        })
        .from(gameParticipants)
        .innerJoin(user, eq(user.id, gameParticipants.userId))
        .where(
          and(eq(gameParticipants.gameId, g.id), eq(gameParticipants.status, "approved")),
        );

      type NotifPrefs = (typeof user.$inferSelect)["notificationPreferences"];
      const recipients = participants
        .filter((p) => !!p.email)
        .filter((p) => {
          const prefs = p.notificationPreferences as NotifPrefs | null;
          return prefs?.gameReminders !== false; // default true
        })
        .map((p) => ({ email: p.email!, name: p.name ?? undefined }));

      if (recipients.length === 0) continue;

      type GameLocation = { address?: string } | null;
      const location = g.location as unknown as GameLocation;
      const locationText = location?.address ?? "See details page";
      // Idempotency + pacing: process recipients in batches
      const { paceBatch } = await import("~/lib/pacer/server");
      await paceBatch(recipients, { batchSize: 15, delayMs: 1000 }, async (r) => {
        const dedupeKey = `game_reminder_${tag}:${g.id}:${r.email}`;
        const [existing] = await db
          .select({ id: emailEvents.id })
          .from(emailEvents)
          .where(eq(emailEvents.dedupeKey, dedupeKey))
          .limit(1);
        if (existing) return;

        const res = await sendGameReminder({
          to: r,
          gameName: g.name,
          dateTime: new Date(g.dateTime as unknown as string),
          location: locationText,
        });
        if (res.success) {
          await db.insert(emailEvents).values({
            dedupeKey,
            type: `game_reminder_${tag}`,
            entityId: String(g.id),
            recipientEmail: r.email,
          });
        }
      });
    }

    return new Response("Game reminders processed", { status: 200 });
  } catch (error) {
    console.error("Scheduled function game-reminders failed:", error);
    return new Response("Error", { status: 500 });
  }
}
