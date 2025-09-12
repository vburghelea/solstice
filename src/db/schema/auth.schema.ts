import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { experienceLevelOptions } from "~/shared/types/common";

// Enums for profile fields
export const experienceLevelEnum = pgEnum("experience_level", experienceLevelOptions);

// Types for JSONB fields
export type DayAvailability = boolean[]; // 96 slots for 15-minute intervals
export interface AvailabilityData {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export const defaultDayAvailability: DayAvailability = Array(96).fill(false);
export const defaultAvailabilityData: AvailabilityData = {
  monday: [...defaultDayAvailability],
  tuesday: [...defaultDayAvailability],
  wednesday: [...defaultDayAvailability],
  thursday: [...defaultDayAvailability],
  friday: [...defaultDayAvailability],
  saturday: [...defaultDayAvailability],
  sunday: [...defaultDayAvailability],
};

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  // When a user uploads an avatar, we store the local path here.
  // This should take precedence over provider images for display.
  uploadedAvatarPath: text("uploaded_avatar_path"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  // Profile completion tracking
  profileComplete: boolean("profile_complete")
    .$defaultFn(() => false)
    .notNull(),

  // Basic profile fields
  gender: text("gender"),
  pronouns: text("pronouns"),
  phone: text("phone"),
  city: text("city"),
  country: text("country"),

  // Array fields stored as JSONB
  languages: jsonb("languages").$type<string[]>().default([]),
  identityTags: jsonb("identity_tags").$type<string[]>().default([]),
  preferredGameThemes: jsonb("preferred_game_themes").$type<string[]>().default([]),

  // Game preferences
  overallExperienceLevel: experienceLevelEnum("overall_experience_level"),

  // Calendar availability
  calendarAvailability: jsonb("calendar_availability")
    .$type<AvailabilityData>()
    .default(defaultAvailabilityData),

  // Privacy and preferences
  privacySettings: text("privacy_settings"), // JSON string

  // GM-specific fields
  isGM: boolean("is_gm").default(false),
  gamesHosted: integer("games_hosted").default(0),
  averageResponseTime: integer("average_response_time"), // in minutes
  responseRate: integer("response_rate").default(0), // percentage 0-100
  gmStyle: text("gm_style"),
  gmRating: real("gm_rating"), // average rating out of 5 (one decimal)

  // Audit and versioning
  profileVersion: integer("profile_version")
    .$defaultFn(() => 1)
    .notNull(),
  profileUpdatedAt: timestamp("profile_updated_at").$defaultFn(() => new Date()),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => /* @__PURE__ */ new Date()),
});

// Types
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;
