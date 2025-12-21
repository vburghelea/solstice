import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { ArrowLeftIcon, SearchIcon } from "~/components/ui/icons";

export function NotFound() {
  return (
    <div className="from-brand-dark to-brand-red/40 relative flex min-h-screen items-center justify-center bg-gradient-to-br via-[#2b1a1a] px-6 py-24 text-white">
      <div className="relative z-10 w-full max-w-2xl text-center">
        <p className="text-brand-red/80 text-sm font-semibold tracking-[0.3em] uppercase">
          404 — page not found
        </p>
        <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
          Looks like this play is out of bounds
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-gray-200 sm:text-base">
          The page you’re after may have been renamed, archived, or never made the roster.
          Use the options below to jump back into the action or drop us a note so we can
          help you track it down.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button
            type="button"
            onClick={() => window.history.back()}
            className="btn-brand-primary"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Go back
          </Button>
          <Button
            asChild
            variant="secondary"
            className="bg-white/10 text-white hover:bg-white/20"
          >
            <Link to="/">
              <SearchIcon className="mr-2 h-4 w-4" />
              Visit the homepage
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white/40 text-white hover:bg-white/10"
          >
            <Link to="/">Visit the portal</Link>
          </Button>
        </div>
        <p className="mt-8 text-xs tracking-[0.3em] text-gray-300 uppercase">
          Need support? Email{" "}
          <a className="underline" href="mailto:info@quadball.ca">
            info@quadball.ca
          </a>
        </p>
      </div>
      <div
        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1600&q=80')] opacity-15"
        aria-hidden="true"
      />
    </div>
  );
}
