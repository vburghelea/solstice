// Netlify Scheduled Function: Campaign Weekly Digest
// Runs every Monday at 09:00 UTC and sends a digest of upcoming sessions

export const config = {
  schedule: "0 9 * * MON",
};

export default async function handler() {
  try {
    const [{ and, between, eq }, { getDb }] = await Promise.all([
      import("drizzle-orm"),
      import("~/db/server-helpers"),
    ]);
    const { buildCampaignDigestItemsHtml } = await import("~/shared/lib/campaign-digest");
    const db = await getDb();
    const { campaigns } = await import("~/db/schema/campaigns.schema");
    const { games, gameParticipants } = await import("~/db/schema/games.schema");
    const { user } = await import("~/db/schema/auth.schema");
    const { emailEvents } = await import("~/db/schema/notifications.schema");
    const { sendCampaignDigest } = await import("~/lib/email/resend");
    const { getBaseUrl } = await import("~/lib/env.server");

    const baseUrl = getBaseUrl();
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Find active campaigns
    const activeCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.status, "active"));

    for (const camp of activeCampaigns) {
      // Find next week's sessions for the campaign
      const sessions = await db
        .select({
          id: games.id,
          name: games.name,
          dateTime: games.dateTime,
          location: games.location,
        })
        .from(games)
        .where(and(eq(games.campaignId, camp.id), between(games.dateTime, now, in7)));

      if (sessions.length === 0) continue;

      // Build itemsHtml (safe escaping)
      const itemsHtml = buildCampaignDigestItemsHtml(
        sessions.map((s) => {
          const dt = new Date(s.dateTime as unknown as string).toLocaleString("en-US");
          type GameLocation = { address?: string } | null;
          const loc = (s.location as unknown as GameLocation)?.address || "See details";
          return {
            name: s.name,
            dateTime: dt,
            location: loc,
            url: `${baseUrl}/games/${s.id}`,
          };
        }),
      );

      // Recipients: approved campaign participants
      const participants = await db
        .select({
          email: user.email,
          name: user.name,
          notificationPreferences: user.notificationPreferences,
        })
        .from(gameParticipants)
        .innerJoin(user, eq(user.id, gameParticipants.userId))
        .where(
          and(
            eq(gameParticipants.status, "approved"),
            eq(gameParticipants.gameId, sessions[0].id),
          ),
        ) // use any session's participants set
        .limit(1000);

      type NotifPrefs = (typeof user.$inferSelect)["notificationPreferences"];
      const seen = new Set<string>();
      const recipients = participants
        .filter((p) => !!p.email)
        .filter((p) => {
          const prefs = p.notificationPreferences as NotifPrefs | null;
          return prefs?.campaignDigests !== false; // default true
        })
        .filter((p) => (seen.has(p.email!) ? false : (seen.add(p.email!), true)))
        .map((p) => ({ email: p.email!, name: p.name ?? undefined }));

      if (recipients.length === 0) continue;

      const manageUrl = `${baseUrl}/campaigns/${camp.id}`;
      const { paceBatch } = await import("~/lib/pacer/server");
      await paceBatch(recipients, { batchSize: 15, delayMs: 1000 }, async (r) => {
        const dedupeKey = `campaign_digest_week:${camp.id}:${r.email}:${now
          .toISOString()
          .slice(0, 10)}`;
        const [existing] = await db
          .select({ id: emailEvents.id })
          .from(emailEvents)
          .where(eq(emailEvents.dedupeKey, dedupeKey))
          .limit(1);
        if (existing) return;

        const res = await sendCampaignDigest({
          to: r,
          itemsHtml,
          manageUrl,
          recipientName: r.name,
        });
        if (res.success) {
          await db.insert(emailEvents).values({
            dedupeKey,
            type: "campaign_digest_week",
            entityId: String(camp.id),
            recipientEmail: r.email,
          });
        }
      });
    }

    return new Response("Campaign digests processed", { status: 200 });
  } catch (error) {
    console.error("Scheduled function campaign-digest failed:", error);
    return new Response("Error", { status: 500 });
  }
}
