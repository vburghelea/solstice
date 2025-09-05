import { serverOnly } from "@tanstack/react-start";

export const cancelPendingBetweenUsers = serverOnly(
  async (userAId: string, userBId: string): Promise<void> => {
    const { getDb } = await import("~/db/server-helpers");
    const _db = await getDb();
    const { and, eq, sql } = await import("drizzle-orm");
    const {
      games,
      gameParticipants,
      gameApplications,
      campaigns,
      campaignParticipants,
      campaignApplications,
    } = await import("~/db/schema");

    // Helper to cancel between owner and target for games
    async function cancelForGames(ownerId: string, targetId: string) {
      const ownedGames = _db
        .select({ id: games.id })
        .from(games)
        .where(eq(games.ownerId, ownerId));

      // Delete pending invitations (role invited, status pending)
      await _db
        .delete(gameParticipants)
        .where(
          and(
            eq(gameParticipants.userId, targetId),
            eq(gameParticipants.role, "invited"),
            eq(gameParticipants.status, "pending"),
            sql`${gameParticipants.gameId} IN ${ownedGames}`,
          ),
        );

      // Delete pending applications from target to owner's games
      await _db
        .delete(gameApplications)
        .where(
          and(
            eq(gameApplications.userId, targetId),
            sql`${gameApplications.gameId} IN ${ownedGames}`,
          ),
        );
    }

    // Helper to cancel between owner and target for campaigns
    async function cancelForCampaigns(ownerId: string, targetId: string) {
      const ownedCampaigns = _db
        .select({ id: campaigns.id })
        .from(campaigns)
        .where(eq(campaigns.ownerId, ownerId));

      await _db
        .delete(campaignParticipants)
        .where(
          and(
            eq(campaignParticipants.userId, targetId),
            eq(campaignParticipants.status, "pending"),
            sql`${campaignParticipants.campaignId} IN ${ownedCampaigns}`,
          ),
        );

      await _db
        .delete(campaignApplications)
        .where(
          and(
            eq(campaignApplications.userId, targetId),
            sql`${campaignApplications.campaignId} IN ${ownedCampaigns}`,
          ),
        );
    }

    // Cancel both directions
    await cancelForGames(userAId, userBId);
    await cancelForGames(userBId, userAId);
    await cancelForCampaigns(userAId, userBId);
    await cancelForCampaigns(userBId, userAId);
  },
);
