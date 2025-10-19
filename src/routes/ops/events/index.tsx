import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { EventList } from "~/features/events/components/event-list";
import { useEventsTranslation } from "~/hooks/useTypedTranslation";

export const Route = createFileRoute("/ops/events/")({
  component: EventsPage,
});

function EventsPage() {
  const { user } = useRouteContext({ from: "/ops/events" });
  const { t } = useEventsTranslation();
  const isAuthenticated = Boolean(user);

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold sm:text-3xl">
            {t("admin.title")}
          </h1>
          <p className="text-muted-foreground">{t("admin.subtitle")}</p>
        </div>
        {isAuthenticated ? (
          <Button asChild>
            <Link to="/ops/events/create">
              <PlusIcon className="mr-2 h-4 w-4" />
              {t("admin.create_event")}
            </Link>
          </Button>
        ) : null}
      </div>

      <EventList
        buildEventLink={(event) => ({
          to: "/ops/events/$eventId",
          params: { eventId: event.id },
          from: "/ops/events",
          label: t("admin.view_event"),
        })}
      />
    </div>
  );
}
