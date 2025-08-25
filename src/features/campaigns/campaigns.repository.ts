import { and, eq } from "drizzle-orm";
import { campaignApplications, campaignParticipants, campaigns, user } from "~/db/schema";
import { getDb } from "~/db/server-helpers";

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

export async function findCampaignParticipantById(participantId: string) {
  const db = await getDb();
  return db.query.campaignParticipants.findFirst({
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

export async function findCampaignParticipantsByCampaignId(campaignId: string) {
  const db = await getDb();
  return db.query.campaignParticipants.findMany({
    where: eq(campaignParticipants.campaignId, campaignId),
    with: { user: true },
  });
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
