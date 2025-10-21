import type { ComponentProps, ReactNode } from "react";
import React from "react";
import { mockNavigate } from "./router";

// This mock eliminates hardcoded translation strings by using actual translation files
// It mirrors the approach used in src/tests/mocks/i18n.ts to avoid circular dependencies
// All translation strings come from the actual JSON translation files
//
// IMPORTANT: If translation keys are missing from the JSON files, fix the component
// to use the correct translation keys rather than hardcoding workarounds here.

// Import translation files directly (same approach as in i18n.ts)
import authTranslations from "../../lib/i18n/locales/en/auth.json";
import commonTranslations from "../../lib/i18n/locales/en/common.json";
import navigationTranslations from "../../lib/i18n/locales/en/navigation.json";

// Flatten nested JSON structure to dot notation (same as in i18n.ts)
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

// Combine the actual translation files we need for LocalizedLink components
const localizedLinkTranslations: Record<string, string> = {
  ...flattenTranslations(commonTranslations, "common"),
  ...flattenTranslations(authTranslations, "auth"),
  ...flattenTranslations(navigationTranslations, "navigation"),
};

// Translation function that uses actual translation strings
const mockT = (key: string, namespace?: string): string => {
  // Try to find the translation in our centralized key structure
  const fullKey = namespace && !key.startsWith(namespace) ? `${namespace}.${key}` : key;

  // First try the full key
  if (localizedLinkTranslations[fullKey]) {
    return localizedLinkTranslations[fullKey];
  }

  // Fallback to key alone if not found
  if (localizedLinkTranslations[key]) {
    return localizedLinkTranslations[key];
  }

  // Final fallback: return the key as-is for debugging
  return key;
};

interface LocalizedLinkMockProps {
  to: string;
  children?: ReactNode;
  translationKey?: string;
  fallbackText?: string;
  translationNamespace?: string;
  [key: string]: unknown;
}

// Props interface for more complex LocalizedLink with function children
interface ComplexLocalizedLinkMockProps {
  to: string;
  children:
    | ReactNode
    | ((args: { isActive: boolean; isTransitioning: boolean }) => ReactNode);
  translationKey?: string;
  fallbackText?: string;
  translationNamespace?: string;
  [key: string]: unknown;
}

// Create a centralized LocalizedLink mock that handles navigation
export const LocalizedLinkMock = ({
  to,
  children,
  translationKey,
  translationNamespace,
  ...props
}: LocalizedLinkMockProps) => {
  // Extract needed props before filtering
  const { fallbackText: extractedFallbackText, params, search, ...restProps } = props;

  // Filter out non-DOM props
  const nonDomProps = [
    "translationKey",
    "fallbackText",
    "translationNamespace",
    "translationValues",
    "params",
    "search",
    "external",
    "replace",
    "activeProps",
    "inactiveProps",
    "ariaLabelTranslationKey",
    "titleTranslationKey",
    "preserveLanguage",
    "targetLanguage",
    "excludeLanguagePrefix",
    "variant",
    "size",
  ];

  const domProps: Record<string, unknown> = {};
  Object.keys(restProps).forEach((key) => {
    if (!nonDomProps.includes(key)) {
      domProps[key] = restProps[key];
    }
  });

  // Process route parameters
  let processedHref = to;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      processedHref = processedHref.replace(`$${key}`, String(value));
    }
  }

  // Process search parameters
  if (search) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null && value !== false) {
        searchParams.set(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      processedHref += `?${queryString}`;
    }
  }

  // Handle navigation
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const onClick = props["onClick"] as
      | ((event: React.MouseEvent<HTMLAnchorElement>) => void)
      | undefined;
    onClick?.(event);

    if (!event.defaultPrevented && !processedHref.startsWith("http")) {
      event.preventDefault();
      mockNavigate({ to: processedHref });
    }
  };

  // Handle translation - prioritize fallbackText, then children, then translation key lookup
  const content =
    extractedFallbackText ||
    children ||
    (translationKey ? mockT(translationKey, translationNamespace) : null) ||
    "Link";

  return React.createElement(
    "a",
    { href: processedHref, ...domProps, onClick: handleClick },
    content as React.ReactNode,
  );
};

// Complex version for tests that need function children
export const ComplexLocalizedLinkMock = ({
  to,
  children,
  translationKey,
  translationNamespace,
  ...props
}: ComplexLocalizedLinkMockProps) => {
  // Extract needed props before filtering
  const { fallbackText: extractedFallbackText, ...restProps } = props;

  // Filter out non-DOM props
  const nonDomProps = [
    "translationKey",
    "fallbackText",
    "translationNamespace",
    "translationValues",
    "params",
    "search",
    "external",
    "replace",
    "activeProps",
    "inactiveProps",
    "ariaLabelTranslationKey",
    "titleTranslationKey",
    "preserveLanguage",
    "targetLanguage",
    "excludeLanguagePrefix",
    "variant",
    "size",
  ];

  const domProps: Record<string, unknown> = {};
  Object.keys(restProps).forEach((key) => {
    if (!nonDomProps.includes(key)) {
      domProps[key] = restProps[key];
    }
  });

  // Handle navigation
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const onClick = props["onClick"] as
      | ((event: React.MouseEvent<HTMLAnchorElement>) => void)
      | undefined;
    onClick?.(event);

    if (!event.defaultPrevented && !to.startsWith("http")) {
      event.preventDefault();
      mockNavigate({ to });
    }
  };

  const renderedChildren =
    typeof children === "function"
      ? children({ isActive: false, isTransitioning: false })
      : extractedFallbackText ||
        children ||
        (translationKey ? mockT(translationKey, translationNamespace) : null) ||
        "Link";

  return React.createElement(
    "a",
    { href: to, ...domProps, onClick: handleClick },
    renderedChildren as React.ReactNode,
  );
};

// Version with conditional to prop handling
export const ConditionalLocalizedLinkMock = ({
  to,
  children,
  translationKey,
  translationNamespace,
  ...props
}: ComponentProps<"a"> & {
  to?: unknown;
  translationKey?: string;
  fallbackText?: string;
  translationNamespace?: string;
  [key: string]: unknown;
}) => {
  // Extract needed props before filtering
  const { fallbackText: extractedFallbackText, ...restProps } = props;

  // Filter out non-DOM props
  const nonDomProps = [
    "translationKey",
    "fallbackText",
    "translationNamespace",
    "translationValues",
    "params",
    "search",
    "external",
    "replace",
    "activeProps",
    "inactiveProps",
    "ariaLabelTranslationKey",
    "titleTranslationKey",
    "preserveLanguage",
    "targetLanguage",
    "excludeLanguagePrefix",
    "variant",
    "size",
  ];

  const domProps: Record<string, unknown> = {};
  Object.keys(restProps).forEach((key) => {
    if (!nonDomProps.includes(key)) {
      domProps[key] = restProps[key];
    }
  });

  // Handle navigation
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const onClick = props["onClick"] as
      | ((event: React.MouseEvent<HTMLAnchorElement>) => void)
      | undefined;
    onClick?.(event);

    if (!event.defaultPrevented && typeof to === "string" && !to.startsWith("http")) {
      event.preventDefault();
      mockNavigate({ to });
    }
  };

  const content =
    extractedFallbackText ||
    children ||
    (translationKey ? mockT(translationKey, translationNamespace) : null) ||
    "Link";

  return React.createElement(
    "a",
    { ...domProps, href: typeof to === "string" ? to : "#", onClick: handleClick },
    content as React.ReactNode,
  );
};

// Create the centralized LocalizedLink mock object
export const localizedLinkMock = {
  LocalizedLink: LocalizedLinkMock,
  LocalizedButtonLink: LocalizedLinkMock,
  LocalizedNavLink: LocalizedLinkMock,
  LocalizedSubtleLink: LocalizedLinkMock,
  LocalizedExternalLink: ({ ...props }: LocalizedLinkMockProps) => (
    <LocalizedLinkMock {...props} />
  ),
};
