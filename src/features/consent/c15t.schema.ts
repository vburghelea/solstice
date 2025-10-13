import { boolean, jsonb, pgSchema, text, timestamp, varchar } from "drizzle-orm/pg-core";

const consentDb = pgSchema("c15t");

export const subject = consentDb.table("subject", {
  id: varchar("id", { length: 255 }).primaryKey(),
  isIdentified: boolean("is_identified").default(false).notNull(),
  externalId: varchar("external_id", { length: 255 }),
  identityProvider: varchar("identity_provider", { length: 255 }),
  lastIpAddress: varchar("last_ip_address", { length: 255 }),
  subjectTimezone: varchar("subject_timezone", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const domain = consentDb.table("domain", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  allowedOrigins: jsonb("allowed_origins"),
  isVerified: boolean("is_verified").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const consentPolicy = consentDb.table("consent_policy", {
  id: varchar("id", { length: 255 }).primaryKey(),
  version: varchar("version", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  effectiveDate: timestamp("effective_date", { withTimezone: true }).notNull(),
  expirationDate: timestamp("expiration_date", { withTimezone: true }),
  content: text("content").notNull(),
  contentHash: varchar("content_hash", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const consentPurpose = consentDb.table("consent_purpose", {
  id: varchar("id", { length: 255 }).primaryKey(),
  code: varchar("code", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  isEssential: boolean("is_essential").notNull(),
  dataCategory: varchar("data_category", { length: 255 }),
  legalBasis: varchar("legal_basis", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const consent = consentDb.table("consent", {
  id: varchar("id", { length: 255 }).primaryKey(),
  subjectId: varchar("subject_id", { length: 255 }).notNull(),
  domainId: varchar("domain_id", { length: 255 }).notNull(),
  policyId: varchar("policy_id", { length: 255 }),
  purposeIds: jsonb("purpose_ids").notNull(),
  metadata: jsonb("metadata"),
  ipAddress: varchar("ip_address", { length: 255 }),
  userAgent: text("user_agent"),
  status: varchar("status", { length: 32 }).default("active").notNull(),
  withdrawalReason: text("withdrawal_reason"),
  givenAt: timestamp("given_at", { withTimezone: true }).defaultNow().notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  isActive: boolean("is_active").default(true).notNull(),
});

export const consentRecord = consentDb.table("consent_record", {
  id: varchar("id", { length: 255 }).primaryKey(),
  subjectId: varchar("subject_id", { length: 255 }).notNull(),
  consentId: varchar("consent_id", { length: 255 }),
  actionType: varchar("action_type", { length: 255 }).notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLog = consentDb.table("audit_log", {
  id: varchar("id", { length: 255 }).primaryKey(),
  entityType: varchar("entity_type", { length: 255 }).notNull(),
  entityId: varchar("entity_id", { length: 255 }).notNull(),
  actionType: varchar("action_type", { length: 255 }).notNull(),
  subjectId: varchar("subject_id", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 255 }),
  userAgent: text("user_agent"),
  changes: jsonb("changes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  eventTimezone: varchar("event_timezone", { length: 255 }).default("UTC").notNull(),
});

export const consentSchema = {
  subject,
  domain,
  consentPolicy,
  consentPurpose,
  consent,
  consentRecord,
  auditLog,
};

export type ConsentSchema = typeof consentSchema;
