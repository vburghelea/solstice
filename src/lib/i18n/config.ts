export const i18nConfig = {
  supportedLanguages: ["en", "de", "pl"] as const,
  defaultLanguage: "en" as const,
  fallbackLanguage: "en" as const,
  namespaces: [
    "common", // Shared UI elements, buttons, status messages
    "auth", // Login, signup, password reset, security
    "navigation", // Navigation menus, breadcrumbs, links
    "admin", // Admin dashboard, user management, insights
    "campaigns", // Campaign creation, management, participation
    "collaboration", // Collaboration tools and features
    "consent", // Cookie consent, privacy agreements
    "events", // Event creation, management, attendance
    "game-systems", // Game system management and rules
    "games", // Game listings, details, reviews
    "gm", // Game master tools and features
    "inbox", // Messaging and notifications
    "layouts", // Layout components and structure
    "membership", // Membership plans and billing
    "ops", // Operations and system management
    "player", // Player dashboard and profile
    "profile", // User profile management
    "roles", // Role management and permissions
    "settings", // Application and user settings
    "social", // Social features and interactions
    "teams", // Team creation and management
    "forms", // Form validation and input labels
    "errors", // Error messages and error pages
    "home", // Home page and landing content
    "about", // About page and company information
    "resources", // Resources page and toolkits
  ] as const,

  // i18next configuration
  interpolation: {
    escapeValue: false, // React already escapes by default
  },

  // Backend configuration for loading translations
  backend: {
    loadPath: "/locales/{{lng}}/{{ns}}.json",
  },

  // Language detection configuration
  detection: {
    order: ["path", "cookie", "localStorage", "navigator", "htmlTag"] as string[],
    caches: ["localStorage", "cookie"] as string[],
    lookupCookie: "i18next",
    lookupLocalStorage: "i18nextLng",
    checkWhitelist: true,
  },

  // React i18next configuration
  react: {
    useSuspense: false, // TanStack Start handles suspense differently
    bindI18n: "languageChanged",
    bindI18nStore: "added removed",
    transEmptyNodeValue: "",
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ["br", "strong", "i", "em", "span"],
  },

  // Debug mode (development only)
  debug: process.env["NODE_ENV"] === "development",
};

export type Namespace = (typeof i18nConfig.namespaces)[number];
export type SupportedLanguage = (typeof i18nConfig.supportedLanguages)[number];
