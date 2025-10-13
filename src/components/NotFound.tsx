import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Button } from "~/components/ui/button";
import { ArrowLeftIcon, SearchIcon } from "~/components/ui/icons";
import { PublicLayout } from "~/features/layouts/public-layout";
import { getCloudinaryAssetUrl } from "~/shared/lib/cloudinary-assets";

const NOT_FOUND_BACKGROUND = getCloudinaryAssetUrl("heroNotFound", {
  width: 1920,
  height: 1080,
  crop: "fill",
  gravity: "auto",
});

export function NotFound() {
  return (
    <PublicLayout>
      <section className="bg-background relative overflow-hidden py-24 sm:py-28 lg:py-32">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url('${NOT_FOUND_BACKGROUND}')` }}
        />
        <div className="relative z-10 container mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 text-center sm:px-8 lg:px-12">
          <p className="text-brand-red text-sm font-semibold tracking-[0.3em] uppercase">
            404 — page not found
          </p>
          <h1 className="text-foreground mt-4 text-4xl font-bold sm:text-5xl">
            Looks like this play is out of bounds
          </h1>
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed sm:text-base">
            The page you’re after may have been renamed, archived, or never made the
            roster. Use the options below to jump back into the action or drop us a note
            so we can help you track it down.
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
            <Button asChild variant="secondary">
              <Link to="/">
                <SearchIcon className="mr-2 h-4 w-4" />
                Visit the homepage
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/events">Browse events</Link>
            </Button>
          </div>
          <p className="text-muted-foreground mt-8 text-xs tracking-[0.3em] uppercase">
            Need support? Email{" "}
            <a className="underline" href="mailto:info@roundup.games">
              info@roundup.games
            </a>
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
