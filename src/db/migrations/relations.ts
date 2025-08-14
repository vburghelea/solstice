import { relations } from "drizzle-orm/relations";
import {
  account,
  campaignApplications,
  campaignParticipants,
  campaigns,
  eventAnnouncements,
  eventRegistrations,
  events,
  gameApplications,
  gameParticipants,
  games,
  gameSystemCategories,
  gameSystemMechanics,
  gameSystems,
  gameSystemToCategory,
  gameSystemToMechanics,
  memberships,
  membershipTypes,
  roles,
  session,
  tags,
  teamMembers,
  teams,
  user,
  userGameSystemPreferences,
  userRoles,
  userTags,
} from "./schema";

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(user, {
    fields: [campaigns.ownerId],
    references: [user.id],
  }),
  gameSystem: one(gameSystems, {
    fields: [campaigns.gameSystemId],
    references: [gameSystems.id],
  }),
  campaignApplications: many(campaignApplications),
  campaignParticipants: many(campaignParticipants),
  games: many(games),
}));

export const userRelations = relations(user, ({ many }) => ({
  campaigns: many(campaigns),
  campaignApplications: many(campaignApplications),
  campaignParticipants: many(campaignParticipants),
  games: many(games),
  gameApplications: many(gameApplications),
  gameParticipants: many(gameParticipants),
  accounts: many(account),
  sessions: many(session),
  events: many(events),
  eventAnnouncements: many(eventAnnouncements),
  eventRegistrations: many(eventRegistrations),
  teams: many(teams),
  memberships: many(memberships),
  teamMembers_userId: many(teamMembers, {
    relationName: "teamMembers_userId_user_id",
  }),
  teamMembers_invitedBy: many(teamMembers, {
    relationName: "teamMembers_invitedBy_user_id",
  }),
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
  userGameSystemPreferences: many(userGameSystemPreferences),
}));

export const gameSystemsRelations = relations(gameSystems, ({ many }) => ({
  campaigns: many(campaigns),
  games: many(games),
  gameSystemToCategories: many(gameSystemToCategory),
  gameSystemToMechanics: many(gameSystemToMechanics),
  userGameSystemPreferences: many(userGameSystemPreferences),
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
  gameApplications: many(gameApplications),
  gameParticipants: many(gameParticipants),
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

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  user: one(user, {
    fields: [events.organizerId],
    references: [user.id],
  }),
  eventAnnouncements: many(eventAnnouncements),
  eventRegistrations: many(eventRegistrations),
}));

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

export const teamsRelations = relations(teams, ({ one, many }) => ({
  eventRegistrations: many(eventRegistrations),
  user: one(user, {
    fields: [teams.createdBy],
    references: [user.id],
  }),
  teamMembers: many(teamMembers),
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

export const gameSystemCategoriesRelations = relations(
  gameSystemCategories,
  ({ many }) => ({
    gameSystemToCategories: many(gameSystemToCategory),
  }),
);

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

export const gameSystemMechanicsRelations = relations(
  gameSystemMechanics,
  ({ many }) => ({
    gameSystemToMechanics: many(gameSystemToMechanics),
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
