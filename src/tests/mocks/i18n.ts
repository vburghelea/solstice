import { vi } from "vitest";

// Import actual translation files directly
import adminTranslations from "../../lib/i18n/locales/en/admin.json";
import authTranslations from "../../lib/i18n/locales/en/auth.json";
import campaignsTranslations from "../../lib/i18n/locales/en/campaigns.json";
import collaborationTranslations from "../../lib/i18n/locales/en/collaboration.json";
import commonTranslations from "../../lib/i18n/locales/en/common.json";
import errorsTranslations from "../../lib/i18n/locales/en/errors.json";
import eventsTranslations from "../../lib/i18n/locales/en/events.json";
import formsTranslations from "../../lib/i18n/locales/en/forms.json";
import gameSystemsTranslations from "../../lib/i18n/locales/en/game-systems.json";
import gamesTranslations from "../../lib/i18n/locales/en/games.json";
import inboxTranslations from "../../lib/i18n/locales/en/inbox.json";
import membershipTranslations from "../../lib/i18n/locales/en/membership.json";
import navigationTranslations from "../../lib/i18n/locales/en/navigation.json";
import opsTranslations from "../../lib/i18n/locales/en/ops.json";
import playerTranslations from "../../lib/i18n/locales/en/player.json";
import profileTranslations from "../../lib/i18n/locales/en/profile.json";
import rolesTranslations from "../../lib/i18n/locales/en/roles.json";
import settingsTranslations from "../../lib/i18n/locales/en/settings.json";
import teamsTranslations from "../../lib/i18n/locales/en/teams.json";

// Flatten nested JSON structure to dot notation
function flattenTranslations(
  obj: Record<string, unknown>,
  prefix = "",
): Record<string, string> {
  const translations: Record<string, string> = {};

  Object.keys(obj).forEach((key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null) {
      Object.assign(
        translations,
        flattenTranslations(obj[key] as Record<string, unknown>, fullKey),
      );
    } else {
      translations[fullKey] = obj[key] as string;
    }
  });

  return translations;
}

// Combine and flatten all translation files
const flattenedTranslations: Record<string, string> = {
  ...flattenTranslations(commonTranslations, "common"),
  ...flattenTranslations(authTranslations, "auth"),
  ...flattenTranslations(gamesTranslations, "games"),
  ...flattenTranslations(eventsTranslations, "events"),
  ...flattenTranslations(teamsTranslations, "teams"),
  ...flattenTranslations(campaignsTranslations, "campaigns"),
  ...flattenTranslations(profileTranslations, "profile"),
  ...flattenTranslations(collaborationTranslations, "collaboration"),
  ...flattenTranslations(gameSystemsTranslations, "game-systems"),
  ...flattenTranslations(settingsTranslations, "settings"),
  ...flattenTranslations(inboxTranslations, "inbox"),
  ...flattenTranslations(membershipTranslations, "membership"),
  ...flattenTranslations(navigationTranslations, "navigation"),
  ...flattenTranslations(formsTranslations, "forms"),
  ...flattenTranslations(errorsTranslations, "errors"),
  ...flattenTranslations(rolesTranslations, "roles"),
  ...flattenTranslations(playerTranslations, "player"),
  ...flattenTranslations(opsTranslations, "ops"),
  ...flattenTranslations(adminTranslations, "admin"),
};

// Create mock translations that include both namespaced and common keys for test compatibility
const mockTranslations: Record<string, string> = {
  // Include all flattened translations (namespaced)
  ...flattenedTranslations,

  // Also include common keys without namespace for backward compatibility
  ...flattenTranslations(commonTranslations, ""),

  // Support both namespaced and non-namespaced keys for compatibility
  "login.welcome_back": authTranslations.login.welcome_back,
  "buttons.login": authTranslations.login.buttons.login,
  "buttons.logging_in": authTranslations.login.buttons.logging_in,
  "buttons.forgot_password": authTranslations.login.buttons.forgot_password,
  "buttons.no_account": authTranslations.login.buttons.no_account,
  "buttons.sign_up": authTranslations.login.buttons.sign_up,
  "login.oauth.login_with_google": authTranslations.login.oauth.login_with_google,
  "login.oauth.login_with_discord": authTranslations.login.oauth.login_with_discord,
  "login.oauth.or_continue_with": authTranslations.login.oauth.or_continue_with,
  "login.errors.invalid_credentials": authTranslations.login.errors.invalid_credentials,
  "login.errors.oauth_failed": authTranslations.login.errors.oauth_failed,
  "labels.email": authTranslations.signup.labels.email,
  "labels.password": authTranslations.signup.labels.password,
  "placeholders.email": authTranslations.signup.placeholders.email,
  "placeholders.password": authTranslations.signup.placeholders.password,
  "validation.invalid_email": commonTranslations.validation.invalid_email,
  "validation.password_required": commonTranslations.validation.password_required,
  // Player translations
  "player.ui.welcome_back": playerTranslations.dashboard.ui.welcome_back,
  "player.dashboard.ui.connections_radar.title":
    playerTranslations.dashboard.ui.connections_radar.title,
  "player.dashboard.privacy.invites_from_connections.label":
    playerTranslations.dashboard.privacy.invites_from_connections.label,
  "player.dashboard.notifications.review_reminders.description":
    playerTranslations.dashboard.notifications.review_reminders.description,
  "player.dashboard.ui.calendar_sync.join_pilot":
    playerTranslations.dashboard.ui.calendar_sync.join_pilot,
  "player.dashboard.actions.edit_profile":
    playerTranslations.dashboard.actions.edit_profile,
  "player.ui.membership_label": playerTranslations.dashboard.ui.membership_label,
  "player.ui.focus_spotlight.title":
    playerTranslations.dashboard.ui.focus_spotlight.title,
  "player.ui.focus_spotlight.subtitle":
    playerTranslations.dashboard.ui.focus_spotlight.subtitle,
  "player.ui.calendar_sync.title": playerTranslations.dashboard.ui.calendar_sync.title,
  "player.ui.calendar_sync.description":
    playerTranslations.dashboard.ui.calendar_sync.description,
  "player.dashboard.empty_states.experiment_loading":
    playerTranslations.dashboard.empty_states.experiment_loading,
  "player.ui.headquarters.title": playerTranslations.dashboard.ui.headquarters.title,
  "player.ui.subtitle": playerTranslations.dashboard.ui.subtitle,
  "player.ui.badges.privacy_ready": playerTranslations.dashboard.ui.badges.privacy_ready,
  "player.ui.teams_synced": playerTranslations.dashboard.ui.teams_synced,
  // Games create form translations
  "create.title": gamesTranslations.my_games.create.title,
  "create.subtitle": gamesTranslations.my_games.create.subtitle,
  "create.back_to_games": gamesTranslations.my_games.create.back_to_games,
  "create.failed_to_create_game": gamesTranslations.my_games.create.failed_to_create_game,
  "create.loading_campaign_data": gamesTranslations.my_games.create.loading_campaign_data,
  "create.campaign": gamesTranslations.my_games.create.campaign,
  "create.context_synced": gamesTranslations.my_games.create.context_synced,
  "create.select_a_campaign": gamesTranslations.my_games.create.select_a_campaign,
  "create.tips.title": gamesTranslations.my_games.create.tips.title,
  "create.tips.subtitle": gamesTranslations.my_games.create.tips.subtitle,
  "create.tips.logistics_first.title":
    gamesTranslations.my_games.create.tips.logistics_first.title,
  "create.tips.logistics_first.description":
    gamesTranslations.my_games.create.tips.logistics_first.description,
  "create.tips.safety_tooling.title":
    gamesTranslations.my_games.create.tips.safety_tooling.title,
  "create.tips.safety_tooling.description":
    gamesTranslations.my_games.create.tips.safety_tooling.description,
  "create.tips.campaign_context.title":
    gamesTranslations.my_games.create.tips.campaign_context.title,
  "create.tips.campaign_context.description":
    gamesTranslations.my_games.create.tips.campaign_context.description,
};

// Mock i18next instance for tests
const mockI18n = {
  language: "en",
  languages: ["en"],
  changeLanguage: vi.fn(),
  dir: vi.fn(() => "ltr"),
  isRTL: false,
  t: vi.fn((key: string) => mockTranslations[key] || key),
  exists: vi.fn(() => true),
  loadNamespace: vi.fn(() => Promise.resolve()),
  reloadResources: vi.fn(() => Promise.resolve()),
  getResource: vi.fn(),
  addResource: vi.fn(),
  addResources: vi.fn(),
  addResourceBundle: vi.fn(),
  hasResourceBundle: vi.fn(),
  getResourceBundle: vi.fn(),
  removeResourceBundle: vi.fn(),
  getFixedT: vi.fn(() => (key: string) => mockTranslations[key] || key),
  init: vi.fn(() => Promise.resolve()),
};

// Mock useTranslation hook
export const mockUseTranslation = vi.fn((namespace?: string) => {
  const getTranslation = (key: string, params?: Record<string, unknown>) => {
    // Try namespaced key first, then fallback to non-namespaced
    const namespacedKey = namespace ? `${namespace}.${key}` : key;
    let translation = mockTranslations[namespacedKey] || mockTranslations[key];

    // Handle interpolation/parameter substitution
    if (translation && params && typeof translation === "string") {
      Object.entries(params).forEach(([param, value]) => {
        const regex = new RegExp(`{{${param}}}`, "g");
        translation = translation.replace(regex, String(value));
      });
    }

    // If no translation found, return the key as-is (this helps debugging)
    return translation || key;
  };

  return {
    t: vi.fn((key: string, params?: Record<string, unknown>) =>
      getTranslation(key, params),
    ),
    i18n: mockI18n,
    ready: true,
  };
});

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: mockUseTranslation,
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock i18next instance
vi.mock("~/lib/i18n/i18n", () => ({
  default: mockI18n,
}));

// Mock namespace-specific translation hooks
/* eslint-disable @eslint-react/hooks-extra/no-unnecessary-use-prefix */
vi.mock("~/hooks/useTypedTranslation", () => ({
  useTypedTranslation: mockUseTranslation,
  useNamespaceTranslation: (namespace: string) => mockUseTranslation(namespace),
  useCommonTranslation: () => mockUseTranslation("common"),
  useAuthTranslation: () => mockUseTranslation("auth"),
  useNavigationTranslation: () => mockUseTranslation("navigation"),
  useGamesTranslation: () => mockUseTranslation("games"),
  useEventsTranslation: () => mockUseTranslation("events"),
  useTeamsTranslation: () => mockUseTranslation("teams"),
  useFormsTranslation: () => mockUseTranslation("forms"),
  useErrorsTranslation: () => mockUseTranslation("errors"),
  useGameSystemsTranslation: () => mockUseTranslation("game-systems"),
  useAdminTranslation: () => mockUseTranslation("admin"),
  useCampaignsTranslation: () => mockUseTranslation("campaigns"),
  useMembershipTranslation: () => mockUseTranslation("membership"),
  usePlayerTranslation: () => mockUseTranslation("player"),
  useProfileTranslation: () => mockUseTranslation("profile"),
  useSettingsTranslation: () => mockUseTranslation("settings"),
  useCollaborationTranslation: () => mockUseTranslation("collaboration"),
  useConsentTranslation: () => mockUseTranslation("consent"),
  useGmTranslation: () => mockUseTranslation("gm"),
  useInboxTranslation: () => mockUseTranslation("inbox"),
  useOpsTranslation: () => mockUseTranslation("ops"),
  useRolesTranslation: () => mockUseTranslation("roles"),
  useSocialTranslation: () => mockUseTranslation("social"),
}));
/* eslint-enable @eslint-react/hooks-extra/no-unnecessary-use-prefix */

// Export mock for use in tests
export { mockI18n };
