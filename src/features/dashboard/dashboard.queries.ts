import { createServerFn } from "@tanstack/react-start";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  campaignParticipants,
  campaigns,
  gameParticipants,
  games,
  gameSystems,
  user,
} from "~/db/schema";
import { getDb } from "~/db/server-helpers";
import { getCurrentUser } from "~/features/auth/auth.queries";
import type { GameListItem } from "~/features/games/games.types";
import {
  locationSchema,
  minimumRequirementsSchema,
  safetyRulesSchema,
} from "~/shared/schemas/common";
import { OperationResult } from "~/shared/types/common";

interface DashboardStats {
  campaigns: {
    owned: number;
    member: number;
    pendingInvites: number;
  };
  games: {
    owned: number;
    member: number;
    pendingInvites: number;
  };
}

export const getDashboardStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<OperationResult<DashboardStats>> => {
    try {
      const db = await getDb();
      const user = await getCurrentUser();

      if (!user) {
        return {
          success: false,
          errors: [{ code: "UNAUTHORIZED", message: "User not authenticated" }],
        };
      }

      const userId = user.id;

      // Campaign stats
      const campaignsOwned = await db
        .select({ value: count() })
        .from(campaigns)
        .where(eq(campaigns.ownerId, userId));

      const campaignsAsMember = await db
        .select({ value: count() })
        .from(campaignParticipants)
        .where(
          and(
            eq(campaignParticipants.userId, userId),
            eq(campaignParticipants.role, "player"),
          ),
        );

      const campaignsWithPendingInvites = await db
        .select({ value: count() })
        .from(campaignParticipants)
        .where(
          and(
            eq(campaignParticipants.userId, userId),
            eq(campaignParticipants.role, "invited"),
          ),
        );

      // Game stats
      const gamesOwned = await db
        .select({ value: count() })
        .from(games)
        .where(eq(games.ownerId, userId));

      const gamesAsMember = await db
        .select({ value: count() })
        .from(gameParticipants)
        .where(
          and(eq(gameParticipants.userId, userId), eq(gameParticipants.role, "player")),
        );

      const gamesWithPendingInvites = await db
        .select({ value: count() })
        .from(gameParticipants)
        .where(
          and(eq(gameParticipants.userId, userId), eq(gameParticipants.role, "invited")),
        );

      const stats: DashboardStats = {
        campaigns: {
          owned: campaignsOwned[0].value,
          member: campaignsAsMember[0].value,
          pendingInvites: campaignsWithPendingInvites[0].value,
        },
        games: {
          owned: gamesOwned[0].value,
          member: gamesAsMember[0].value,
          pendingInvites: gamesWithPendingInvites[0].value,
        },
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return {
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to fetch dashboard stats" }],
      };
    }
  },
);

/**
 * Get the next upcoming game for the current user as a confirmed participant.
 */
export const getNextUserGame = createServerFn({ method: "GET" }).handler(
  async (): Promise<OperationResult<GameListItem | null>> => {
    try {
      const db = await getDb();
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: true,
          data: null,
        };
      }

      const now = new Date();

      const rows = await db
        .select({
          id: games.id,
          ownerId: games.ownerId,
          campaignId: games.campaignId,
          gameSystemId: games.gameSystemId,
          name: games.name,
          dateTime: games.dateTime,
          description: games.description,
          expectedDuration: games.expectedDuration,
          price: games.price,
          language: games.language,
          location: sql<z.infer<typeof locationSchema>>`${games.location}`,
          status: games.status,
          minimumRequirements: sql<
            z.infer<typeof minimumRequirementsSchema>
          >`${games.minimumRequirements}`,
          visibility: games.visibility,
          safetyRules: sql<z.infer<typeof safetyRulesSchema>>`${games.safetyRules}`,
          createdAt: games.createdAt,
          updatedAt: games.updatedAt,
          owner: { id: user.id, name: user.name, email: user.email },
          gameSystem: { id: gameSystems.id, name: gameSystems.name },
          participantCount: sql<number>`count(distinct ${gameParticipants.userId})::int`,
        })
        .from(games)
        .innerJoin(user, eq(games.ownerId, user.id))
        .innerJoin(gameSystems, eq(games.gameSystemId, gameSystems.id))
        .innerJoin(gameParticipants, eq(gameParticipants.gameId, games.id))
        .where(
          and(
            gte(games.dateTime, now),
            eq(games.status, "scheduled"),
            eq(gameParticipants.userId, currentUser.id),
            eq(gameParticipants.role, "player"),
            eq(gameParticipants.status, "approved"),
          ),
        )
        .groupBy(games.id, user.id, gameSystems.id)
        .orderBy(games.dateTime)
        .limit(1);

      const next = rows[0] as unknown as GameListItem | undefined;
      return { success: true, data: next ?? null };
    } catch (error) {
      console.error("Error fetching next user game:", error);
      return {
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to fetch upcoming game" }],
      };
    }
  },
);
