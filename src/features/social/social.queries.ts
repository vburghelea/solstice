import { createServerFn } from "@tanstack/react-start";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { OperationResult } from "~/shared/types/common";
import { getBlocklistInputSchema, relationshipInputSchema } from "./social.schemas";
import type { BlocklistItem, RelationshipSnapshot } from "./social.types";

export const getRelationshipSnapshot = createServerFn({ method: "GET" })
  .validator(relationshipInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<RelationshipSnapshot>> => {
    try {
      const [{ getCurrentUser }, { getDb }, { getRelationship }] = await Promise.all([
        import("~/features/auth/auth.queries"),
        import("~/db/server-helpers"),
        import("./relationship.server"),
      ]);
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();
      const { user } = await import("~/db/schema");
      const { eq } = await import("drizzle-orm");

      const [target] = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          uploadedAvatarPath: user.uploadedAvatarPath,
        })
        .from(user)
        .where(eq(user.id, data.userId))
        .limit(1);
      if (!target)
        return {
          success: false,
          errors: [{ code: "NOT_FOUND", message: "User not found" }],
        };

      // If viewing own profile, normalize relationship booleans and flag isSelf
      if (currentUser.id === data.userId) {
        return {
          success: true,
          data: {
            follows: false,
            followedBy: false,
            blocked: false,
            blockedBy: false,
            isConnection: false,
            targetUser: target,
            isSelf: true,
          },
        };
      }

      const rel = await getRelationship(currentUser.id, data.userId);
      return { success: true, data: { ...rel, targetUser: target, isSelf: false } };
    } catch (error) {
      console.error("getRelationshipSnapshot error", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to fetch relationship" }],
      };
    }
  });

export const getBlocklist = createServerFn({ method: "GET" })
  .validator((input: unknown) => getBlocklistInputSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<OperationResult<{ items: BlocklistItem[]; totalCount: number }>> => {
      try {
        const [{ getCurrentUser }, { getDb }] = await Promise.all([
          import("~/features/auth/auth.queries"),
          import("~/db/server-helpers"),
        ]);
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          return {
            success: false,
            errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
          };
        }

        const page = Math.max(1, data?.page ?? 1);
        const pageSize = Math.min(100, Math.max(1, data?.pageSize ?? 20));
        const offset = (page - 1) * pageSize;

        const db = await getDb();
        const { userBlocks, user } = await import("~/db/schema");

        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(userBlocks)
          .where(eq(userBlocks.blockerId, currentUser.id));

        const rows = await db
          .select({
            block: userBlocks,
            blocked: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              uploadedAvatarPath: user.uploadedAvatarPath,
            },
          })
          .from(userBlocks)
          .innerJoin(user, eq(userBlocks.blockeeId, user.id))
          .where(eq(userBlocks.blockerId, currentUser.id))
          .orderBy(desc(userBlocks.createdAt))
          .limit(pageSize)
          .offset(offset);

        const items: BlocklistItem[] = rows.map((r) => ({
          id: r.block.id,
          user: r.blocked,
          reason: r.block.reason ?? null,
          createdAt: r.block.createdAt!,
        }));

        return { success: true, data: { items, totalCount: count } };
      } catch (error) {
        console.error("getBlocklist error", error);
        return {
          success: false,
          errors: [{ code: "SERVER_ERROR", message: "Failed to fetch blocklist" }],
        };
      }
    },
  );

// GM Reviews functionality moved from reviews namespace
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
