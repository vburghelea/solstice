#!/usr/bin/env tsx
import dotenv from "dotenv";
import { eq, isNull, sql } from "drizzle-orm";
import { db } from "../src/db";
import {
  checkoutItems,
  checkoutSessions,
  eventPaymentSessions,
  eventRegistrations,
  registrationGroupMembers,
  registrationGroups,
} from "../src/db/schema";

type RosterPlayer = {
  userId?: string;
  name?: string;
  email?: string;
  role?: string;
  jerseyNumber?: string;
};

type RosterObject = {
  players?: RosterPlayer[];
  emergencyContact?: Record<string, unknown>;
};

if (!process.env["DATABASE_URL"]) {
  dotenv.config({ path: ".env" });
  dotenv.config({ path: ".env.e2e" });
}

const normalizeRoster = (roster: unknown): RosterPlayer[] => {
  if (!roster) return [];
  if (Array.isArray(roster)) {
    return roster.filter(Boolean) as RosterPlayer[];
  }
  if (typeof roster === "object" && roster !== null) {
    const rosterObj = roster as RosterObject;
    if (Array.isArray(rosterObj.players)) {
      return rosterObj.players.filter(Boolean);
    }
  }
  return [];
};

const mapGroupStatus = (status: string) => {
  if (status === "confirmed") return "confirmed";
  if (status === "cancelled") return "cancelled";
  return "pending";
};

const mapMemberStatus = (status: string) => {
  if (status === "confirmed") return "active";
  if (status === "cancelled") return "removed";
  return "pending";
};

const mapSessionStatus = (status: string | null | undefined) => {
  switch (status) {
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    case "refunded":
      return "refunded";
    default:
      return "pending";
  }
};

async function backfillRegistrationGroups() {
  const database = await db();

  const registrations = await database
    .select()
    .from(eventRegistrations)
    .where(isNull(eventRegistrations.registrationGroupId));

  if (registrations.length === 0) {
    console.log("No registrations missing registration_group_id.");
    return;
  }

  console.log(`Backfilling ${registrations.length} registrations...`);

  for (const registration of registrations) {
    await database.transaction(async (tx) => {
      const [group] = await tx
        .insert(registrationGroups)
        .values({
          eventId: registration.eventId,
          groupType: registration.registrationType === "team" ? "team" : "individual",
          status: mapGroupStatus(registration.status),
          captainUserId: registration.userId,
          teamId: registration.teamId ?? null,
          minSize: null,
          maxSize: null,
          metadata: {
            backfilledAt: new Date().toISOString(),
            registrationId: registration.id,
          },
        })
        .returning();

      await tx.insert(registrationGroupMembers).values({
        groupId: group.id,
        userId: registration.userId,
        role: "captain",
        status: mapMemberStatus(registration.status),
        invitedByUserId: registration.userId,
        invitedAt: registration.createdAt ?? new Date(),
        joinedAt: registration.status === "confirmed" ? new Date() : null,
      });

      const rosterPlayers = normalizeRoster(registration.roster);
      const seenUserIds = new Set([registration.userId]);

      for (const player of rosterPlayers) {
        if (player.userId && seenUserIds.has(player.userId)) {
          continue;
        }

        if (player.userId) {
          seenUserIds.add(player.userId);
        }

        const memberRow: typeof registrationGroupMembers.$inferInsert = {
          groupId: group.id,
          userId: player.userId ?? null,
          email: player.email ?? null,
          role: player.role === "captain" ? "captain" : "member",
          status: "pending",
          rosterMetadata: {
            name: player.name ?? null,
            jerseyNumber: player.jerseyNumber ?? null,
          },
          invitedByUserId: registration.userId,
          invitedAt: registration.createdAt ?? new Date(),
        };

        await tx.insert(registrationGroupMembers).values(memberRow);
      }

      await tx
        .update(eventRegistrations)
        .set({
          registrationGroupId: group.id,
          updatedAt: new Date(),
        })
        .where(eq(eventRegistrations.id, registration.id));
    });
  }
}

async function backfillCheckoutSessions() {
  const database = await db();

  const sessions = await database.select().from(eventPaymentSessions);
  if (sessions.length === 0) {
    console.log("No event payment sessions to backfill.");
    return;
  }

  console.log(`Backfilling ${sessions.length} payment sessions...`);

  for (const session of sessions) {
    const [existingSession] = await database
      .select({ id: checkoutSessions.id })
      .from(checkoutSessions)
      .where(eq(checkoutSessions.providerCheckoutId, session.squareCheckoutId))
      .limit(1);

    if (existingSession) {
      continue;
    }

    const [checkoutSession] = await database
      .insert(checkoutSessions)
      .values({
        userId: session.userId,
        provider: "square",
        providerCheckoutId: session.squareCheckoutId,
        providerCheckoutUrl: session.squarePaymentLinkUrl,
        providerOrderId: session.squareOrderId ?? null,
        providerPaymentId: session.squarePaymentId ?? null,
        status: mapSessionStatus(session.status),
        amountTotalCents: session.amountCents,
        currency: session.currency,
        expiresAt: session.expiresAt ?? null,
        metadata: {
          ...(session.metadata ?? {}),
          backfilledAt: new Date().toISOString(),
          registrationId: session.registrationId,
        },
      })
      .returning();

    await database.insert(checkoutItems).values({
      checkoutSessionId: checkoutSession.id,
      itemType: "event_registration",
      description: "Event registration (backfill)",
      quantity: 1,
      amountCents: session.amountCents,
      currency: session.currency,
      eventRegistrationId: session.registrationId,
    });
  }
}

async function main() {
  const database = await db();
  await database.execute(sql`SELECT 1`);
  await backfillRegistrationGroups();
  await backfillCheckoutSessions();
  console.log("Backfill complete.");
}

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
