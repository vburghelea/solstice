import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";
import { EventList } from "~/features/events/components/event-list";
import { useEventsTranslation } from "~/hooks/useTypedTranslation";

export const Route = createFileRoute("/player/events/")({
  component: EventsPage,
});

function EventsPage() {
  const { user } = useRouteContext({ from: "__root__" });
  const { t } = useEventsTranslation();
  const { ready } = useTranslation("events");
  const isAuthenticated = Boolean(user);

  // Prevent hydration mismatch by waiting for translations to be ready
  if (!ready) {
    return (
      <div className="container mx-auto space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold sm:text-3xl">
              {t("listing.loading")}
            </h1>
            <p className="text-muted-foreground">{t("listing.loading_description")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold sm:text-3xl">
            {t("listing.title")}
          </h1>
          <p className="text-muted-foreground">{t("listing.subtitle")}</p>
        </div>
        {isAuthenticated ? (
          <Button asChild>
            <Link to="/player/events/create">
              <PlusIcon className="mr-2 h-4 w-4" />
              {t("listing.submit_event")}
            </Link>
          </Button>
        ) : null}
      </div>

      <EventList
        buildEventLink={(event) => ({
          to: "/player/events/$eventId",
          params: { eventId: event.id },
          from: "/player/events",
          label: t("listing.options.view_details"),
        })}
      />
    </div>
  );
}
