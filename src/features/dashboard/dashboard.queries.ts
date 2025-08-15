import { createServerFn } from "@tanstack/react-start";
import { and, count, eq } from "drizzle-orm";
import { campaignParticipants, campaigns, gameParticipants, games } from "~/db/schema";
import { getDb } from "~/db/server-helpers";
import { getCurrentUser } from "~/features/auth/auth.queries";
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
