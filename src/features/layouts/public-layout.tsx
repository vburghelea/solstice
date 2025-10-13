import { useRouterState } from "@tanstack/react-router";

import { InstallPrompt } from "~/components/ui/install-prompt";
import { PublicFooter } from "~/components/ui/public-footer";
import { PublicHeader } from "~/components/ui/public-header";
import { VisitorShell } from "~/features/layouts/visitor-shell";

import { cn } from "~/shared/lib/utils";

interface PublicLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PublicLayout({ children, className }: PublicLayoutProps) {
  const { location } = useRouterState();
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
      return location.pathname === "/";
    }

    return location.pathname === prefix || location.pathname.startsWith(`${prefix}/`);
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
