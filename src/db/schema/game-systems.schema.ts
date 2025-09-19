import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema";
import { mediaAssets } from "./media-assets.schema";
import { publishers } from "./publishers.schema";

export type ExternalRefs = {
  startplaying?: string;
  bgg?: string;
  wikipedia?: string;
  [key: string]: string | undefined;
};

export const gameSystems = pgTable("game_systems", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).unique().notNull(),
  slug: varchar("slug", { length: 255 }).unique(),
  descriptionCms: text("description_cms"),
  galleryImages: text("gallery_images").array(),
  descriptionScraped: text("description_scraped"),
  minPlayers: integer("min_players"),
  maxPlayers: integer("max_players"),
  optimalPlayers: integer("optimal_players"),
  averagePlayTime: integer("average_play_time"),
  ageRating: varchar("age_rating", { length: 50 }),
  complexityRating: varchar("complexity_rating", { length: 50 }),
  yearReleased: integer("year_released"),
  releaseDate: date("release_date"),
  publisherId: integer("publisher_id").references(() => publishers.id),
  publisherUrl: varchar("publisher_url", { length: 255 }),
  heroImageId: integer("hero_image_id"),
  sourceOfTruth: text("source_of_truth"),
  externalRefs: jsonb("external_refs").$type<ExternalRefs>(),
  crawlStatus: varchar("crawl_status", { length: 50 }),
  lastCrawledAt: timestamp("last_crawled_at"),
  lastSuccessAt: timestamp("last_success_at"),
  errorMessage: text("error_message"),
  isPublished: boolean("is_published").notNull().default(false),
  cmsVersion: integer("cms_version").default(1),
  cmsApproved: boolean("cms_approved").notNull().default(false),
  lastApprovedAt: timestamp("last_approved_at"),
  lastApprovedBy: text("last_approved_by").references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const gameSystemCategories = pgTable("game_system_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).unique().notNull(),
  description: text("description"),
});

export const gameSystemMechanics = pgTable("game_system_mechanics", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).unique().notNull(),
  description: text("description"),
});

export const gameSystemToCategory = pgTable(
  "game_system_to_category",
  {
    gameSystemId: integer("game_system_id")
      .notNull()
      .references(() => gameSystems.id),
    categoryId: integer("category_id")
      .notNull()
      .references(() => gameSystemCategories.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.gameSystemId, t.categoryId] }),
  }),
);

export const gameSystemToMechanics = pgTable(
  "game_system_to_mechanics",
  {
    gameSystemId: integer("game_system_id")
      .notNull()
      .references(() => gameSystems.id),
    mechanicsId: integer("mechanics_id")
      .notNull()
      .references(() => gameSystemMechanics.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.gameSystemId, t.mechanicsId] }),
  }),
);

export const userGameSystemPreferences = pgTable(
  "user_game_system_preferences",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    gameSystemId: integer("game_system_id")
      .notNull()
      .references(() => gameSystems.id),
    preferenceType: text("preference_type", { enum: ["favorite", "avoid"] }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.gameSystemId] }),
  }),
);

export const gameSystemRelations = relations(gameSystems, ({ many, one }) => ({
  categories: many(gameSystemToCategory),
  mechanics: many(gameSystemToMechanics),
  publisher: one(publishers, {
    fields: [gameSystems.publisherId],
    references: [publishers.id],
  }),
  heroImage: one(mediaAssets, {
    fields: [gameSystems.heroImageId],
    references: [mediaAssets.id],
  }),
}));

export const gameSystemCategoryRelations = relations(
  gameSystemCategories,
  ({ many }) => ({
    gameSystems: many(gameSystemToCategory),
  }),
);

export const gameSystemMechanicRelations = relations(gameSystemMechanics, ({ many }) => ({
  gameSystems: many(gameSystemToMechanics),
}));

export const gameSystemToCategoryRelations = relations(
  gameSystemToCategory,
  ({ one }) => ({
    gameSystem: one(gameSystems, {
      fields: [gameSystemToCategory.gameSystemId],
      references: [gameSystems.id],
    }),
    category: one(gameSystemCategories, {
      fields: [gameSystemToCategory.categoryId],
      references: [gameSystemCategories.id],
    }),
  }),
);

export const gameSystemToMechanicRelations = relations(
  gameSystemToMechanics,
  ({ one }) => ({
    gameSystem: one(gameSystems, {
      fields: [gameSystemToMechanics.gameSystemId],
      references: [gameSystems.id],
    }),
    mechanic: one(gameSystemMechanics, {
      fields: [gameSystemToMechanics.mechanicsId],
      references: [gameSystemMechanics.id],
    }),
  }),
);

// Types
export type GameSystem = typeof gameSystems.$inferSelect;
export type NewGameSystem = typeof gameSystems.$inferInsert;
export type GameSystemCategory = typeof gameSystemCategories.$inferSelect;
export type NewGameSystemCategory = typeof gameSystemCategories.$inferInsert;
export type GameSystemMechanic = typeof gameSystemMechanics.$inferSelect;
export type NewGameSystemMechanic = typeof gameSystemMechanics.$inferInsert;
export type UserGameSystemPreference = typeof userGameSystemPreferences.$inferSelect;
export type NewUserGameSystemPreference = typeof userGameSystemPreferences.$inferInsert;

export type { GameSystem as gameSystem };
