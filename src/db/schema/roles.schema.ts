import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

/**
 * Roles table - defines available roles in the system
 */
export const roles = pgTable("roles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: jsonb("permissions")
    .$type<Record<string, boolean>>()
    .notNull()
    .default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * User roles assignment table - maps users to roles with optional scope
 */
export const userRoles = pgTable(
  "user_roles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    // Scope fields (NULL for global roles)
    teamId: text("team_id"),
    eventId: text("event_id"),
    // Metadata
    assignedBy: text("assigned_by")
      .notNull()
      .references(() => user.id),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    notes: text("notes"),
  },
  (table) => [
    index("idx_user_roles_user_id").on(table.userId),
    index("idx_user_roles_team_id")
      .on(table.teamId)
      .where(sql`${table.teamId} IS NOT NULL`),
    index("idx_user_roles_event_id")
      .on(table.eventId)
      .where(sql`${table.eventId} IS NOT NULL`),
    index("idx_user_roles_unique").on(
      table.userId,
      table.roleId,
      table.teamId,
      table.eventId,
    ),
  ],
);

/**
 * Tags table - for user categorization (future implementation)
 */
export const tags = pgTable("tags", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  category: text("category").notNull(), // 'official', 'team', 'player', 'custom'
  description: text("description"),
  color: text("color"), // For UI display
  icon: text("icon"), // Icon identifier
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * User tags assignment table (future implementation)
 */
export const userTags = pgTable(
  "user_tags",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    assignedBy: text("assigned_by").references(() => user.id),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    notes: text("notes"),
  },
  (table) => [
    index("idx_user_tags_user_id").on(table.userId),
    index("idx_user_tags_tag_id").on(table.tagId),
    index("idx_user_tags_expires_at")
      .on(table.expiresAt)
      .where(sql`${table.expiresAt} IS NOT NULL`),
    index("idx_user_tags_unique").on(table.userId, table.tagId),
  ],
);

// Type exports for TypeScript
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type UserTag = typeof userTags.$inferSelect;
export type NewUserTag = typeof userTags.$inferInsert;
