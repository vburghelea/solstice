import { z } from "zod";

/**
 * Schema for localized link configuration
 */
export const LocalizedLinkSchema = z.object({
  // Core link properties
  to: z.string(),
  params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  search: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  children: z.any().optional(), // React children or translated text

  // Localization properties
  translationKey: z.string().optional(),
  translationNamespace: z.string().optional(),
  translationValues: z.record(z.string(), z.any()).optional(),

  // Link behavior
  external: z.boolean().optional(),
  replace: z.boolean().optional(),
  activeProps: z.record(z.string(), z.any()).optional(),
  inactiveProps: z.record(z.string(), z.any()).optional(),

  // Accessibility
  ariaLabel: z.string().optional(),
  ariaLabelTranslationKey: z.string().optional(),
  title: z.string().optional(),
  titleTranslationKey: z.string().optional(),

  // Advanced options
  preserveLanguage: z.boolean().optional(), // Force preserve current language
  targetLanguage: z.string().optional(), // Force specific language
  excludeLanguagePrefix: z.boolean().optional(), // For absolute paths that shouldn't have language
});

export type LocalizedLinkConfig = z.infer<typeof LocalizedLinkSchema>;

/**
 * Route registry for known application routes
 */
export const RouteRegistry = {
  // Authentication routes
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/signup",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },

  // Player routes
  PLAYER: {
    DASHBOARD: "/player",
    GAMES: "/player/games",
    GAME_CREATE: "/player/games/create",
    GAME_DETAILS: "/player/games/$gameId",
    EVENTS: "/player/events",
    EVENT_CREATE: "/player/events/create",
    EVENT_DETAILS: "/player/events/$eventId",
    CAMPAIGNS: "/player/campaigns",
    CAMPAIGN_CREATE: "/player/campaigns/create",
    CAMPAIGN_DETAILS: "/player/campaigns/$campaignId",
    TEAMS: "/player/teams",
    TEAM_CREATE: "/player/teams/create",
    TEAM_DETAILS: "/player/teams/$teamId",
    PROFILE: "/profile",
    SETTINGS: "/settings",
  },

  // GM routes
  GM: {
    DASHBOARD: "/gm",
    GAMES: "/gm/games",
    GAME_CREATE: "/gm/games/create",
    GAME_DETAILS: "/gm/games/$gameId",
  },

  // Admin routes
  ADMIN: {
    DASHBOARD: "/admin",
    SYSTEMS: "/admin/systems",
    SYSTEM_DETAILS: "/admin/systems/$systemId",
  },

  // Public routes
  PUBLIC: {
    HOME: "/",
    GAMES: "/games",
    GAME_DETAILS: "/games/$gameId",
    SYSTEMS: "/systems",
    SYSTEM_DETAILS: "/systems/$slug",
    EVENTS: "/events",
    EVENT_DETAILS: "/events/$slug",
    ABOUT: "/about",
    RESOURCES: "/resources",
    TEAMS: "/teams",
  },

  // Ops routes
  OPS: {
    DASHBOARD: "/ops",
  },
} as const;

export type RouteKey =
  | keyof typeof RouteRegistry
  | keyof typeof RouteRegistry.AUTH
  | keyof typeof RouteRegistry.PLAYER
  | keyof typeof RouteRegistry.GM
  | keyof typeof RouteRegistry.ADMIN
  | keyof typeof RouteRegistry.PUBLIC
  | keyof typeof RouteRegistry.OPS;
