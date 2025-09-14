import { and, eq } from "drizzle-orm";
import { gameApplications, gameParticipants, games, user } from "~/db/schema";
import { getDb } from "~/db/server-helpers";

type GameParticipantWithUser = typeof gameParticipants.$inferSelect & {
  user: typeof user.$inferSelect;
};

type GameParticipantWithGameUser = typeof gameParticipants.$inferSelect & {
  game: typeof games.$inferSelect;
  user: typeof user.$inferSelect;
};

type GameApplicationWithDetails = typeof gameApplications.$inferSelect & {
  game: typeof games.$inferSelect;
  user: typeof user.$inferSelect;
};

/**
 * Finds a game by its ID.
 */
type GameWithOwner = typeof games.$inferSelect & {
  owner: typeof user.$inferSelect;
};

export async function findGameById(gameId: string): Promise<GameWithOwner | undefined> {
  const db = await getDb();
  const result = await db.query.games.findFirst({
    where: eq(games.id, gameId),
    with: {
      owner: true,
      gameSystem: true,
      participants: {
        with: { user: true },
      },
    },
  });
  return result as GameWithOwner | undefined;
}

/**
 * Finds a game participant by their ID.
 */
export async function findGameParticipantById(
  participantId: string,
): Promise<GameParticipantWithGameUser | undefined> {
  const db = await getDb();
  const result = await db.query.gameParticipants.findFirst({
    where: eq(gameParticipants.id, participantId),
    with: { game: true, user: true },
  });
  return result as GameParticipantWithGameUser | undefined;
}

/**
 * Finds a game participant by game ID and user ID.
 */
export async function findGameParticipantByGameAndUserId(
  gameId: string,
  userId: string,
): Promise<GameParticipantWithUser | undefined> {
  const db = await getDb();
  const result = await db.query.gameParticipants.findFirst({
    where: and(eq(gameParticipants.gameId, gameId), eq(gameParticipants.userId, userId)),
    with: { user: true },
  });
  return result as GameParticipantWithUser | undefined;
}

/**
 * Finds all participants for a given game ID.
 */
export async function findGameParticipantsByGameId(
  gameId: string,
): Promise<GameParticipantWithUser[]> {
  const db = await getDb();
  const result = await db.query.gameParticipants.findMany({
    where: eq(gameParticipants.gameId, gameId),
    with: { user: true },
  });
  return result as GameParticipantWithUser[];
}

/**
 * Finds pending applications for a given game ID.
 */
export async function findPendingGameApplicationsByGameId(
  gameId: string,
): Promise<GameApplicationWithDetails[]> {
  const db = await getDb();
  const result = await db.query.gameApplications.findMany({
    where: and(
      eq(gameApplications.gameId, gameId),
      eq(gameApplications.status, "pending"),
    ),
    with: { user: true },
  });
  return result as GameApplicationWithDetails[];
}

/**
 * Finds a game application by its ID.
 */
export async function findGameApplicationById(
  applicationId: string,
): Promise<GameApplicationWithDetails | undefined> {
  const db = await getDb();
  const result = await db.query.gameApplications.findFirst({
    where: eq(gameApplications.id, applicationId),
    with: { game: true, user: true }, // Renamed from gameSession
  });
  return result as GameApplicationWithDetails | undefined;
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
