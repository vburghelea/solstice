import { useRouterState } from "@tanstack/react-router";

import { InstallPrompt } from "~/components/ui/install-prompt";
import { PublicFooter } from "~/components/ui/public-footer";
import { PublicHeader } from "~/components/ui/public-header";

import { cn } from "~/shared/lib/utils";

interface PublicLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PublicLayout({ children, className }: PublicLayoutProps) {
  const { location } = useRouterState();
  const isVisitPath = location.pathname.startsWith("/visit");

  if (isVisitPath) {
    if (className) {
      return <div className={cn(className)}>{children}</div>;
    }

    return <>{children}</>;
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
