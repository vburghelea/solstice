import { LocalizedButtonLink } from "~/components/ui/LocalizedLink";
import { Button } from "~/components/ui/button";
import { ArrowLeftIcon, SearchIcon } from "~/components/ui/icons";
import { VisitorShell } from "~/features/layouts/visitor-shell";
import { useCommonTranslation } from "~/hooks/useTypedTranslation";
import { getCloudinaryAssetUrl } from "~/shared/lib/cloudinary-assets";

const NOT_FOUND_BACKGROUND = getCloudinaryAssetUrl("heroNotFound", {
  width: 1920,
  height: 1080,
  crop: "fill",
  gravity: "auto",
});

export function NotFound() {
  const { t } = useCommonTranslation();

  return (
    <VisitorShell>
      <section className="bg-background relative overflow-hidden py-24 sm:py-28 lg:py-32">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url('${NOT_FOUND_BACKGROUND}')` }}
        />
        <div className="relative z-10 container mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 text-center sm:px-8 lg:px-12">
          <p className="text-brand-red text-sm font-semibold tracking-[0.3em] uppercase">
            {t("not_found.title")}
          </p>
          <h1 className="text-foreground mt-4 text-4xl font-bold sm:text-5xl">
            {t("not_found.headline")}
          </h1>
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed sm:text-base">
            {t("not_found.description")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              onClick={() => window.history.back()}
              className="btn-brand-primary"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              {t("not_found.go_back")}
            </Button>
            <LocalizedButtonLink
              to="/"
              translationKey="links.errors.go_home"
              translationNamespace="navigation"
              variant="secondary"
            >
              <SearchIcon className="mr-2 h-4 w-4" />
              {t("not_found.visit_homepage")}
            </LocalizedButtonLink>
            <LocalizedButtonLink
              to="/events"
              translationKey="links.errors.browse_events"
              translationNamespace="navigation"
              variant="outline"
            />
          </div>
          <p className="text-muted-foreground mt-8 text-xs tracking-[0.3em] uppercase">
            {t("not_found.need_support")}{" "}
            <a className="underline" href="mailto:info@roundup.games">
              info@roundup.games
            </a>
          </p>
        </div>
      </section>
    </VisitorShell>
  );
}
