import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

export const gameSystems = pgTable("game_systems", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).unique().notNull(),
  slug: varchar("slug", { length: 255 }).unique(),
  description: text("description"),
  images: text("images").array(),
  minPlayers: integer("min_players"),
  maxPlayers: integer("max_players"),
  optimalPlayers: integer("optimal_players"),
  averagePlayTime: integer("average_play_time"),
  ageRating: varchar("age_rating", { length: 50 }),
  complexityRating: varchar("complexity_rating", { length: 50 }),
  yearReleased: integer("year_released"),
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

export const gameSystemRelations = relations(gameSystems, ({ many }) => ({
  categories: many(gameSystemToCategory),
  mechanics: many(gameSystemToMechanics),
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
