import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="bg-brand-dark text-brand-light">
      <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="maple-leaf-logo h-8 w-8 sm:h-10 sm:w-10"></div>
              <h2 className="text-base font-bold sm:text-lg">Quadball Canada</h2>
            </div>
            <p className="mt-3 text-sm text-gray-400 sm:mt-4">
              Promoting and developing the sport of Quadball across Canada.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider text-gray-300 uppercase sm:text-base">
              Quick Links
            </h3>
            <nav className="mt-3 space-y-2 text-sm sm:mt-4">
              <Link
                className="block text-gray-400 transition hover:text-white"
                to="/events"
              >
                Events
              </Link>
              <Link
                className="block text-gray-400 transition hover:text-white"
                to="/teams"
              >
                Teams
              </Link>
              <Link
                className="block text-gray-400 transition hover:text-white"
                to="/resources"
              >
                Resources
              </Link>
              <Link
                className="block text-gray-400 transition hover:text-white"
                to="/about"
              >
                About Quadball Canada
              </Link>
              <a
                className="block text-gray-400 transition hover:text-white"
                href="mailto:info@quadball.ca"
              >
                Contact Us
              </a>
            </nav>
          </div>
          <div className="sm:text-right lg:text-left">
            <h3 className="text-sm font-bold tracking-wider text-gray-300 uppercase sm:text-base">
              Follow Us
            </h3>
            <div className="mt-3 flex space-x-4 sm:mt-4 sm:justify-end lg:justify-start">
              <a className="text-gray-400 transition hover:text-white" href="#">
                <Twitter className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
              <a className="text-gray-400 transition hover:text-white" href="#">
                <Facebook className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
              <a className="text-gray-400 transition hover:text-white" href="#">
                <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-6 text-center text-xs text-gray-400 sm:mt-12 sm:pt-8 sm:text-sm">
          <p>© 2024 Quadball Canada. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
