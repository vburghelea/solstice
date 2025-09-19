import { and, eq } from "drizzle-orm";
import { campaignApplications, campaignParticipants, campaigns, user } from "~/db/schema";
import { getDb } from "~/db/server-helpers";

type CampaignParticipantWithUser = typeof campaignParticipants.$inferSelect & {
  user: typeof user.$inferSelect;
};

export async function findCampaignById(campaignId: string) {
  const db = await getDb();
  return db.query.campaigns.findFirst({
    where: eq(campaigns.id, campaignId),
    with: {
      owner: true,
      gameSystem: true, // Add this line to fetch game system details
      participants: {
        with: { user: true },
      },
      applications: {
        with: { user: true },
      },
    },
  });
}

type ParticipantWithRelations = typeof campaignParticipants.$inferSelect & {
  campaign: typeof campaigns.$inferSelect;
  user: typeof user.$inferSelect;
};

export async function findCampaignParticipantById(
  participantId: string,
): Promise<ParticipantWithRelations | null> {
  const db = await getDb();
  const result = await db.query.campaignParticipants.findFirst({
    where: eq(campaignParticipants.id, participantId),
    with: { campaign: true, user: true },
    columns: {
      id: true,
      campaignId: true,
      userId: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return (result as ParticipantWithRelations) ?? null;
}

export async function findCampaignParticipantByCampaignAndUserId(
  campaignId: string,
  userId: string,
) {
  const db = await getDb();
  return db.query.campaignParticipants.findFirst({
    where: and(
      eq(campaignParticipants.campaignId, campaignId),
      eq(campaignParticipants.userId, userId),
    ),
    with: { user: true },
  });
}

export async function findCampaignParticipantsByCampaignId(
  campaignId: string,
): Promise<CampaignParticipantWithUser[]> {
  const db = await getDb();
  const result = await db.query.campaignParticipants.findMany({
    where: eq(campaignParticipants.campaignId, campaignId),
    with: { user: true },
  });
  return result as CampaignParticipantWithUser[];
}

export async function findPendingCampaignApplicationsByCampaignId(campaignId: string) {
  const db = await getDb();
  return db.query.campaignApplications.findMany({
    where: and(
      eq(campaignApplications.campaignId, campaignId),
      eq(campaignApplications.status, "pending"),
    ),
    with: { user: true },
  });
}

export async function findCampaignApplicationById(applicationId: string) {
  const db = await getDb();
  return db.query.campaignApplications.findFirst({
    where: eq(campaignApplications.id, applicationId),
    with: { campaign: true, user: true },
  });
}

export async function findUserByEmail(email: string) {
  const db = await getDb();
  return db.query.user.findFirst({
    where: eq(user.email, email),
  });
}
