import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "~/components/LanguageSwitcher";
import { Avatar } from "~/components/ui/avatar";
import {
  useCommonTranslation,
  useNavigationTranslation,
} from "~/hooks/useTypedTranslation";
import type { AuthUser } from "~/lib/auth/types";
import {
  detectLanguageFromPath,
  getLocalizedUrl as getLocalizedUrlFromDetector,
} from "~/lib/i18n/detector";
import { Route as RootRoute } from "~/routes/__root";
import { cn } from "~/shared/lib/utils";

type VisitorNavPath = "/" | "/events" | "/search" | "/systems" | "/teams";

type VisitorNavItem = {
  label: string;
  to: VisitorNavPath;
  search?: Record<string, unknown>;
};

const VISITOR_NAVIGATION: readonly VisitorNavItem[] = [
  { label: "Home", to: "/" },
  { label: "Events", to: "/events" },
  { label: "Find games", to: "/search" },
  { label: "Game systems", to: "/systems", search: {} },
  { label: "Teams", to: "/teams" },
];

interface VisitorShellProps {
  children: ReactNode;
  contentClassName?: string | undefined;
}

export function VisitorShell({ children, contentClassName }: VisitorShellProps) {
  const { t } = useCommonTranslation();
  const { t: navT } = useNavigationTranslation();
  const { ready: commonReady } = useTranslation("common");
  const { ready: navigationReady } = useTranslation("navigation");
  const { location } = useRouterState();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = RootRoute.useRouteContext() as { user: AuthUser | null };

  // Get current language from path
  const currentLanguage = detectLanguageFromPath(location.pathname);

  // Helper to get localized URL
  const getLocalizedNavUrl = (path: string) => {
    if (!currentLanguage) return path; // No language detected, return as-is
    return getLocalizedUrlFromDetector(path, currentLanguage, currentLanguage);
  };

  // Wait for translations to be ready to prevent hydration mismatch
  if (!commonReady || !navigationReady) {
    return (
      <div className="via-background to-background relative flex min-h-screen flex-col bg-gradient-to-b from-[#ffece0]">
        <header className="border-border/50 text-foreground sticky top-0 z-40 border-b bg-[color:color-mix(in_oklab,var(--surface-default)_92%,transparent)] shadow-sm transition-colors supports-[backdrop-filter]:bg-[color:color-mix(in_oklab,var(--surface-default)_88%,transparent)] supports-[backdrop-filter]:backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="bg-muted h-9 w-32 animate-pulse rounded" />
            <nav className="hidden items-center gap-2 text-sm font-medium md:flex">
              <div className="bg-muted h-8 w-20 animate-pulse rounded" />
              <div className="bg-muted h-8 w-16 animate-pulse rounded" />
              <div className="bg-muted h-8 w-24 animate-pulse rounded" />
              <div className="bg-muted h-8 w-28 animate-pulse rounded" />
              <div className="bg-muted h-8 w-16 animate-pulse rounded" />
            </nav>
            <div className="hidden items-center gap-3 md:flex">
              <div className="bg-muted h-8 w-16 animate-pulse rounded" />
              <div className="bg-muted h-8 w-20 animate-pulse rounded-full" />
            </div>
          </div>
          <div className="border-border/40 from-primary-soft/30 to-primary-soft/10 border-t bg-gradient-to-r via-transparent">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between md:px-8">
              <div className="bg-muted h-4 w-96 animate-pulse rounded" />
              <div className="text-muted-strong flex flex-wrap items-center gap-2 text-xs">
                <div className="bg-muted h-6 w-24 animate-pulse rounded-full" />
                <div className="bg-muted h-6 w-32 animate-pulse rounded-full" />
                <div className="bg-muted h-6 w-20 animate-pulse rounded-full" />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8 lg:max-w-7xl">
            <div className="bg-muted h-96 animate-pulse rounded" />
          </div>
        </main>
      </div>
    );
  }

  const dynamicNavigation = VISITOR_NAVIGATION.map((item) => ({
    ...item,
    label: navT(
      `main.${item.to === "/" ? "home" : item.to === "/search" ? "find_games" : item.to === "/systems" ? "game_systems" : item.to.replace("/", "")}`,
    ),
    to: getLocalizedNavUrl(item.to),
  }));

  const isActive = (path: string) => {
    const localizedPath = getLocalizedNavUrl(path);
    return (
      location.pathname === localizedPath ||
      location.pathname.startsWith(`${localizedPath}/`)
    );
  };

  return (
    <div className="via-background to-background relative flex min-h-screen flex-col bg-gradient-to-b from-[#ffece0]">
      <header className="border-border/50 text-foreground sticky top-0 z-40 border-b bg-[color:color-mix(in_oklab,var(--surface-default)_92%,transparent)] shadow-sm transition-colors supports-[backdrop-filter]:bg-[color:color-mix(in_oklab,var(--surface-default)_88%,transparent)] supports-[backdrop-filter]:backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link
            to={getLocalizedNavUrl("/")}
            search={(current) => current}
            params={(current) => current}
            className="text-foreground flex items-center gap-3 font-semibold"
          >
            <span className="roundup-star-logo h-9 w-9" aria-hidden="true" />
            <span className="flex flex-col leading-tight">
              <span className="text-primary text-xs font-semibold tracking-[0.3em] uppercase">
                {t("brand.name")}
              </span>
              <span className="text-base md:text-lg">{t("brand.slogan")}</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-2 text-sm font-medium md:flex">
            {dynamicNavigation.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                search={() => (item.search || {}) as never}
                params={() => ({}) as never}
                className={cn(
                  "rounded-full px-4 py-2 transition",
                  isActive(item.to)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-primary-soft/40 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher variant="compact" showLabel={false} />
            {user ? (
              <Link
                to={getLocalizedNavUrl("/player")}
                search={(current) => current}
                params={() => ({}) as never}
                className="border-border/60 hover:border-primary/60 hover:bg-primary/10 text-foreground flex items-center gap-3 rounded-full border px-3 py-2 text-sm font-semibold transition"
              >
                <Avatar
                  name={user.name}
                  email={user.email}
                  src={user.uploadedAvatarPath ?? user.image}
                  profileHref={null}
                  userId={user.id}
                  className="size-8"
                />
                <span>{user.name}</span>
              </Link>
            ) : (
              <>
                <Link
                  to={getLocalizedNavUrl("/auth/login")}
                  search={(current) => current}
                  params={() => ({}) as never}
                  className="text-muted-foreground hover:text-foreground text-sm font-semibold transition"
                >
                  {navT("user.login")}
                </Link>
                <Link
                  to={getLocalizedNavUrl("/auth/signup")}
                  search={(current) => current}
                  params={() => ({}) as never}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition"
                >
                  {navT("user.signup")}
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="text-muted-foreground md:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={
              isMenuOpen
                ? t("workspace.navigation.close")
                : t("workspace.navigation.open")
            }
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        <div className="border-border/40 from-primary-soft/30 to-primary-soft/10 border-t bg-gradient-to-r via-transparent">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between md:px-8">
            <p className="text-foreground font-medium">{t("hero.complete_profile")}</p>
            <div className="text-muted-strong flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-primary/15 text-primary rounded-full px-3 py-1 font-semibold">
                {t("hero.save_cities")}
              </span>
              <span className="bg-primary/15 text-primary rounded-full px-3 py-1 font-semibold">
                {t("hero.follow_storytellers")}
              </span>
              <span className="bg-primary/15 text-primary rounded-full px-3 py-1 font-semibold">
                {t("hero.book_quickly")}
              </span>
            </div>
          </div>
        </div>
        {isMenuOpen ? (
          <div className="border-border/40 border-t bg-[color:color-mix(in_oklab,var(--surface-default)_94%,transparent)] px-4 pt-4 pb-6 supports-[backdrop-filter]:bg-[color:color-mix(in_oklab,var(--surface-default)_88%,transparent)] supports-[backdrop-filter]:backdrop-blur md:hidden">
            <nav className="flex flex-col gap-2">
              {dynamicNavigation.map((item) => (
                <Link
                  key={`mobile-${item.to}`}
                  to={item.to}
                  search={() => (item.search || {}) as never}
                  params={() => ({}) as never}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    isActive(item.to)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-primary-soft/40 hover:text-foreground",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex justify-center">
                  <LanguageSwitcher variant="flags" />
                </div>
                {user ? (
                  <Link
                    to={getLocalizedNavUrl("/player")}
                    search={(current) => current}
                    params={() => ({}) as never}
                    className="border-border/60 hover:border-primary/60 hover:bg-primary/10 flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Avatar
                      name={user.name}
                      email={user.email}
                      src={user.uploadedAvatarPath ?? user.image}
                      profileHref={null}
                      userId={user.id}
                      className="size-8"
                    />
                    <span>{user.name}</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      to={getLocalizedNavUrl("/auth/login")}
                      search={(current) => current}
                      params={() => ({}) as never}
                      className="text-muted-foreground hover:text-foreground rounded-full px-4 py-2 text-sm font-semibold transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {navT("user.login")}
                    </Link>
                    <Link
                      to={getLocalizedNavUrl("/auth/signup")}
                      search={(current) => current}
                      params={() => ({}) as never}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {navT("user.signup")}
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main className="flex-1">
        <div
          className={cn(
            "mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8 lg:max-w-7xl",
            contentClassName,
          )}
        >
          {children}
        </div>
      </main>

      <footer className="border-border/40 bg-surface-default/80 border-t py-12">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-[1.5fr,1fr,1fr] md:px-8">
          <div className="space-y-3">
            <p className="text-muted-strong text-sm font-semibold tracking-[0.3em] uppercase">
              {t("brand.name")}
            </p>
            <p className="text-muted-strong text-sm">{t("footer.description")}</p>
          </div>
          <div className="space-y-2">
            <p className="text-foreground text-sm font-semibold">
              {t("footer.plan_visit")}
            </p>
            <div className="text-muted-strong flex flex-col gap-1 text-sm">
              <Link
                to={getLocalizedNavUrl("/events")}
                search={(current) => current}
                params={(current) => current}
                className="hover:text-foreground transition"
              >
                {t("footer.event_calendar")}
              </Link>
              <Link
                to={getLocalizedNavUrl("/search")}
                search={(current) => current}
                params={(current) => current}
                className="hover:text-foreground transition"
              >
                {t("footer.find_game_night")}
              </Link>
              <Link
                to={getLocalizedNavUrl("/systems")}
                search={(current) => current}
                params={(current) => current}
                className="hover:text-foreground transition"
              >
                {t("footer.browse_systems")}
              </Link>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-foreground text-sm font-semibold">
              {t("footer.stay_in_touch")}
            </p>
            <div className="text-muted-strong flex flex-col gap-1 text-sm">
              <Link
                to={getLocalizedNavUrl("/resources")}
                search={(current) => current}
                params={(current) => current}
                className="hover:text-foreground transition"
              >
                {t("footer.resources")}
              </Link>
              <Link
                to={getLocalizedNavUrl("/about")}
                search={(current) => current}
                params={(current) => current}
                className="hover:text-foreground transition"
              >
                {t("footer.about_roundup")}
              </Link>
              <a
                href="mailto:hello@roundup.games"
                className="hover:text-foreground transition"
              >
                {t("footer.contact_email")}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
