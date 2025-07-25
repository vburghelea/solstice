import { relations } from "drizzle-orm/relations";
import {
  account,
  gameSystemCategories,
  gameSystemMechanics,
  gameSystems,
  gameSystemToCategory,
  gameSystemToMechanics,
  session,
  user,
  userGameSystemPreferences,
} from "./schema";

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
  userGameSystemPreferences: many(userGameSystemPreferences),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
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

export const gameSystemsRelations = relations(gameSystems, ({ many }) => ({
  gameSystemToCategories: many(gameSystemToCategory),
  gameSystemToMechanics: many(gameSystemToMechanics),
  userGameSystemPreferences: many(userGameSystemPreferences),
}));

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
