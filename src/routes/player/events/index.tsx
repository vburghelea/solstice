import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { EventList } from "~/features/events/components/event-list";

export const Route = createFileRoute("/player/events/")({
  component: EventsPage,
});

function EventsPage() {
  const { user } = useRouteContext({ from: "/player/events" });
  const isAuthenticated = Boolean(user);

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold sm:text-3xl">Events</h1>
          <p className="text-muted-foreground">Browse and register for upcoming events</p>
        </div>
        {isAuthenticated ? (
          <Button asChild>
            <Link to="/player/events/create">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        ) : null}
      </div>

      <EventList
        buildEventLink={(event) => ({
          to: "/player/events/$eventId",
          params: { eventId: event.id },
          from: "/player/events",
          label: "View Event",
        })}
      />
    </div>
  );
}
