import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-brand-light/95 sticky top-0 z-50 shadow-sm backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex h-16 items-center justify-between sm:h-20">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="maple-leaf-logo h-8 w-8 sm:h-10 sm:w-10"></div>
            <h1 className="text-brand-dark text-lg font-extrabold tracking-tight sm:text-xl">
              Quadball Canada
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 text-sm font-medium lg:flex lg:gap-8">
            <Link to="/" className="hover:text-brand-red transition">
              Events
            </Link>
            <Link to="/" className="hover:text-brand-red transition">
              Teams
            </Link>
            <Link to="/" className="hover:text-brand-red transition">
              Resources
            </Link>
            <Link to="/" className="hover:text-brand-red transition">
              About Us
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-bold transition hover:bg-gray-100"
            >
              Login
            </Link>
            <Link to="/signup">
              <Button className="btn-brand-primary rounded-lg px-4 py-2 text-sm font-bold">
                Register
              </Button>
            </Link>
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
              <Link
                to="/"
                className="hover:text-brand-red text-base font-medium text-gray-900 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Events
              </Link>
              <Link
                to="/"
                className="hover:text-brand-red text-base font-medium text-gray-900 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Teams
              </Link>
              <Link
                to="/"
                className="hover:text-brand-red text-base font-medium text-gray-900 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Resources
              </Link>
              <Link
                to="/"
                className="hover:text-brand-red text-base font-medium text-gray-900 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </Link>
            </nav>
            <div className="flex flex-col space-y-3 border-t border-gray-200 pt-4">
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-center text-sm font-bold transition hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button className="btn-brand-primary w-full rounded-lg px-4 py-2 text-sm font-bold">
                  Register
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
