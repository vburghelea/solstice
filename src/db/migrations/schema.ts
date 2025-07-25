import {
  boolean,
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const verification = pgTable("verification", {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const user = pgTable(
  "user",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean("email_verified").notNull(),
    image: text(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
    profileComplete: boolean("profile_complete").notNull(),
    gender: text(),
    pronouns: text(),
    phone: text(),
    privacySettings: text("privacy_settings"),
    profileVersion: integer("profile_version").notNull(),
    profileUpdatedAt: timestamp("profile_updated_at", { mode: "string" }),
  },
  (table) => [unique("user_email_unique").on(table.email)],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey().notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: "string" }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: "string" }),
    scope: text(),
    password: text(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "account_user_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    token: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "session_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("session_token_unique").on(table.token),
  ],
);

export const gameSystems = pgTable(
  "game_systems",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }),
    description: text(),
    images: text().array(),
    minPlayers: integer("min_players"),
    maxPlayers: integer("max_players"),
    optimalPlayers: integer("optimal_players"),
    averagePlayTime: integer("average_play_time"),
    ageRating: varchar("age_rating", { length: 50 }),
    complexityRating: varchar("complexity_rating", { length: 50 }),
    yearReleased: integer("year_released"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    unique("game_systems_name_unique").on(table.name),
    unique("game_systems_slug_unique").on(table.slug),
  ],
);

export const gameSystemCategories = pgTable(
  "game_system_categories",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
  },
  (table) => [unique("game_system_categories_name_unique").on(table.name)],
);

export const gameSystemMechanics = pgTable(
  "game_system_mechanics",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
  },
  (table) => [unique("game_system_mechanics_name_unique").on(table.name)],
);

export const gameSystemToCategory = pgTable(
  "game_system_to_category",
  {
    gameSystemId: integer("game_system_id").notNull(),
    categoryId: integer("category_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.gameSystemId],
      foreignColumns: [gameSystems.id],
      name: "game_system_to_category_game_system_id_game_systems_id_fk",
    }),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [gameSystemCategories.id],
      name: "game_system_to_category_category_id_game_system_categories_id_f",
    }),
    primaryKey({
      columns: [table.gameSystemId, table.categoryId],
      name: "game_system_to_category_game_system_id_category_id_pk",
    }),
  ],
);

export const gameSystemToMechanics = pgTable(
  "game_system_to_mechanics",
  {
    gameSystemId: integer("game_system_id").notNull(),
    mechanicsId: integer("mechanics_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.gameSystemId],
      foreignColumns: [gameSystems.id],
      name: "game_system_to_mechanics_game_system_id_game_systems_id_fk",
    }),
    foreignKey({
      columns: [table.mechanicsId],
      foreignColumns: [gameSystemMechanics.id],
      name: "game_system_to_mechanics_mechanics_id_game_system_mechanics_id_",
    }),
    primaryKey({
      columns: [table.gameSystemId, table.mechanicsId],
      name: "game_system_to_mechanics_game_system_id_mechanics_id_pk",
    }),
  ],
);

export const userGameSystemPreferences = pgTable(
  "user_game_system_preferences",
  {
    userId: text("user_id").notNull(),
    gameSystemId: integer("game_system_id").notNull(),
    preferenceType: text("preference_type").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "user_game_system_preferences_user_id_user_id_fk",
    }),
    foreignKey({
      columns: [table.gameSystemId],
      foreignColumns: [gameSystems.id],
      name: "user_game_system_preferences_game_system_id_game_systems_id_fk",
    }),
    primaryKey({
      columns: [table.userId, table.gameSystemId],
      name: "user_game_system_preferences_user_id_game_system_id_pk",
    }),
  ],
);
