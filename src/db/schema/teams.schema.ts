import { createId } from "@paralleldrive/cuid2";
import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

// Enum for team member roles
export const teamMemberRoleEnum = pgEnum("team_member_role", [
  "captain",
  "coach",
  "player",
  "substitute",
]);

// Enum for team member status
export const teamMemberStatusEnum = pgEnum("team_member_status", [
  "pending",
  "active",
  "inactive",
  "removed",
]);

/**
 * Teams table
 * Stores team information for Quadball teams
 */
export const teams = pgTable(
  "teams",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    city: varchar("city", { length: 255 }),
    province: varchar("province", { length: 2 }), // ON, BC, etc.
    logoUrl: text("logo_url"),
    primaryColor: varchar("primary_color", { length: 7 }), // Hex color
    secondaryColor: varchar("secondary_color", { length: 7 }), // Hex color
    foundedYear: varchar("founded_year", { length: 4 }),
    website: text("website"),
    socialLinks: text("social_links"), // JSON string of social media links
    isActive: text("is_active").default("true").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
  },
  (table) => ({
    slugIdx: uniqueIndex("teams_slug_idx").on(table.slug),
    createdByIdx: index("teams_created_by_idx").on(table.createdBy),
    isActiveIdx: index("teams_is_active_idx").on(table.isActive),
  }),
);

/**
 * Team members junction table
 * Manages the many-to-many relationship between users and teams
 */
export const teamMembers = pgTable(
  "team_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: teamMemberRoleEnum("role").notNull().default("player"),
    status: teamMemberStatusEnum("status").notNull().default("pending"),
    jerseyNumber: varchar("jersey_number", { length: 3 }),
    position: varchar("position", { length: 50 }), // Chaser, Beater, Keeper, Seeker
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    leftAt: timestamp("left_at", { withTimezone: true }),
    invitedBy: text("invited_by").references(() => user.id),
    notes: text("notes"),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    lastInvitationReminderAt: timestamp("last_invitation_reminder_at", {
      withTimezone: true,
    }),
    invitationReminderCount: integer("invitation_reminder_count").notNull().default(0),
    requestedAt: timestamp("requested_at", { withTimezone: true }),
  },
  (table) => ({
    teamUserIdx: uniqueIndex("team_members_team_user_idx").on(table.teamId, table.userId),
    teamStatusIdx: index("team_members_team_status_idx").on(table.teamId, table.status),
    userStatusIdx: index("team_members_user_status_idx").on(table.userId, table.status),
    // Ensure only one active team membership per user
    activeUserConstraint: uniqueIndex("team_members_active_user_idx")
      .on(table.userId)
      .where(sql`status = 'active'`),
  }),
);

// Relations
export const teamsRelations = relations(teams, ({ many, one }) => ({
  members: many(teamMembers),
  creator: one(user, {
    fields: [teams.createdBy],
    references: [user.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(user, {
    fields: [teamMembers.userId],
    references: [user.id],
  }),
  inviter: one(user, {
    fields: [teamMembers.invitedBy],
    references: [user.id],
  }),
}));

// Types
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type TeamMemberRole = (typeof teamMemberRoleEnum.enumValues)[number];
export type TeamMemberStatus = (typeof teamMemberStatusEnum.enumValues)[number];
