import { relations } from "drizzle-orm/relations";
import {
  account,
  campaignApplications,
  campaignParticipants,
  campaigns,
  eventAnnouncements,
  eventRegistrations,
  events,
  externalCategoryMap,
  externalMechanicMap,
  faqs,
  gameApplications,
  gameParticipants,
  games,
  gameSystemCategories,
  gameSystemMechanics,
  gameSystems,
  gameSystemToCategory,
  gameSystemToMechanics,
  gmReviews,
  mediaAssets,
  memberships,
  membershipTypes,
  publishers,
  roles,
  session,
  socialAuditLogs,
  systemCrawlEvents,
  tags,
  teamMembers,
  teams,
  user,
  userBlocks,
  userFollows,
  userGameSystemPreferences,
  userRoles,
  userTags,
} from "./schema";

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user_userId: one(user, {
    fields: [teamMembers.userId],
    references: [user.id],
    relationName: "teamMembers_userId_user_id",
  }),
  user_invitedBy: one(user, {
    fields: [teamMembers.invitedBy],
    references: [user.id],
    relationName: "teamMembers_invitedBy_user_id",
  }),
  user_approvedBy: one(user, {
    fields: [teamMembers.approvedBy],
    references: [user.id],
    relationName: "teamMembers_approvedBy_user_id",
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  teamMembers: many(teamMembers),
  eventRegistrations: many(eventRegistrations),
  user: one(user, {
    fields: [teams.createdBy],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  teamMembers_userId: many(teamMembers, {
    relationName: "teamMembers_userId_user_id",
  }),
  teamMembers_invitedBy: many(teamMembers, {
    relationName: "teamMembers_invitedBy_user_id",
  }),
  teamMembers_approvedBy: many(teamMembers, {
    relationName: "teamMembers_approvedBy_user_id",
  }),
  campaigns: many(campaigns),
  campaignParticipants: many(campaignParticipants),
  userFollows_followerId: many(userFollows, {
    relationName: "userFollows_followerId_user_id",
  }),
  userFollows_followingId: many(userFollows, {
    relationName: "userFollows_followingId_user_id",
  }),
  games: many(games),
  gmReviews_reviewerId: many(gmReviews, {
    relationName: "gmReviews_reviewerId_user_id",
  }),
  gmReviews_gmId: many(gmReviews, {
    relationName: "gmReviews_gmId_user_id",
  }),
  gameApplications: many(gameApplications),
  gameParticipants: many(gameParticipants),
  campaignApplications: many(campaignApplications),
  userBlocks_blockerId: many(userBlocks, {
    relationName: "userBlocks_blockerId_user_id",
  }),
  userBlocks_blockeeId: many(userBlocks, {
    relationName: "userBlocks_blockeeId_user_id",
  }),
  socialAuditLogs_actorUserId: many(socialAuditLogs, {
    relationName: "socialAuditLogs_actorUserId_user_id",
  }),
  socialAuditLogs_targetUserId: many(socialAuditLogs, {
    relationName: "socialAuditLogs_targetUserId_user_id",
  }),
  sessions: many(session),
  accounts: many(account),
  gameSystems: many(gameSystems),
  eventAnnouncements: many(eventAnnouncements),
  eventRegistrations: many(eventRegistrations),
  teams: many(teams),
  userTags_userId: many(userTags, {
    relationName: "userTags_userId_user_id",
  }),
  userTags_assignedBy: many(userTags, {
    relationName: "userTags_assignedBy_user_id",
  }),
  userRoles_userId: many(userRoles, {
    relationName: "userRoles_userId_user_id",
  }),
  userRoles_assignedBy: many(userRoles, {
    relationName: "userRoles_assignedBy_user_id",
  }),
  memberships: many(memberships),
  events: many(events),
  userGameSystemPreferences: many(userGameSystemPreferences),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(user, {
    fields: [campaigns.ownerId],
    references: [user.id],
  }),
  gameSystem: one(gameSystems, {
    fields: [campaigns.gameSystemId],
    references: [gameSystems.id],
  }),
  campaignParticipants: many(campaignParticipants),
  games: many(games),
  campaignApplications: many(campaignApplications),
}));

export const gameSystemsRelations = relations(gameSystems, ({ one, many }) => ({
  campaigns: many(campaigns),
  games: many(games),
  publisher: one(publishers, {
    fields: [gameSystems.publisherId],
    references: [publishers.id],
  }),
  user: one(user, {
    fields: [gameSystems.lastApprovedBy],
    references: [user.id],
  }),
  faqs: many(faqs),
  mediaAssets: many(mediaAssets),
  systemCrawlEvents: many(systemCrawlEvents),
  gameSystemToMechanics: many(gameSystemToMechanics),
  gameSystemToCategories: many(gameSystemToCategory),
  userGameSystemPreferences: many(userGameSystemPreferences),
}));

export const campaignParticipantsRelations = relations(
  campaignParticipants,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [campaignParticipants.campaignId],
      references: [campaigns.id],
    }),
    user: one(user, {
      fields: [campaignParticipants.userId],
      references: [user.id],
    }),
  }),
);

export const userFollowsRelations = relations(userFollows, ({ one }) => ({
  user_followerId: one(user, {
    fields: [userFollows.followerId],
    references: [user.id],
    relationName: "userFollows_followerId_user_id",
  }),
  user_followingId: one(user, {
    fields: [userFollows.followingId],
    references: [user.id],
    relationName: "userFollows_followingId_user_id",
  }),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  user: one(user, {
    fields: [games.ownerId],
    references: [user.id],
  }),
  campaign: one(campaigns, {
    fields: [games.campaignId],
    references: [campaigns.id],
  }),
  gameSystem: one(gameSystems, {
    fields: [games.gameSystemId],
    references: [gameSystems.id],
  }),
  gmReviews: many(gmReviews),
  gameApplications: many(gameApplications),
  gameParticipants: many(gameParticipants),
}));

export const gmReviewsRelations = relations(gmReviews, ({ one }) => ({
  user_reviewerId: one(user, {
    fields: [gmReviews.reviewerId],
    references: [user.id],
    relationName: "gmReviews_reviewerId_user_id",
  }),
  user_gmId: one(user, {
    fields: [gmReviews.gmId],
    references: [user.id],
    relationName: "gmReviews_gmId_user_id",
  }),
  game: one(games, {
    fields: [gmReviews.gameId],
    references: [games.id],
  }),
}));

export const gameApplicationsRelations = relations(gameApplications, ({ one }) => ({
  game: one(games, {
    fields: [gameApplications.gameId],
    references: [games.id],
  }),
  user: one(user, {
    fields: [gameApplications.userId],
    references: [user.id],
  }),
}));

export const gameParticipantsRelations = relations(gameParticipants, ({ one }) => ({
  game: one(games, {
    fields: [gameParticipants.gameId],
    references: [games.id],
  }),
  user: one(user, {
    fields: [gameParticipants.userId],
    references: [user.id],
  }),
}));

export const campaignApplicationsRelations = relations(
  campaignApplications,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [campaignApplications.campaignId],
      references: [campaigns.id],
    }),
    user: one(user, {
      fields: [campaignApplications.userId],
      references: [user.id],
    }),
  }),
);

export const userBlocksRelations = relations(userBlocks, ({ one }) => ({
  user_blockerId: one(user, {
    fields: [userBlocks.blockerId],
    references: [user.id],
    relationName: "userBlocks_blockerId_user_id",
  }),
  user_blockeeId: one(user, {
    fields: [userBlocks.blockeeId],
    references: [user.id],
    relationName: "userBlocks_blockeeId_user_id",
  }),
}));

export const socialAuditLogsRelations = relations(socialAuditLogs, ({ one }) => ({
  user_actorUserId: one(user, {
    fields: [socialAuditLogs.actorUserId],
    references: [user.id],
    relationName: "socialAuditLogs_actorUserId_user_id",
  }),
  user_targetUserId: one(user, {
    fields: [socialAuditLogs.targetUserId],
    references: [user.id],
    relationName: "socialAuditLogs_targetUserId_user_id",
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const publishersRelations = relations(publishers, ({ many }) => ({
  gameSystems: many(gameSystems),
}));

export const externalMechanicMapRelations = relations(externalMechanicMap, ({ one }) => ({
  gameSystemMechanic: one(gameSystemMechanics, {
    fields: [externalMechanicMap.mechanicId],
    references: [gameSystemMechanics.id],
  }),
}));

export const gameSystemMechanicsRelations = relations(
  gameSystemMechanics,
  ({ many }) => ({
    externalMechanicMaps: many(externalMechanicMap),
    gameSystemToMechanics: many(gameSystemToMechanics),
  }),
);

export const faqsRelations = relations(faqs, ({ one }) => ({
  gameSystem: one(gameSystems, {
    fields: [faqs.gameSystemId],
    references: [gameSystems.id],
  }),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  gameSystem: one(gameSystems, {
    fields: [mediaAssets.gameSystemId],
    references: [gameSystems.id],
  }),
}));

export const systemCrawlEventsRelations = relations(systemCrawlEvents, ({ one }) => ({
  gameSystem: one(gameSystems, {
    fields: [systemCrawlEvents.gameSystemId],
    references: [gameSystems.id],
  }),
}));

export const externalCategoryMapRelations = relations(externalCategoryMap, ({ one }) => ({
  gameSystemCategory: one(gameSystemCategories, {
    fields: [externalCategoryMap.categoryId],
    references: [gameSystemCategories.id],
  }),
}));

export const gameSystemCategoriesRelations = relations(
  gameSystemCategories,
  ({ many }) => ({
    externalCategoryMaps: many(externalCategoryMap),
    gameSystemToCategories: many(gameSystemToCategory),
  }),
);

export const eventAnnouncementsRelations = relations(eventAnnouncements, ({ one }) => ({
  event: one(events, {
    fields: [eventAnnouncements.eventId],
    references: [events.id],
  }),
  user: one(user, {
    fields: [eventAnnouncements.authorId],
    references: [user.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  eventAnnouncements: many(eventAnnouncements),
  eventRegistrations: many(eventRegistrations),
  user: one(user, {
    fields: [events.organizerId],
    references: [user.id],
  }),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, {
    fields: [eventRegistrations.eventId],
    references: [events.id],
  }),
  team: one(teams, {
    fields: [eventRegistrations.teamId],
    references: [teams.id],
  }),
  user: one(user, {
    fields: [eventRegistrations.userId],
    references: [user.id],
  }),
}));

export const userTagsRelations = relations(userTags, ({ one }) => ({
  user_userId: one(user, {
    fields: [userTags.userId],
    references: [user.id],
    relationName: "userTags_userId_user_id",
  }),
  tag: one(tags, {
    fields: [userTags.tagId],
    references: [tags.id],
  }),
  user_assignedBy: one(user, {
    fields: [userTags.assignedBy],
    references: [user.id],
    relationName: "userTags_assignedBy_user_id",
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  userTags: many(userTags),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user_userId: one(user, {
    fields: [userRoles.userId],
    references: [user.id],
    relationName: "userRoles_userId_user_id",
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  user_assignedBy: one(user, {
    fields: [userRoles.assignedBy],
    references: [user.id],
    relationName: "userRoles_assignedBy_user_id",
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(user, {
    fields: [memberships.userId],
    references: [user.id],
  }),
  membershipType: one(membershipTypes, {
    fields: [memberships.membershipTypeId],
    references: [membershipTypes.id],
  }),
}));

export const membershipTypesRelations = relations(membershipTypes, ({ many }) => ({
  memberships: many(memberships),
}));

export const gameSystemToMechanicsRelations = relations(
  gameSystemToMechanics,
  ({ one }) => ({
    gameSystem: one(gameSystems, {
      fields: [gameSystemToMechanics.gameSystemId],
      references: [gameSystems.id],
    }),
    gameSystemMechanic: one(gameSystemMechanics, {
      fields: [gameSystemToMechanics.mechanicsId],
      references: [gameSystemMechanics.id],
    }),
  }),
);

export const gameSystemToCategoryRelations = relations(
  gameSystemToCategory,
  ({ one }) => ({
    gameSystem: one(gameSystems, {
      fields: [gameSystemToCategory.gameSystemId],
      references: [gameSystems.id],
    }),
    gameSystemCategory: one(gameSystemCategories, {
      fields: [gameSystemToCategory.categoryId],
      references: [gameSystemCategories.id],
    }),
  }),
);

export const userGameSystemPreferencesRelations = relations(
  userGameSystemPreferences,
  ({ one }) => ({
    user: one(user, {
      fields: [userGameSystemPreferences.userId],
      references: [user.id],
    }),
    gameSystem: one(gameSystems, {
      fields: [userGameSystemPreferences.gameSystemId],
      references: [gameSystems.id],
    }),
  }),
);
