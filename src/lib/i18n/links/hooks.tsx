import { useRouter, useRouterState } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { i18nConfig, type SupportedLanguage } from "~/lib/i18n/config";
import { detectLanguageFromPath } from "~/lib/i18n/detector";
import type { LocalizedLinkConfig } from "./schema";
import { buildSearchParams, getOptimalLocalizedPath, resolveRouteParams } from "./utils";

/**
 * Hook for managing localized navigation
 */
export function useLocalizedNavigation() {
  const router = useRouter();
  const routerState = useRouterState();
  const { i18n } = useTranslation();

  const currentLanguage = useMemo(() => {
    return (
      detectLanguageFromPath(routerState.location.pathname) ||
      (i18n.language as SupportedLanguage) ||
      i18nConfig.defaultLanguage
    );
  }, [routerState.location.pathname, i18n.language]);

  const navigateLocalized = useCallback(
    async (config: LocalizedLinkConfig | string) => {
      const normalizedConfig = typeof config === "string" ? { to: config } : config;

      const options: {
        preserveLanguage?: boolean;
        targetLanguage?: SupportedLanguage;
        excludeLanguagePrefix?: boolean;
      } = {};
      if (normalizedConfig.preserveLanguage !== undefined)
        options.preserveLanguage = normalizedConfig.preserveLanguage;
      if (normalizedConfig.targetLanguage !== undefined)
        options.targetLanguage = normalizedConfig.targetLanguage as SupportedLanguage;
      if (normalizedConfig.excludeLanguagePrefix !== undefined)
        options.excludeLanguagePrefix = normalizedConfig.excludeLanguagePrefix;

      const { path } = getOptimalLocalizedPath(
        normalizedConfig.to,
        routerState.location.pathname,
        options,
      );

      const finalPath = resolveRouteParams(path, normalizedConfig.params);
      const pathWithSearch = finalPath + buildSearchParams(normalizedConfig.search);

      await router.navigate({
        to: pathWithSearch,
        ...(normalizedConfig.replace && { replace: normalizedConfig.replace }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    },
    [router, routerState.location.pathname],
  );

  const getLocalizedPath = useCallback(
    (config: LocalizedLinkConfig | string) => {
      const normalizedConfig = typeof config === "string" ? { to: config } : config;

      const options: {
        preserveLanguage?: boolean;
        targetLanguage?: SupportedLanguage;
        excludeLanguagePrefix?: boolean;
      } = {};
      if (normalizedConfig.preserveLanguage !== undefined)
        options.preserveLanguage = normalizedConfig.preserveLanguage;
      if (normalizedConfig.targetLanguage !== undefined)
        options.targetLanguage = normalizedConfig.targetLanguage as SupportedLanguage;
      if (normalizedConfig.excludeLanguagePrefix !== undefined)
        options.excludeLanguagePrefix = normalizedConfig.excludeLanguagePrefix;

      const { path } = getOptimalLocalizedPath(
        normalizedConfig.to,
        routerState.location.pathname,
        options,
      );

      const finalPath = resolveRouteParams(path, normalizedConfig.params);
      return finalPath + buildSearchParams(normalizedConfig.search);
    },
    [routerState.location.pathname],
  );

  const changeLanguageAndNavigate = useCallback(
    async (targetLanguage: SupportedLanguage, path?: string) => {
      const targetPath = path || routerState.location.pathname;

      // Update i18n instance
      await i18n.changeLanguage(targetLanguage);

      // Navigate to localized version
      const { path: localizedPath } = getOptimalLocalizedPath(
        targetPath,
        routerState.location.pathname,
        { targetLanguage, preserveLanguage: true },
      );

      if (localizedPath !== routerState.location.pathname) {
        await router.navigate({
          to: localizedPath,
          replace: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      }
    },
    [router, routerState.location.pathname, i18n],
  );

  return {
    currentLanguage,
    supportedLanguages: i18nConfig.supportedLanguages,
    navigateLocalized,
    getLocalizedPath,
    changeLanguageAndNavigate,
    isDefaultLanguage: currentLanguage === i18nConfig.defaultLanguage,
  };
}

/**
 * Hook for creating localized link configurations
 */
export function useLocalizedLink() {
  const { currentLanguage, getLocalizedPath } = useLocalizedNavigation();
  const { t } = useTranslation();

  const createLink = useCallback(
    (config: LocalizedLinkConfig) => {
      const href = getLocalizedPath(config);

      // Resolve translated content
      let children = config.children;
      let ariaLabel = config.ariaLabel;
      let title = config.title;

      if (config.translationKey) {
        const ns = config.translationNamespace || "common";
        const translation = config.translationValues
          ? t(`${ns}:${config.translationKey}`, config.translationValues)
          : t(`${ns}:${config.translationKey}`);
        children = typeof translation === "string" ? translation : config.translationKey;
      }

      if (config.ariaLabelTranslationKey) {
        const ns = config.translationNamespace || "common";
        const translation = config.translationValues
          ? t(`${ns}:${config.ariaLabelTranslationKey}`, config.translationValues)
          : t(`${ns}:${config.ariaLabelTranslationKey}`);
        ariaLabel =
          typeof translation === "string" ? translation : config.ariaLabelTranslationKey;
      }

      if (config.titleTranslationKey) {
        const ns = config.translationNamespace || "common";
        const translation = config.translationValues
          ? t(`${ns}:${config.titleTranslationKey}`, config.translationValues)
          : t(`${ns}:${config.titleTranslationKey}`);
        title =
          typeof translation === "string" ? translation : config.titleTranslationKey;
      }

      return {
        href,
        children,
        ariaLabel,
        title,
        isExternal: href.startsWith("http") || href.includes(":"),
        shouldHaveLanguagePrefix:
          !href.startsWith("http") && !href.includes(":") && !href.startsWith("/api/"),
      };
    },
    [getLocalizedPath, t],
  );

  return {
    createLink,
    currentLanguage,
  };
}

/**
 * Hook for managing breadcrumbs with localization
 */
export function useLocalizedBreadcrumbs() {
  const { currentLanguage, getLocalizedPath } = useLocalizedNavigation();
  const { t } = useTranslation("navigation");

  const generateBreadcrumbs = useCallback(
    (path?: string) => {
      const currentPath = path || window.location.pathname;
      const segments = currentPath.split("/").filter(Boolean);

      // Remove language prefix if present
      const pathSegments = i18nConfig.supportedLanguages.includes(
        segments[0] as SupportedLanguage,
      )
        ? segments.slice(1)
        : segments;

      const breadcrumbs = [
        {
          label: t("main.home"),
          href: getLocalizedPath({ to: "/" }),
          isCurrent: pathSegments.length === 0,
        },
      ];

      let currentPathBuilder = "";
      for (const segment of pathSegments) {
        currentPathBuilder += `/${segment}`;

        // Skip numeric segments (likely IDs)
        if (/^\d+$/.test(segment)) {
          continue;
        }

        // Convert segment to readable name
        const label = t(`main.${segment}`, segment.replace(/[-_]/g, " "));

        breadcrumbs.push({
          label,
          href: getLocalizedPath({ to: currentPathBuilder }),
          isCurrent: currentPathBuilder === currentPath,
        });
      }

      return breadcrumbs;
    },
    [getLocalizedPath, t],
  );

  return {
    generateBreadcrumbs,
    currentLanguage,
  };
}
