import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { JsonRecord } from "~/shared/lib/json";
import { user } from "./auth.schema";

export const organizationTypeEnum = pgEnum("organization_type", [
  "governing_body",
  "pso",
  "league",
  "club",
  "affiliate",
]);

export const organizationStatusEnum = pgEnum("organization_status", [
  "pending",
  "active",
  "suspended",
  "archived",
]);

export const organizationMemberRoleEnum = pgEnum("organization_member_role", [
  "owner",
  "admin",
  "reporter",
  "viewer",
  "member",
]);

export const organizationMemberStatusEnum = pgEnum("organization_member_status", [
  "pending",
  "active",
  "suspended",
  "removed",
]);

export const delegatedAccessScopeEnum = pgEnum("delegated_access_scope", [
  "reporting",
  "analytics",
  "admin",
]);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    type: organizationTypeEnum("type").notNull(),
    parentOrgId: uuid("parent_org_id"),
    status: organizationStatusEnum("status").notNull().default("active"),
    settings: jsonb("settings").$type<JsonRecord>().notNull().default({}),
    metadata: jsonb("metadata").$type<JsonRecord>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("organizations_slug_unique").on(table.slug),
    index("organizations_parent_idx").on(table.parentOrgId),
    foreignKey({
      columns: [table.parentOrgId],
      foreignColumns: [table.id],
      name: "organizations_parent_fk",
    }),
  ],
);

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: organizationMemberRoleEnum("role").notNull(),
    status: organizationMemberStatusEnum("status").notNull().default("pending"),
    invitedBy: text("invited_by").references(() => user.id),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    approvedBy: text("approved_by").references(() => user.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("organization_members_user_org_unique").on(
      table.userId,
      table.organizationId,
    ),
    index("organization_members_user_active_idx")
      .on(table.userId)
      .where(sql`${table.status} = 'active'`),
    index("organization_members_org_active_idx")
      .on(table.organizationId)
      .where(sql`${table.status} = 'active'`),
  ],
);

export const delegatedAccess = pgTable(
  "delegated_access",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    delegateUserId: text("delegate_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    scope: delegatedAccessScopeEnum("scope").notNull(),
    grantedBy: text("granted_by")
      .notNull()
      .references(() => user.id),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedBy: text("revoked_by").references(() => user.id),
    notes: text("notes"),
  },
  (table) => [
    index("delegated_access_user_active_idx")
      .on(table.delegateUserId)
      .where(sql`${table.revokedAt} IS NULL`),
    uniqueIndex("delegated_access_unique_active")
      .on(table.delegateUserId, table.organizationId, table.scope)
      .where(sql`${table.revokedAt} IS NULL`),
  ],
);

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;
export type DelegatedAccess = typeof delegatedAccess.$inferSelect;
export type NewDelegatedAccess = typeof delegatedAccess.$inferInsert;
