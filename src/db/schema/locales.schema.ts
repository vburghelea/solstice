import { boolean, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

/**
 * Supported locales for the platform
 */
export const locales = pgTable("locales", {
  code: varchar("code", { length: 10 }).primaryKey(), // 'en', 'de', 'pl'
  name: varchar("name", { length: 100 }).notNull(), // 'English', 'German', 'Polish'
  nativeName: varchar("native_name", { length: 100 }).notNull(), // 'English', 'Deutsch', 'Polski'
  flag: varchar("flag", { length: 10 }).notNull(), // '🇬🇧', '🇩🇪', '🇵🇱'
  isRTL: boolean("is_rtl").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * User language preferences
 */
export const userLanguagePreferences = pgTable("user_language_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  preferredLanguage: varchar("preferred_language", { length: 10 })
    .notNull()
    .default("en"),
  fallbackLanguage: varchar("fallback_language", { length: 10 }).notNull().default("en"),
  autoDetectEnabled: boolean("auto_detect_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Translations for dynamic content (future use)
 */
export const translations = pgTable("translations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'game_system', 'event', 'team'
  entityId: integer("entity_id").notNull(),
  fieldName: varchar("field_name", { length: 50 }).notNull(), // 'name', 'description', 'rules'
  languageCode: varchar("language_code", { length: 10 }).notNull(),
  content: text("content").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Indexes for better performance
 */
export const userLanguagePreferencesIndex = {
  userId: userLanguagePreferences.userId,
};

export const translationsEntityIndex = {
  entityType: translations.entityType,
  entityId: translations.entityId,
};

export const translationsLanguageIndex = {
  languageCode: translations.languageCode,
};

export const translationsUniqueIndex = {
  entity: translations.entityType,
  id: translations.entityId,
  field: translations.fieldName,
  language: translations.languageCode,
};

// Types
export type Locale = typeof locales.$inferSelect;
export type NewLocale = typeof locales.$inferInsert;
export type UserLanguagePreference = typeof userLanguagePreferences.$inferSelect;
export type NewUserLanguagePreference = typeof userLanguagePreferences.$inferInsert;
export type Translation = typeof translations.$inferSelect;
export type NewTranslation = typeof translations.$inferInsert;
