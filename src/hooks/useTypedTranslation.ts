import { useTranslation } from "react-i18next";
import { Namespace, SupportedLanguage } from "~/lib/i18n/config";
import { AllTranslationKeys } from "~/lib/i18n/types";

/**
 * Type-safe translation hook
 * Ensures translation keys are valid at compile time
 */
export const useTypedTranslation = (ns?: Namespace | Namespace[]) => {
  const { t, i18n } = useTranslation(ns);

  return {
    t: (key: AllTranslationKeys, options?: Record<string, unknown>) =>
      t(key, options as Record<string, unknown>),
    changeLanguage: i18n.changeLanguage,
    currentLanguage: i18n.language as SupportedLanguage,
    isRTL: i18n.dir() === "rtl",
    supportedLanguages: i18n.languages.filter((lang): lang is SupportedLanguage =>
      ["en", "de", "pl"].includes(lang),
    ),
  };
};

/**
 * Hook for namespace-specific translations
 */
export const useNamespaceTranslation = <T extends Namespace>(namespace: T) => {
  const { t, i18n } = useTranslation(namespace);

  return {
    t: (key: string, options?: Record<string, unknown>) =>
      t(key, options as Record<string, unknown>),
    changeLanguage: i18n.changeLanguage,
    currentLanguage: i18n.language as SupportedLanguage,
    isRTL: i18n.dir() === "rtl",
    namespace,
  };
};

/**
 * Hook for common translations
 */
export const useCommonTranslation = () => {
  return useNamespaceTranslation("common");
};

/**
 * Hook for auth translations
 */
export const useAuthTranslation = () => {
  return useNamespaceTranslation("auth");
};

/**
 * Hook for navigation translations
 */
export const useNavigationTranslation = () => {
  return useNamespaceTranslation("navigation");
};

/**
 * Hook for games translations
 */
export const useGamesTranslation = () => {
  return useNamespaceTranslation("games");
};

/**
 * Hook for events translations
 */
export const useEventsTranslation = () => {
  return useNamespaceTranslation("events");
};

/**
 * Hook for teams translations
 */
export const useTeamsTranslation = () => {
  return useNamespaceTranslation("teams");
};

/**
 * Hook for player translations
 */
export const usePlayerTranslation = () => {
  return useNamespaceTranslation("player");
};

/**
 * Hook for admin translations
 */
export const useAdminTranslation = () => {
  return useNamespaceTranslation("admin");
};

/**
 * Hook for campaigns translations
 */
export const useCampaignsTranslation = () => {
  return useNamespaceTranslation("campaigns");
};

/**
 * Hook for membership translations
 */
export const useMembershipTranslation = () => {
  return useNamespaceTranslation("membership");
};

/**
 * Hook for settings translations
 */
export const useSettingsTranslation = () => {
  return useNamespaceTranslation("settings");
};

/**
 * Hook for profile translations
 */
export const useProfileTranslation = () => {
  return useNamespaceTranslation("profile");
};

/**
 * Hook for forms translations
 */
export const useFormsTranslation = () => {
  return useNamespaceTranslation("forms");
};

/**
 * Hook for errors translations
 */
export const useErrorsTranslation = () => {
  return useNamespaceTranslation("errors");
};

/**
 * Hook for collaboration translations
 */
export const useCollaborationTranslation = () => {
  return useNamespaceTranslation("collaboration");
};

/**
 * Hook for consent translations
 */
export const useConsentTranslation = () => {
  return useNamespaceTranslation("consent");
};

/**
 * Hook for game-systems translations
 */
export const useGameSystemsTranslation = () => {
  return useNamespaceTranslation("game-systems");
};

/**
 * Hook for gm translations
 */
export const useGmTranslation = () => {
  return useNamespaceTranslation("gm");
};

/**
 * Hook for inbox translations
 */
export const useInboxTranslation = () => {
  return useNamespaceTranslation("inbox");
};

/**
 * Hook for members translations
 */
export const useMembersTranslation = () => {
  return useNamespaceTranslation("members");
};

/**
 * Hook for ops translations
 */
export const useOpsTranslation = () => {
  return useNamespaceTranslation("ops");
};

/**
 * Hook for reviews translations
 */
export const useReviewsTranslation = () => {
  return useNamespaceTranslation("reviews");
};

/**
 * Hook for roles translations
 */
export const useRolesTranslation = () => {
  return useNamespaceTranslation("roles");
};

/**
 * Hook for social translations
 */
export const useSocialTranslation = () => {
  return useNamespaceTranslation("social");
};
