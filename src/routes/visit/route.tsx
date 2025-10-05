import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { cn } from "~/shared/lib/utils";

type VisitNavPath =
  | "/visit"
  | "/visit/events"
  | "/visit/search"
  | "/visit/systems"
  | "/visit/teams";

type VisitNavItem = {
  label: string;
  to: VisitNavPath;
  search?: unknown;
};

const VISIT_NAVIGATION: readonly VisitNavItem[] = [
  { label: "Home", to: "/visit" },
  { label: "Events", to: "/visit/events" },
  { label: "Find games", to: "/visit/search" },
  { label: "Game systems", to: "/visit/systems", search: {} },
  { label: "Teams", to: "/visit/teams" },
];

export const Route = createFileRoute("/visit")({
  component: VisitLayout,
});

function VisitLayout() {
  const { location } = useRouterState();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className="via-background to-background relative flex min-h-screen flex-col bg-gradient-to-b from-[#ffece0]">
      <header className="border-border/40 bg-surface-default/90 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link
            to="/visit"
            className="text-foreground flex items-center gap-3 font-semibold"
          >
            <span className="roundup-star-logo h-9 w-9" aria-hidden="true" />
            <span className="flex flex-col leading-tight">
              <span className="text-primary text-xs font-semibold tracking-[0.3em] uppercase">
                Roundup Games
              </span>
              <span className="text-base md:text-lg">Visit experience</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-2 text-sm font-medium md:flex">
            {VISIT_NAVIGATION.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                search={(item.search ?? undefined) as never}
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
          <div className="hidden items-center gap-2 md:flex">
            <Link
              to="/auth/login"
              className="text-muted-foreground hover:text-foreground text-sm font-semibold transition"
            >
              Sign in
            </Link>
            <Link
              to="/auth/signup"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition"
            >
              Create profile
            </Link>
          </div>
          <button
            type="button"
            className="text-muted-foreground md:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        <div className="border-border/30 from-primary-soft/30 to-primary-soft/20 border-t bg-gradient-to-r via-transparent">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between md:px-8">
            <p className="text-foreground font-medium">
              Complete your player profile to match with storytellers, venues, and
              schedules tailored to you.
            </p>
            <div className="text-muted-strong flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-primary/15 text-primary rounded-full px-3 py-1 font-semibold">
                Save cities
              </span>
              <span className="bg-primary/15 text-primary rounded-full px-3 py-1 font-semibold">
                Follow storytellers
              </span>
              <span className="bg-primary/15 text-primary rounded-full px-3 py-1 font-semibold">
                Book quickly
              </span>
            </div>
          </div>
        </div>
        {isMenuOpen ? (
          <div className="border-border/20 bg-surface-default/95 border-t px-4 pt-4 pb-6 md:hidden">
            <nav className="flex flex-col gap-2">
              {VISIT_NAVIGATION.map((item) => (
                <Link
                  key={`mobile-${item.to}`}
                  to={item.to}
                  search={(item.search ?? undefined) as never}
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
                <Link
                  to="/auth/login"
                  className="text-muted-foreground hover:text-foreground rounded-full px-4 py-2 text-sm font-semibold transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  to="/auth/signup"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Create profile
                </Link>
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>

      <footer className="border-border/40 bg-surface-default/80 border-t py-12">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-[1.5fr,1fr,1fr] md:px-8">
          <div className="space-y-3">
            <p className="text-muted-strong text-sm font-semibold tracking-[0.3em] uppercase">
              Roundup Games
            </p>
            <p className="text-muted-strong text-sm">
              Stories, campaigns, and community events curated for curious explorers.
              Start with a city, save your preferences, and we'll connect you when the
              right table opens up.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-foreground text-sm font-semibold">Plan your visit</p>
            <div className="text-muted-strong flex flex-col gap-1 text-sm">
              <Link to="/visit/events" className="hover:text-foreground transition">
                Event calendar
              </Link>
              <Link to="/visit/search" className="hover:text-foreground transition">
                Find a game night
              </Link>
              <Link to="/visit/systems" className="hover:text-foreground transition">
                Browse systems
              </Link>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-foreground text-sm font-semibold">Stay in touch</p>
            <div className="text-muted-strong flex flex-col gap-1 text-sm">
              <Link to="/visit/resources" className="hover:text-foreground transition">
                Resources
              </Link>
              <Link to="/visit/about" className="hover:text-foreground transition">
                About Roundup
              </Link>
              <a
                href="mailto:hello@roundup.games"
                className="hover:text-foreground transition"
              >
                hello@roundup.games
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
