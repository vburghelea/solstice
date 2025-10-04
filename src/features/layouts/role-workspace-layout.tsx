import { Outlet, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Menu, X } from "lucide-react";
import { Suspense, useMemo, useState, type CSSProperties, type ReactNode } from "react";

import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { PersonaNamespaceFallback } from "~/features/layouts/persona-namespace-layout";
import { RoleSwitcher } from "~/features/roles/components/role-switcher";
import { useActivePersona } from "~/features/roles/role-switcher-context";
import type { AuthUser } from "~/lib/auth/types";
import { Route as RootRoute } from "~/routes/__root";
import { cn } from "~/shared/lib/utils";

export interface RoleWorkspaceNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  exact?: boolean;
  badge?: ReactNode;
  inMobileNav?: boolean;
  section?: "workspace" | "account";
}

export interface RoleWorkspaceLayoutProps {
  title: string;
  description?: string;
  subtitle?: string;
  navItems: RoleWorkspaceNavItem[];
  headerSlot?: ReactNode;
  children?: ReactNode;
  fallbackLabel?: string;
  workspaceLabel?: string;
}

const layoutStyleVars = {
  "--workspace-sidebar-width": "16.5rem",
  "--workspace-mobile-nav-height": "3.5rem",
  "--workspace-mobile-safe-area": "env(safe-area-inset-bottom)",
  "--workspace-mobile-main-padding":
    "calc(var(--workspace-mobile-nav-height) + var(--workspace-mobile-safe-area) + 2.25rem)",
  "--workspace-sticky-offset":
    "calc(var(--workspace-mobile-nav-height) + var(--workspace-mobile-safe-area) + 0.75rem)",
} as CSSProperties;

export function RoleWorkspaceLayout({
  title,
  description,
  subtitle,
  navItems,
  headerSlot,
  children,
  fallbackLabel,
  workspaceLabel,
}: RoleWorkspaceLayoutProps) {
  const [navOpen, setNavOpen] = useState(false);
  const persona = useActivePersona();
  const location = useRouterState({ select: (state) => state.location.pathname });
  const { user } = RootRoute.useRouteContext() as { user: AuthUser | null };

  const resolvedWorkspaceLabel =
    workspaceLabel ?? persona?.label ?? fallbackLabel ?? "Workspace";
  const headerSubtitle =
    subtitle ??
    (user?.name ? `${user.name}'s workspace` : `${resolvedWorkspaceLabel} workspace`);

  const workspaceNavItems = useMemo(
    () => navItems.filter((item) => (item.section ?? "workspace") === "workspace"),
    [navItems],
  );

  const accountNavItems = useMemo(
    () => navItems.filter((item) => item.section === "account"),
    [navItems],
  );

  const mobileNavItems = useMemo(() => {
    const items = workspaceNavItems.filter((item) => item.inMobileNav !== false);
    if (items.length <= 4) {
      return items;
    }
    return items.slice(0, 4);
  }, [workspaceNavItems]);

  return (
    <div
      className="bg-background text-foreground min-h-dvh w-full"
      style={layoutStyleVars}
    >
      {navOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setNavOpen(false)}
          />
          <div className="border-border bg-background absolute inset-y-0 right-0 flex w-[min(90vw,22rem)] flex-col gap-6 border-l px-5 py-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium uppercase">
                  {resolvedWorkspaceLabel}
                </span>
                <span className="text-base font-semibold">Workspace</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setNavOpen(false)}
                aria-label="Close workspace navigation"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <UserSummary user={user} showEmail />
            <div className="flex items-center justify-end">
              <RoleSwitcher />
            </div>
            <WorkspaceNavSection
              workspaceLabel={resolvedWorkspaceLabel}
              heading="Workspace tools"
              items={workspaceNavItems}
              activePath={location}
              onNavigate={() => setNavOpen(false)}
            />
            {accountNavItems.length ? (
              <WorkspaceNavSection
                workspaceLabel={resolvedWorkspaceLabel}
                heading="Account"
                items={accountNavItems}
                activePath={location}
                onNavigate={() => setNavOpen(false)}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <WorkspaceMobileHeader
          workspaceLabel={resolvedWorkspaceLabel}
          title={title}
          onMenuClick={() => setNavOpen(true)}
        />
        <main className="flex-1 px-4 pt-4 pb-[var(--workspace-mobile-main-padding)] sm:px-6 sm:pt-6 lg:px-10 lg:pb-12">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:max-w-[90%]">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
              <div className="flex flex-col gap-6">
                <WorkspaceHeader
                  subtitle={headerSubtitle}
                  title={title}
                  {...(description ? { description } : {})}
                />
                {children ? <div className="flex flex-col gap-6">{children}</div> : null}
                <div>
                  <Suspense
                    fallback={
                      <PersonaNamespaceFallback
                        label={fallbackLabel ?? resolvedWorkspaceLabel}
                      />
                    }
                  >
                    <Outlet />
                  </Suspense>
                </div>
                {headerSlot ? <div className="lg:hidden">{headerSlot}</div> : null}
              </div>
              <WorkspaceSummaryPanel
                workspaceLabel={resolvedWorkspaceLabel}
                user={user}
                workspaceNavItems={workspaceNavItems}
                accountNavItems={accountNavItems}
                activePath={location}
              />
            </div>
            {headerSlot ? <div className="hidden lg:block">{headerSlot}</div> : null}
          </div>
        </main>
        <WorkspaceMobileNav items={mobileNavItems} activePath={location} />
      </div>
    </div>
  );
}

function WorkspaceSummaryPanel({
  workspaceLabel,
  user,
  workspaceNavItems,
  accountNavItems,
  activePath,
}: {
  workspaceLabel: string;
  user: AuthUser | null;
  workspaceNavItems: RoleWorkspaceNavItem[];
  accountNavItems: RoleWorkspaceNavItem[];
  activePath: string;
}) {
  return (
    <aside
      className={cn(
        "border-border/60 bg-muted/40 hidden flex-col gap-6 rounded-2xl border p-4 lg:flex",
        "sm:p-6",
      )}
    >
      <div className="flex flex-col gap-4">
        <UserSummary user={user} showEmail />
        <div className="flex w-full items-center justify-end">
          <RoleSwitcher />
        </div>
      </div>
      <WorkspaceNavSection
        workspaceLabel={workspaceLabel}
        heading="Workspace tools"
        items={workspaceNavItems}
        activePath={activePath}
      />
      {accountNavItems.length ? (
        <WorkspaceNavSection
          workspaceLabel={workspaceLabel}
          heading="Account"
          items={accountNavItems}
          activePath={activePath}
        />
      ) : null}
    </aside>
  );
}

function WorkspaceNavSection({
  workspaceLabel,
  heading,
  items,
  activePath,
  onNavigate,
}: {
  workspaceLabel: string;
  heading: string;
  items: RoleWorkspaceNavItem[];
  activePath: string;
  onNavigate?: () => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-muted-foreground text-xs font-semibold uppercase">
        {heading}
      </span>
      <nav
        className="flex flex-col gap-2"
        aria-label={`${workspaceLabel} ${heading.toLowerCase()}`}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? activePath === item.to
            : activePath === item.to || activePath.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "group flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition",
                "border-border/60 bg-background/80 hover:border-primary/50 hover:bg-primary/10",
                isActive
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm leading-none font-medium">{item.label}</span>
                {item.description ? (
                  <span className="text-muted-foreground text-xs leading-snug">
                    {item.description}
                  </span>
                ) : null}
              </span>
              {item.badge ? (
                <span className="text-xs font-medium">{item.badge}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function WorkspaceMobileHeader({
  workspaceLabel,
  title,
  onMenuClick,
}: {
  workspaceLabel: string;
  title: string;
  onMenuClick: () => void;
}) {
  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            aria-label="Open workspace navigation"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs font-medium uppercase">
              {workspaceLabel}
            </span>
            <span className="text-sm font-semibold">{title}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function WorkspaceMobileNav({
  items,
  activePath,
}: {
  items: RoleWorkspaceNavItem[];
  activePath: string;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <nav
      className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-40 border-t backdrop-blur lg:hidden"
      style={{ paddingBottom: "calc(var(--workspace-mobile-safe-area))" }}
      aria-label="Workspace"
    >
      <ul className="flex items-stretch justify-between">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? activePath === item.to
            : activePath === item.to || activePath.startsWith(`${item.to}/`);
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                className={cn(
                  "flex h-[var(--workspace-mobile-nav-height)] flex-col items-center justify-center gap-1 text-xs",
                  "text-muted-foreground transition",
                  isActive ? "text-primary" : undefined,
                )}
                aria-label={item.label}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function WorkspaceHeader({
  subtitle,
  title,
  description,
}: {
  subtitle: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {subtitle}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-muted-foreground max-w-2xl text-sm">{description}</p>
        ) : null}
      </div>
    </section>
  );
}

function UserSummary({
  user,
  showEmail = false,
  condensed = false,
}: {
  user: AuthUser | null;
  showEmail?: boolean;
  condensed?: boolean;
}) {
  if (!user) {
    return null;
  }
  return (
    <div className="flex items-center gap-3">
      <Avatar
        name={user.name}
        email={user.email}
        src={user.uploadedAvatarPath ?? user.image}
        className={condensed ? "size-8" : "size-10"}
        fallback={user.name ?? user.email ?? "U"}
        userId={user.id}
      />
      <div className="flex flex-col text-left">
        <span className="text-foreground text-sm font-medium">
          {user.name ?? "Member"}
        </span>
        {showEmail || condensed ? (
          <span className="text-muted-foreground text-xs">{user.email}</span>
        ) : null}
      </div>
    </div>
  );
}
