import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { eventRegistrations, events, teams, user } from "~/db/schema";

type Db = Awaited<ReturnType<(typeof import("~/db/server-helpers"))["getDb"]>>;

export async function sendEventCancellationNotifications(params: {
  db: Db;
  event: InferSelectModel<typeof events>;
  reason?: string;
}) {
  const { db, event, reason } = params;

  const registrants = await db
    .select({
      registrationId: eventRegistrations.id,
      userEmail: user.email,
      userName: user.name,
      teamName: teams.name,
    })
    .from(eventRegistrations)
    .leftJoin(user, eq(eventRegistrations.userId, user.id))
    .leftJoin(teams, eq(eventRegistrations.teamId, teams.id))
    .where(eq(eventRegistrations.eventId, event.id));

  console.log(
    `[Notifications] Event "${event.name}" cancelled${
      reason ? ` — Reason: ${reason}` : ""
    }. Notifying ${registrants.length} registrants.`,
  );

  return { notified: registrants.length };
}
