import { useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { LocalizedButtonLink, LocalizedNavLink } from "~/components/ui/LocalizedLink";
import {
  useCommonTranslation,
  useNavigationTranslation,
} from "~/hooks/useTypedTranslation";
import type { AuthUser } from "~/lib/auth/types";
import { Route as RootRoute } from "~/routes/__root";
import { cn } from "~/shared/lib/utils";
import { Avatar } from "./avatar";
import { Button } from "./button";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = RootRoute.useRouteContext() as {
    user: AuthUser | null;
  };
  const { location } = useRouterState();
  const { t } = useCommonTranslation();
  const { t: navT } = useNavigationTranslation();

  const navLinks = [
    {
      label: navT("main.events"),
      to: "/events",
      translationKey: "main.events",
    },
    {
      label: navT("main.find_games"),
      to: "/search",
      translationKey: "main.find_games",
    },
    {
      label: navT("main.game_systems"),
      to: "/systems",
      translationKey: "main.game_systems",
    },
    {
      label: navT("main.teams"),
      to: "/teams",
      translationKey: "main.teams",
    },
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <header className="border-border/60 bg-background/95 text-foreground supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 border-b shadow-sm transition-colors supports-[backdrop-filter]:backdrop-blur">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex h-16 items-center justify-between sm:h-20">
          <LocalizedNavLink
            to="/"
            className="flex items-center gap-2 sm:gap-3"
            ariaLabelTranslationKey="links.navigation.go_home"
          >
            <div
              className="roundup-star-logo h-8 w-8 sm:h-10 sm:w-10"
              aria-hidden="true"
            ></div>
            <h1 className="text-lg font-extrabold tracking-tight sm:text-xl">
              {t("brand.name")}
            </h1>
          </LocalizedNavLink>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-4 text-sm font-semibold lg:flex lg:gap-6">
            {navLinks.map((item) => (
              <LocalizedNavLink
                key={item.to}
                to={item.to}
                translationKey={item.translationKey}
                translationNamespace="navigation"
                className={cn(
                  "text-muted-foreground rounded-full px-3 py-2 transition-colors",
                  isActivePath(item.to)
                    ? "bg-brand-red text-white shadow-sm"
                    : "hover:bg-brand-red/10 hover:text-brand-red",
                )}
              />
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <LocalizedButtonLink
                to="/player"
                ariaLabelTranslationKey="links.accessibility.link_aria_label.user_profile"
                className="border-border/60 hover:border-brand-red/60 hover:bg-brand-red/10 text-foreground flex items-center gap-3 rounded-full border px-3 py-2 text-sm font-semibold transition"
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
              </LocalizedButtonLink>
            ) : (
              <>
                <LocalizedButtonLink
                  to="/auth/login"
                  translationKey="links.actions.login"
                  translationNamespace="navigation"
                  variant="ghost"
                  className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full px-4 py-2 text-sm font-bold transition-colors"
                />
                <LocalizedButtonLink
                  to="/auth/signup"
                  translationKey="links.actions.sign_up"
                  translationNamespace="navigation"
                  className="btn-brand-primary rounded-full px-4 py-2 text-sm font-bold"
                />
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-border/60 bg-background/95 supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur lg:hidden">
          <div className="container mx-auto space-y-4 px-4 py-4">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((item) => (
                <LocalizedNavLink
                  key={item.to}
                  to={item.to}
                  translationKey={item.translationKey}
                  translationNamespace="navigation"
                  className={cn(
                    "text-muted-foreground rounded-full px-4 py-2 text-base font-medium transition-colors",
                    isActivePath(item.to)
                      ? "bg-brand-red text-white shadow-sm"
                      : "hover:bg-brand-red/10 hover:text-brand-red",
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
            </nav>
            <div className="border-border/40 flex flex-col space-y-3 border-t pt-4">
              {user ? (
                <LocalizedButtonLink
                  to="/player"
                  ariaLabelTranslationKey="links.accessibility.link_aria_label.user_profile"
                  className="border-border/60 hover:border-brand-red/60 hover:bg-brand-red/10 flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Avatar
                    name={user.name}
                    email={user.email}
                    src={user.uploadedAvatarPath ?? user.image}
                    profileHref={null}
                    userId={user.id}
                    className="size-9"
                  />
                  <span>{user.name}</span>
                </LocalizedButtonLink>
              ) : (
                <>
                  <LocalizedButtonLink
                    to="/auth/login"
                    translationKey="links.actions.login"
                    translationNamespace="navigation"
                    variant="ghost"
                    className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full px-4 py-2 text-center text-sm font-bold transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <LocalizedButtonLink
                    to="/auth/signup"
                    translationKey="links.actions.sign_up"
                    translationNamespace="navigation"
                    className="btn-brand-primary w-full rounded-full px-4 py-2 text-sm font-bold"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
