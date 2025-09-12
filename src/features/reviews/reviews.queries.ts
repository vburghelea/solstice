import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listPendingGMReviews = createServerFn({ method: "GET" })
  .validator(
    z.object({ days: z.number().int().min(1).max(365).optional() }).optional().parse,
  )
  .handler(async ({ data }) => {
    try {
      const { and, eq, gte, sql } = await import("drizzle-orm");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false as const,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const { getDb } = await import("~/db/server-helpers");
      const { games, gameParticipants, gmReviews, user } = await import("~/db/schema");
      const db = await getDb();

      const days = data?.days ?? 365;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const rows = await db
        .select({
          gameId: games.id,
          gameName: games.name,
          dateTime: games.dateTime,
          gmId: user.id,
          gmName: user.name,
          gmEmail: user.email,
          gmImage: user.image,
          gmUploadedAvatarPath: user.uploadedAvatarPath,
          gmRating: user.gmRating,
          reviewId: gmReviews.id,
        })
        .from(games)
        .innerJoin(gameParticipants, eq(gameParticipants.gameId, games.id))
        .innerJoin(user, eq(user.id, games.ownerId))
        .leftJoin(
          gmReviews,
          and(eq(gmReviews.gameId, games.id), eq(gmReviews.reviewerId, currentUser.id)),
        )
        .where(
          and(
            eq(games.status, "completed"),
            eq(gameParticipants.userId, currentUser.id),
            eq(gameParticipants.status, "approved"),
            gte(games.dateTime, since),
            sql`${games.ownerId} <> ${currentUser.id}`,
            sql`${gmReviews.id} IS NULL`,
          ),
        )
        .orderBy(games.dateTime);

      const items = rows.map((r) => ({
        gameId: r.gameId,
        gameName: r.gameName,
        dateTime: r.dateTime,
        gm: {
          id: r.gmId,
          name: r.gmName,
          email: r.gmEmail,
          image: r.gmImage,
          uploadedAvatarPath: r.gmUploadedAvatarPath,
          gmRating: r.gmRating ?? undefined,
        },
      }));

      return { success: true as const, data: items };
    } catch (error) {
      console.error("Error listing pending GM reviews:", error);
      return {
        success: false as const,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to list pending reviews" }],
      };
    }
  });
