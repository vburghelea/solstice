import { useNavigate, useRouterState } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import { useLocalizedLink } from "~/lib/i18n/links/hooks";
import type { LocalizedLinkConfig } from "~/lib/i18n/links/schema";
import { cn } from "~/shared/lib/utils";

// Link variants using class-variance-authority
const linkVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "text-primary underline-offset-4 hover:underline",
        destructive: "text-destructive underline-offset-4 hover:underline",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        subtle: "text-muted-foreground hover:text-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface LocalizedLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children">,
    Omit<LocalizedLinkConfig, "children">,
    VariantProps<typeof linkVariants> {
  children?: React.ReactNode;
  fallbackText?: string; // Fallback if translation fails
  loadingComponent?: React.ComponentType<{ className?: string }>;
  errorComponent?: React.ComponentType<{ error?: string; className?: string }>;
}

/**
 * High-performance, fully localized link component
 *
 * Features:
 * - Automatic language prefix handling
 * - Translation key integration
 * - External link detection and security
 * - Accessibility support with translations
 * - Type-safe route configuration
 * - Performance optimized with memoization
 */
export const LocalizedLink = ({
  ref,
  to,
  params,
  search,
  translationKey,
  translationNamespace = "common",
  translationValues,
  external,
  replace,
  activeProps,
  inactiveProps,
  ariaLabel,
  ariaLabelTranslationKey,
  title,
  titleTranslationKey,
  preserveLanguage,
  targetLanguage,
  excludeLanguagePrefix,
  variant,
  size,
  className,
  children,
  fallbackText,
  loadingComponent,
  errorComponent,
  onClick,
  ...rest
}: LocalizedLinkProps & { ref?: React.RefObject<HTMLAnchorElement | null> }) => {
  const routerState = useRouterState();
  const navigate = useNavigate();
  const { createLink, currentLanguage } = useLocalizedLink();

  // Create the localized link configuration
  const linkConfig: LocalizedLinkConfig = React.useMemo(
    () => ({
      to,
      params,
      search,
      translationKey,
      translationNamespace,
      translationValues,
      external,
      replace,
      activeProps,
      inactiveProps,
      ariaLabel,
      ariaLabelTranslationKey,
      title,
      titleTranslationKey,
      preserveLanguage,
      targetLanguage,
      excludeLanguagePrefix,
    }),
    [
      to,
      params,
      search,
      translationKey,
      translationNamespace,
      translationValues,
      external,
      replace,
      activeProps,
      inactiveProps,
      ariaLabel,
      ariaLabelTranslationKey,
      title,
      titleTranslationKey,
      preserveLanguage,
      targetLanguage,
      excludeLanguagePrefix,
    ],
  );

  // Generate localized link properties
  const linkProps = React.useMemo(() => {
    try {
      return createLink(linkConfig);
    } catch (error) {
      console.error("LocalizedLink: Error creating link", error);
      return {
        href: "#",
        children: fallbackText || "Link Error",
        ariaLabel: "Error creating link",
        title: "Error creating link",
        isExternal: false,
        shouldHaveLanguagePrefix: false,
      };
    }
  }, [createLink, linkConfig, fallbackText]);

  // Check if link is active
  const isActive = React.useMemo(() => {
    const pathname = linkProps.href.split("?")[0];
    return routerState.location.pathname === pathname;
  }, [linkProps.href, routerState.location.pathname]);

  // Compose props based on active state
  const composedProps = React.useMemo(() => {
    const baseProps = inactiveProps || {};
    const activeStateProps = isActive ? activeProps : {};
    return { ...baseProps, ...activeStateProps };
  }, [isActive, activeProps, inactiveProps]);

  // Handle click events
  const handleClick = React.useCallback(
    async (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);

      if (event.defaultPrevented) {
        return;
      }

      // Only handle navigation for internal links
      if (!linkProps.isExternal) {
        event.preventDefault();

        try {
          // Use the navigate function with the localized href
          await navigate({
            to: linkProps.href,
            replace,
          } as never);
        } catch (error) {
          console.error("LocalizedLink: Navigation failed", error);
          // Fallback to window.location if navigation fails
          window.location.href = linkProps.href;
        }
      }
    },
    [onClick, linkProps.isExternal, linkProps.href, navigate, replace],
  );

  // Combine className from variants and props
  const finalClassName = React.useMemo(() => {
    const variantClasses = linkVariants({ variant, size });
    const propsClassName = composedProps["className"] as string | undefined;
    return cn(variantClasses, className, propsClassName);
  }, [variant, size, className, composedProps]);

  // Handle external link security
  const externalProps = React.useMemo(() => {
    if (linkProps.isExternal) {
      return {
        target: "_blank",
        rel: "noopener noreferrer",
      };
    }
    return {};
  }, [linkProps.isExternal]);

  // Merge all props, filtering out non-DOM attributes
  const mergedProps = React.useMemo(() => {
    const { ...restComposedProps } = composedProps;

    // Define props that should not be passed to DOM element
    const nonDomProps = [
      "translationKey",
      "translationNamespace",
      "translationValues",
      "fallbackText",
      "loadingComponent",
      "errorComponent",
      "params",
      "search",
      "external",
      "replace",
      "activeProps",
      "inactiveProps",
      "ariaLabel",
      "ariaLabelTranslationKey",
      "titleTranslationKey",
      "preserveLanguage",
      "targetLanguage",
      "excludeLanguagePrefix",
      "variant",
      "size",
      "to",
      "className",
      "onClick",
      "children",
      "ref",
    ];

    // Combine all props and filter out non-DOM attributes
    const allProps = { ...rest, ...restComposedProps, ...linkConfig };
    const domProps: Record<string, unknown> = {};

    (Object.keys(allProps) as Array<keyof typeof allProps>).forEach((key) => {
      if (!nonDomProps.includes(String(key))) {
        domProps[String(key)] = allProps[key];
      }
    });

    return {
      ...externalProps,
      ...domProps,
    };
  }, [composedProps, externalProps, rest, linkConfig]);

  // Handle loading and error states
  if (loadingComponent && !linkProps.children) {
    const LoadingComp = loadingComponent;
    return <LoadingComp className={finalClassName} />;
  }

  if (errorComponent && linkProps.href === "#") {
    const ErrorComp = errorComponent;
    return (
      <ErrorComp error="Failed to create localized link" className={finalClassName} />
    );
  }

  return (
    <a
      ref={ref}
      {...mergedProps}
      className={finalClassName}
      href={linkProps.href}
      aria-label={linkProps.ariaLabel}
      title={linkProps.title}
      onClick={handleClick}
      data-current-language={currentLanguage}
      data-is-localized={linkProps.shouldHaveLanguagePrefix}
      data-is-external={linkProps.isExternal}
      data-is-active={isActive}
    >
      {children || linkProps.children}
    </a>
  );
};

LocalizedLink.displayName = "LocalizedLink";

// Export convenience components for common patterns
export const LocalizedNavLink: React.FC<LocalizedLinkProps> = (props) => (
  <LocalizedLink {...props} variant="link" />
);

export const LocalizedButtonLink: React.FC<LocalizedLinkProps> = (props) => (
  <LocalizedLink {...props} variant="primary" />
);

export const LocalizedSubtleLink: React.FC<LocalizedLinkProps> = (props) => (
  <LocalizedLink {...props} variant="subtle" />
);

export const LocalizedExternalLink: React.FC<LocalizedLinkProps> = (props) => (
  <LocalizedLink {...props} external={true} />
);
