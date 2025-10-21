import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LocalizedButtonLink } from "~/components/ui/LocalizedLink";
import { EventList } from "~/features/events/components/event-list";
import { useEventsTranslation } from "~/hooks/useTypedTranslation";

export const Route = createFileRoute("/ops/events/")({
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
            <h1 className="text-foreground text-2xl font-bold sm:text-3xl">Loading...</h1>
            <p className="text-muted-foreground">Please wait while we load the events.</p>
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
            {t("admin.title")}
          </h1>
          <p className="text-muted-foreground">{t("admin.subtitle")}</p>
        </div>
        {isAuthenticated ? (
          <LocalizedButtonLink
            to="/ops/events/create"
            translationKey="links.event_management.create_ops_event"
            translationNamespace="navigation"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            {t("admin.create_event")}
          </LocalizedButtonLink>
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
