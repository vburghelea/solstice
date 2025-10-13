import { createServerFn } from "@tanstack/react-start";
import { and, count, eq, gte, or, sql } from "drizzle-orm";
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

interface PlayerWorkspaceStats {
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

export const getPlayerWorkspaceStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<OperationResult<PlayerWorkspaceStats>> => {
    try {
      const db = await getDb();
      const user = await getCurrentUser();

      if (!user) {
        return {
          success: false,
          errors: [{ code: "UNAUTHORIZED", message: "User not authenticated" }],
        } satisfies OperationResult<PlayerWorkspaceStats>;
      }

      const userId = user.id;

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

      const stats: PlayerWorkspaceStats = {
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

      return {
        success: true,
        data: stats,
      } satisfies OperationResult<PlayerWorkspaceStats>;
    } catch (error) {
      console.error("Error fetching player workspace stats:", error);
      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to fetch player workspace stats",
          },
        ],
      } satisfies OperationResult<PlayerWorkspaceStats>;
    }
  },
);

export const getNextPlayerGame = createServerFn({ method: "GET" }).handler(
  async (): Promise<OperationResult<GameListItem | null>> => {
    try {
      const db = await getDb();
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: true,
          data: null,
        } satisfies OperationResult<GameListItem | null>;
      }

      const now = new Date();

      const participantExists = sql<boolean>`exists (
        select 1
        from ${gameParticipants} gp_user
        where gp_user.game_id = ${games.id}
          and gp_user.user_id = ${currentUser.id}
          and gp_user.status in ('approved', 'pending')
          and gp_user.role in ('player', 'owner', 'invited')
      )`;

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
          participantCount: sql<number>`
            count(
              distinct case
                when ${gameParticipants.status} = ${"approved"}
                then ${gameParticipants.userId}
              end
            )::int
          `,
        })
        .from(games)
        .innerJoin(user, eq(games.ownerId, user.id))
        .innerJoin(gameSystems, eq(games.gameSystemId, gameSystems.id))
        .leftJoin(gameParticipants, eq(gameParticipants.gameId, games.id))
        .where(
          and(
            gte(games.dateTime, now),
            eq(games.status, "scheduled"),
            or(eq(games.ownerId, currentUser.id), participantExists),
          ),
        )
        .groupBy(games.id, user.id, gameSystems.id)
        .orderBy(games.dateTime)
        .limit(1);

      const next = rows[0] as unknown as GameListItem | undefined;
      return {
        success: true,
        data: next ?? null,
      } satisfies OperationResult<GameListItem | null>;
    } catch (error) {
      console.error("Error fetching next player game:", error);
      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to fetch the next scheduled game",
          },
        ],
      } satisfies OperationResult<GameListItem | null>;
    }
  },
);
