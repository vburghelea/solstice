import { Link, useRouteContext, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "~/shared/lib/utils";
import { Button } from "./button";
import { Logo } from "./logo";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const context = useRouteContext({ strict: false });
  const user = context?.user || null;
  const { location } = useRouterState();

  const navLinks = [
    { label: "Events", to: "/events" },
    { label: "Teams", to: "/teams" },
    { label: "Resources", to: "/resources" },
    { label: "About", to: "/about" },
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <header className="bg-brand-light/95 sticky top-0 z-50 shadow-sm backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex h-16 items-center justify-between sm:h-20">
          <div className="flex items-center gap-2 sm:gap-3">
            <Logo className="h-8 w-8 sm:h-10 sm:w-10" />
            <h1 className="text-brand-dark text-lg font-extrabold tracking-tight sm:text-xl">
              Quadball Canada
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 text-sm font-medium lg:flex lg:gap-8">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "hover:text-brand-red text-gray-700 transition",
                  isActivePath(item.to) && "text-brand-red font-semibold",
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
                  className="rounded-lg px-4 py-2 text-sm font-bold transition hover:bg-gray-100"
                >
                  Login
                </Link>
                <Link to="/auth/signup">
                  <Button className="btn-brand-primary rounded-lg px-4 py-2 text-sm font-bold">
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
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white lg:hidden">
          <div className="container mx-auto space-y-4 px-4 py-4">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "hover:text-brand-red text-base font-medium text-gray-900 transition",
                    isActivePath(item.to) && "text-brand-red font-semibold",
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col space-y-3 border-t border-gray-200 pt-4">
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
                    className="rounded-lg px-4 py-2 text-center text-sm font-bold transition hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link to="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="btn-brand-primary w-full rounded-lg px-4 py-2 text-sm font-bold">
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
