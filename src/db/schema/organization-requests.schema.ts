import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema";
import { organizations } from "./organizations.schema";

export const organizationJoinRequestStatusEnum = pgEnum(
  "organization_join_request_status",
  ["pending", "approved", "denied", "cancelled"],
);

export const organizationJoinRequestRoleEnum = pgEnum("organization_join_request_role", [
  "reporter",
  "viewer",
  "member",
]);

export const organizationInviteLinkRoleEnum = pgEnum("organization_invite_link_role", [
  "reporter",
  "viewer",
  "member",
]);

export const organizationJoinRequests = pgTable(
  "organization_join_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    status: organizationJoinRequestStatusEnum("status").notNull().default("pending"),
    message: text("message"),
    requestedRole: organizationJoinRequestRoleEnum("requested_role")
      .notNull()
      .default("member"),
    resolvedBy: text("resolved_by").references(() => user.id),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolutionNotes: text("resolution_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("organization_join_requests_unique").on(
      table.userId,
      table.organizationId,
      table.status,
    ),
    index("organization_join_requests_user_idx").on(table.userId, table.status),
    index("organization_join_requests_org_idx").on(table.organizationId, table.status),
  ],
);

export const organizationInviteLinks = pgTable(
  "organization_invite_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    role: organizationInviteLinkRoleEnum("role").notNull().default("member"),
    autoApprove: boolean("auto_approve").notNull().default(false),
    maxUses: integer("max_uses"),
    useCount: integer("use_count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedBy: text("revoked_by").references(() => user.id),
  },
  (table) => [
    uniqueIndex("organization_invite_links_token_unique").on(table.token),
    index("organization_invite_links_token_active_idx")
      .on(table.token)
      .where(sql`${table.revokedAt} IS NULL`),
    index("organization_invite_links_org_active_idx")
      .on(table.organizationId)
      .where(sql`${table.revokedAt} IS NULL`),
  ],
);

export const organizationInviteLinkUses = pgTable(
  "organization_invite_link_uses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    linkId: uuid("link_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    usedAt: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("organization_invite_link_uses_unique").on(table.linkId, table.userId),
    index("organization_invite_link_uses_link_idx").on(table.linkId, table.usedAt),
    index("organization_invite_link_uses_user_idx").on(table.userId, table.usedAt),
    foreignKey({
      columns: [table.linkId],
      foreignColumns: [organizationInviteLinks.id],
      name: "organization_invite_link_uses_link_fk",
    }).onDelete("cascade"),
  ],
);

export type OrganizationJoinRequest = typeof organizationJoinRequests.$inferSelect;
export type NewOrganizationJoinRequest = typeof organizationJoinRequests.$inferInsert;
export type OrganizationInviteLink = typeof organizationInviteLinks.$inferSelect;
export type NewOrganizationInviteLink = typeof organizationInviteLinks.$inferInsert;
export type OrganizationInviteLinkUse = typeof organizationInviteLinkUses.$inferSelect;
export type NewOrganizationInviteLinkUse = typeof organizationInviteLinkUses.$inferInsert;
