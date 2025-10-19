import { useRouterState } from "@tanstack/react-router";

import { InstallPrompt } from "~/components/ui/install-prompt";
import { PublicFooter } from "~/components/ui/public-footer";
import { PublicHeader } from "~/components/ui/public-header";
import { VisitorShell } from "~/features/layouts/visitor-shell";
import { detectLanguageFromPath } from "~/lib/i18n/detector";
import { cn } from "~/shared/lib/utils";

interface PublicLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PublicLayout({ children, className }: PublicLayoutProps) {
  const { location } = useRouterState();
  const normalizedPathname = (() => {
    const detectedLanguage = detectLanguageFromPath(location.pathname);

    if (!detectedLanguage) {
      return location.pathname;
    }

    const languagePrefix = `/${detectedLanguage}`;
    if (location.pathname === languagePrefix) {
      return "/";
    }

    if (location.pathname.startsWith(`${languagePrefix}/`)) {
      const trimmed = location.pathname.slice(languagePrefix.length);
      return trimmed ? trimmed : "/";
    }

    return location.pathname;
  })();
  const marketingPrefixes = [
    "/",
    "/events",
    "/search",
    "/game",
    "/systems",
    "/resources",
    "/teams",
    "/about",
  ];

  const isMarketingPath = marketingPrefixes.some((prefix) => {
    if (prefix === "/") {
      return normalizedPathname === "/";
    }

    return normalizedPathname === prefix || normalizedPathname.startsWith(`${prefix}/`);
  });

  if (isMarketingPath) {
    return (
      <VisitorShell contentClassName={className ? cn(className) : undefined}>
        {children}
      </VisitorShell>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-grow">{children}</main>
      <PublicFooter />
      <InstallPrompt />
    </div>
  );
}
