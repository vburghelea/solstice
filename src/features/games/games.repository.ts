import { and, eq } from "drizzle-orm";
import { gameParticipants, games, user } from "~/db/schema";
import { getDb } from "~/db/server-helpers";

/**
 * Finds a game by its ID.
 */
export async function findGameById(gameId: string) {
  const db = await getDb();
  return db.query.games.findFirst({
    where: eq(games.id, gameId),
    with: {
      owner: true,
      gameSystem: true,
      participants: {
        with: { user: true },
      },
    },
  });
}

/**
 * Finds a game participant by their ID.
 */
export async function findGameParticipantById(participantId: string) {
  const db = await getDb();
  return db.query.gameParticipants.findFirst({
    where: eq(gameParticipants.id, participantId),
    with: { game: true, user: true },
  });
}

/**
 * Finds a game participant by game ID and user ID.
 */
export async function findGameParticipantByGameAndUserId(gameId: string, userId: string) {
  const db = await getDb();
  return db.query.gameParticipants.findFirst({
    where: and(eq(gameParticipants.gameId, gameId), eq(gameParticipants.userId, userId)),
    with: { user: true },
  });
}

/**
 * Finds all participants for a given game ID.
 */
export async function findGameParticipantsByGameId(gameId: string) {
  const db = await getDb();
  return db.query.gameParticipants.findMany({
    where: eq(gameParticipants.gameId, gameId),
    with: { user: true },
  });
}

import { gameApplications } from "~/db/schema"; // Add gameApplications import

/**
 * Finds pending applications for a given game ID.
 */
export async function findPendingGameApplicationsByGameId(gameId: string) {
  const db = await getDb();
  return db.query.gameApplications.findMany({
    where: and(
      eq(gameApplications.gameId, gameId),
      eq(gameApplications.status, "pending"),
    ),
    with: { user: true },
  });
}

/**
 * Finds a game application by its ID.
 */
export async function findGameApplicationById(applicationId: string) {
  const db = await getDb();
  return db.query.gameApplications.findFirst({
    where: eq(gameApplications.id, applicationId),
    with: { game: true, user: true }, // Renamed from gameSession
  });
}

/**
 * Finds a user by their email.
 */
export async function findUserByEmail(email: string) {
  const db = await getDb();
  return db.query.user.findFirst({
    where: eq(user.email, email),
  });
}
