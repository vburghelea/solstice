import { useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import type { AuthUser } from "~/lib/auth/types";
import { Route as RootRoute } from "~/routes/__root";
import { cn } from "~/shared/lib/utils";
import { Button } from "./button";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = RootRoute.useRouteContext() as { user: AuthUser | null };
  const { location } = useRouterState();

  const navLinks = [
    { label: "Events", to: "/visit/events" },
    { label: "Find games", to: "/visit/search" },
    { label: "Game systems", to: "/visit/systems" },
    { label: "Teams", to: "/visit/teams" },
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <header className="border-border/60 bg-background/95 text-foreground supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 border-b shadow-sm transition-colors supports-[backdrop-filter]:backdrop-blur">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex h-16 items-center justify-between sm:h-20">
          <Link to="/visit" className="flex items-center gap-2 sm:gap-3">
            {" "}
            {/* Added Link wrapper */}
            <div
              className="roundup-star-logo h-8 w-8 sm:h-10 sm:w-10"
              aria-hidden="true"
            ></div>
            <h1 className="text-lg font-extrabold tracking-tight sm:text-xl">
              Roundup Games
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-4 text-sm font-semibold lg:flex lg:gap-6">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "text-muted-foreground rounded-full px-3 py-2 transition-colors",
                  isActivePath(item.to)
                    ? "bg-brand-red text-white shadow-sm"
                    : "hover:bg-brand-red/10 hover:text-brand-red",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <Link to="/dashboard">
                <Button className="btn-brand-primary rounded-lg px-4 py-2 text-sm font-bold">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full px-4 py-2 text-sm font-bold transition-colors"
                >
                  Login
                </Link>
                <Link to="/auth/signup">
                  <Button className="btn-brand-primary rounded-full px-4 py-2 text-sm font-bold">
                    Register
                  </Button>
                </Link>
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
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "text-muted-foreground rounded-full px-4 py-2 text-base font-medium transition-colors",
                    isActivePath(item.to)
                      ? "bg-brand-red text-white shadow-sm"
                      : "hover:bg-brand-red/10 hover:text-brand-red",
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-border/40 flex flex-col space-y-3 border-t pt-4">
              {user ? (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="btn-brand-primary w-full rounded-lg px-4 py-2 text-sm font-bold">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth/login"
                    className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full px-4 py-2 text-center text-sm font-bold transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link to="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="btn-brand-primary w-full rounded-full px-4 py-2 text-sm font-bold">
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
