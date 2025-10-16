import { vi } from "vitest";

// Mock translations for common keys
const mockTranslations: Record<string, string> = {
  // Auth translations (these match what the component actually calls)
  "auth.login.welcome_back": "Welcome back to Roundup Games",
  "auth.buttons.login": "Login",
  "auth.buttons.logging_in": "Logging in...",
  "auth.buttons.forgot_password": "Forgot Password?",
  "auth.login.buttons.no_account": "Don't have an account?",
  "auth.login.buttons.sign_up": "Sign up",
  "auth.login.oauth.login_with_google": "Login with Google",
  "auth.login.oauth.login_with_discord": "Login with Discord",
  "auth.login.oauth.or_continue_with": "Or",
  "auth.login.errors.invalid_credentials": "Invalid email or password",
  "auth.login.errors.oauth_failed": "OAuth login failed",

  // Common translations
  "common.labels.email": "Email",
  "common.labels.password": "Password",
  "common.placeholders.email": "hello@example.com",
  "common.placeholders.password": "Password",
  "common.validation.invalid_email": "Invalid email",
  "common.validation.password_required": "Password is required",

  // Support both namespaced and non-namespaced keys for compatibility
  "login.welcome_back": "Welcome back to Roundup Games",
  "buttons.login": "Login",
  "buttons.logging_in": "Logging in...",
  "buttons.forgot_password": "Forgot Password?",
  "buttons.no_account": "Don't have an account?",
  "buttons.sign_up": "Sign up",
  "login.oauth.login_with_google": "Login with Google",
  "login.oauth.login_with_discord": "Login with Discord",
  "login.oauth.or_continue_with": "Or",
  "login.errors.invalid_credentials": "Invalid email or password",
  "login.errors.oauth_failed": "OAuth login failed",
  "labels.email": "Email",
  "labels.password": "Password",
  "placeholders.email": "hello@example.com",
  "placeholders.password": "Password",
  "validation.invalid_email": "Invalid email",
  "validation.password_required": "Password is required",
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
  const getTranslation = (key: string) => {
    // Try namespaced key first, then fallback to non-namespaced
    const namespacedKey = namespace ? `${namespace}.${key}` : key;
    return mockTranslations[namespacedKey] || mockTranslations[key] || key;
  };

  return {
    t: vi.fn((key: string) => getTranslation(key)),
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
  useAdminTranslation: () => mockUseTranslation("admin"),
  useCampaignsTranslation: () => mockUseTranslation("campaigns"),
  useMembershipTranslation: () => mockUseTranslation("membership"),
  usePlayerTranslation: () => mockUseTranslation("player"),
  useProfileTranslation: () => mockUseTranslation("profile"),
  useSettingsTranslation: () => mockUseTranslation("settings"),
  useCollaborationTranslation: () => mockUseTranslation("collaboration"),
  useConsentTranslation: () => mockUseTranslation("consent"),
  useGameSystemsTranslation: () => mockUseTranslation("game-systems"),
  useGmTranslation: () => mockUseTranslation("gm"),
  useInboxTranslation: () => mockUseTranslation("inbox"),
  useMembersTranslation: () => mockUseTranslation("members"),
  useOpsTranslation: () => mockUseTranslation("ops"),
  useReviewsTranslation: () => mockUseTranslation("reviews"),
  useRolesTranslation: () => mockUseTranslation("roles"),
  useSocialTranslation: () => mockUseTranslation("social"),
}));
/* eslint-enable @eslint-react/hooks-extra/no-unnecessary-use-prefix */

// Export mock for use in tests
export { mockI18n };
