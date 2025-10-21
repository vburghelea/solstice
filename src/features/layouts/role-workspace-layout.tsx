import { useQueryClient } from "@tanstack/react-query";
import { Outlet, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { LogOut, Menu, X } from "lucide-react";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { toast } from "sonner";
import { LanguageSwitcher } from "~/components/LanguageSwitcher";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { LocalizedLink } from "~/components/ui/LocalizedLink";
import { RoleSwitcher } from "~/features/roles/components/role-switcher";
import { useActivePersona } from "~/features/roles/role-switcher-context";
import { useCommonTranslation, useRolesTranslation } from "~/hooks/useTypedTranslation";
import { auth } from "~/lib/auth-client";
import type { AuthUser } from "~/lib/auth/types";
import { detectLanguageFromPath, getLocalizedUrl } from "~/lib/i18n/detector";
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
  const { t } = useCommonTranslation();
  const { t: rolesT } = useRolesTranslation();
  const queryClient = useQueryClient();
  const routerInstance = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [navOpen, dispatchNavOpen] = useReducer(
    (state: boolean, action: "open" | "close" | "toggle") => {
      switch (action) {
        case "open":
          return true;
        case "close":
          return false;
        case "toggle":
          return !state;
        default:
          return state;
      }
    },
    false,
  );
  const persona = useActivePersona();
  const previousPersonaIdRef = useRef(persona.id);
  const location = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const { user } = RootRoute.useRouteContext() as { user: AuthUser | null };
  const currentLanguage = useMemo(() => detectLanguageFromPath(location), [location]);

  const handleSignOut = useCallback(async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const result = await auth.signOut();
      if (result?.error) {
        throw result.error;
      }
    } catch (error) {
      console.error("Failed to sign out:", error);
      toast.error(t("errors.sign_out_failed"));
      setIsSigningOut(false);
      return;
    }

    try {
      queryClient.clear();
      await routerInstance.invalidate();
    } finally {
      const loginRedirectPath = currentLanguage
        ? getLocalizedUrl("/auth/login", currentLanguage, currentLanguage)
        : "/auth/login";
      window.location.href = loginRedirectPath;
    }
  }, [currentLanguage, isSigningOut, queryClient, routerInstance, t]);

  const resolvedWorkspaceLabel =
    workspaceLabel ??
    rolesT(`personas.${persona.id}.label`) ??
    fallbackLabel ??
    t("workspace.label");
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

  useEffect(() => {
    const previousPersonaId = previousPersonaIdRef.current;
    if (previousPersonaId === persona.id) {
      return;
    }

    previousPersonaIdRef.current = persona.id;
    dispatchNavOpen("close");

    const rawTargetPath = persona.defaultRedirect ?? persona.namespacePath ?? "/";
    const targetPath = currentLanguage
      ? getLocalizedUrl(rawTargetPath, currentLanguage)
      : rawTargetPath;

    const isWithinNamespace =
      persona.namespacePath === "/"
        ? location === "/"
        : location.startsWith(persona.namespacePath);

    if (!isWithinNamespace || location !== targetPath) {
      void navigate({ to: targetPath } as never);
    }
  }, [currentLanguage, location, navigate, persona]);

  return (
    <div
      className="bg-background text-foreground min-h-dvh w-full"
      style={layoutStyleVars}
    >
      {navOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => dispatchNavOpen("close")}
          />
          <div className="border-border bg-background absolute inset-y-0 right-0 flex w-[min(90vw,22rem)] flex-col gap-6 border-l px-5 py-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium uppercase">
                  {resolvedWorkspaceLabel}
                </span>
                <span className="text-base font-semibold">{t("workspace.label")}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => dispatchNavOpen("close")}
                aria-label={t("workspace.navigation.close_workspace")}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <UserSummary user={user} showEmail t={t} />
            <div className="flex items-center justify-end gap-3">
              <LanguageSwitcher variant="compact" showLabel={false} />
              <RoleSwitcher />
            </div>
            <WorkspaceNavSection
              workspaceLabel={resolvedWorkspaceLabel}
              heading={t("workspace.tools")}
              items={workspaceNavItems}
              activePath={location}
              onNavigate={() => dispatchNavOpen("close")}
            />
            {accountNavItems.length ? (
              <WorkspaceNavSection
                workspaceLabel={resolvedWorkspaceLabel}
                heading={t("account.label")}
                items={accountNavItems}
                activePath={location}
                onNavigate={() => dispatchNavOpen("close")}
              />
            ) : null}
            {user ? (
              <div className="border-border/60 border-t pt-4">
                <SignOutButton
                  onSignOut={handleSignOut}
                  isSigningOut={isSigningOut}
                  className="w-full justify-center"
                  t={t}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <WorkspaceMobileHeader
          title={title}
          subtitle={headerSubtitle}
          onMenuClick={() => dispatchNavOpen("open")}
          t={t}
        />
        <main className="flex-1 px-4 pt-4 pb-[var(--workspace-mobile-main-padding)] sm:px-6 sm:pt-6 lg:px-10 lg:pb-12">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:max-w-[90%]">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
              <div className="flex flex-col gap-6">
                <div className="hidden lg:block">
                  <WorkspaceBrandHeader
                    subtitle={headerSubtitle}
                    title={title}
                    t={t}
                    {...(description ? { description } : {})}
                  />
                </div>
                {children ? <div className="flex flex-col gap-6">{children}</div> : null}
                <div>
                  <Suspense
                    fallback={
                      <div className="bg-surface-subtle border-subtle text-subtle token-gap-xs flex flex-col rounded-xl border border-dashed p-6">
                        <span className="text-eyebrow">{t("workspace.loading")}</span>
                        <p className="text-body-sm">{t("workspace.preparing")}</p>
                      </div>
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
                onSignOut={handleSignOut}
                isSigningOut={isSigningOut}
                t={t}
              />
            </div>
            {headerSlot ? <div className="hidden lg:block">{headerSlot}</div> : null}
          </div>
        </main>
        <WorkspaceMobileNav items={mobileNavItems} activePath={location} t={t} />
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
  onSignOut,
  isSigningOut,
  t,
}: {
  workspaceLabel: string;
  user: AuthUser | null;
  workspaceNavItems: RoleWorkspaceNavItem[];
  accountNavItems: RoleWorkspaceNavItem[];
  activePath: string;
  onSignOut: () => Promise<void> | void;
  isSigningOut: boolean;
  t: (key: string) => string;
}) {
  return (
    <aside
      className={cn(
        "border-border/60 bg-muted/40 hidden flex-col gap-6 rounded-2xl border p-4 lg:flex",
        "sm:p-6",
      )}
    >
      <div className="flex flex-col gap-4">
        <UserSummary user={user} showEmail t={t} />
        <div className="flex w-full items-center justify-end gap-3">
          <LanguageSwitcher variant="compact" showLabel={false} />
          <RoleSwitcher />
        </div>
      </div>
      <WorkspaceNavSection
        workspaceLabel={workspaceLabel}
        heading={t("workspace.tools")}
        items={workspaceNavItems}
        activePath={activePath}
      />
      {accountNavItems.length ? (
        <WorkspaceNavSection
          workspaceLabel={workspaceLabel}
          heading={t("account.label")}
          items={accountNavItems}
          activePath={activePath}
        />
      ) : null}
      {user ? (
        <div className="border-border/60 border-t pt-4">
          <SignOutButton
            onSignOut={onSignOut}
            isSigningOut={isSigningOut}
            className="w-full"
            t={t}
          />
        </div>
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
            <LocalizedLink
              key={item.to}
              to={item.to}
              translationKey={`workspace.navigation.${item.label.toLowerCase().replace(/\s+/g, "_")}`}
              translationNamespace="navigation"
              fallbackText={item.label}
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
            </LocalizedLink>
          );
        })}
      </nav>
    </div>
  );
}

function SignOutButton({
  onSignOut,
  isSigningOut,
  className,
  t,
}: {
  onSignOut: () => Promise<void> | void;
  isSigningOut: boolean;
  className?: string;
  t: (key: string) => string;
}) {
  const handleClick = () => {
    void onSignOut();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "border-destructive/50 text-destructive hover:bg-destructive/10 flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition disabled:opacity-60",
        className,
      )}
      disabled={isSigningOut}
    >
      <LogOut className="h-4 w-4" aria-hidden />
      <span>{isSigningOut ? t("buttons.signing_out") : t("buttons.sign_out")}</span>
    </button>
  );
}

function WorkspaceMobileHeader({
  title,
  subtitle,
  onMenuClick,
  t,
}: {
  title: string;
  subtitle: string;
  onMenuClick: () => void;
  t: (key: string) => string;
}) {
  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            aria-label={t("workspace.navigation.open_workspace")}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <LocalizedLink
            to="/"
            translationKey="brand.home"
            translationNamespace="navigation"
            fallbackText={t("brand.name")}
            className="text-foreground flex items-center gap-3"
          >
            <span className="roundup-star-logo h-8 w-8" aria-hidden="true" />
            <span className="flex flex-col leading-tight">
              <span className="text-primary text-[0.65rem] font-semibold tracking-[0.3em] uppercase">
                {t("brand.name")}
              </span>
              <span className="text-sm font-semibold">{t("brand.slogan")}</span>
            </span>
          </LocalizedLink>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="text-muted-foreground text-[0.65rem] font-semibold uppercase">
            {subtitle}
          </span>
          <span className="text-sm font-semibold">{title}</span>
        </div>
      </div>
    </header>
  );
}

function WorkspaceMobileNav({
  items,
  activePath,
  t,
}: {
  items: RoleWorkspaceNavItem[];
  activePath: string;
  t: (key: string) => string;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <nav
      className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-40 border-t backdrop-blur lg:hidden"
      style={{ paddingBottom: "calc(var(--workspace-mobile-safe-area))" }}
      aria-label={t("workspace.label")}
    >
      <ul className="flex items-stretch justify-between">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? activePath === item.to
            : activePath === item.to || activePath.startsWith(`${item.to}/`);
          return (
            <li key={item.to} className="flex-1">
              <LocalizedLink
                to={item.to}
                translationKey={`workspace.navigation.${item.label.toLowerCase().replace(/\s+/g, "_")}`}
                translationNamespace="navigation"
                fallbackText={item.label}
                className={cn(
                  "flex h-[var(--workspace-mobile-nav-height)] flex-col items-center justify-center gap-1 text-xs",
                  "text-muted-foreground transition",
                  isActive ? "text-primary" : undefined,
                )}
                aria-label={item.label}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{item.label}</span>
              </LocalizedLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function WorkspaceBrandHeader({
  subtitle,
  title,
  description,
  t,
}: {
  subtitle: string;
  title: string;
  description?: string;
  t: (key: string) => string;
}) {
  return (
    <section className="border-border/60 bg-muted/30 dark:bg-card/70 flex flex-col gap-6 rounded-2xl border px-5 py-6 shadow-sm sm:px-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <LocalizedLink
          to="/"
          translationKey="brand.home"
          translationNamespace="navigation"
          fallbackText={t("brand.name")}
          className="text-foreground flex items-center gap-3"
        >
          <span className="roundup-star-logo h-12 w-12" aria-hidden="true" />
          <span className="flex flex-col leading-tight">
            <span className="text-primary text-xs font-semibold tracking-[0.3em] uppercase">
              {t("brand.name")}
            </span>
            <span className="text-lg font-semibold md:text-xl">{t("brand.slogan")}</span>
          </span>
        </LocalizedLink>
        <div className="flex max-w-xl flex-col gap-2 text-left sm:items-end sm:text-right">
          <span className="text-muted-foreground text-xs font-semibold uppercase">
            {subtitle}
          </span>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          {description ? (
            <p className="text-muted-foreground text-sm">{description}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function UserSummary({
  user,
  showEmail = false,
  condensed = false,
  t,
}: {
  user: AuthUser | null;
  showEmail?: boolean;
  condensed?: boolean;
  t: (key: string) => string;
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
          {user.name ?? t("default_values.player_name")}
        </span>
        {showEmail || condensed ? (
          <span className="text-muted-foreground text-xs">{user.email}</span>
        ) : null}
      </div>
    </div>
  );
}
