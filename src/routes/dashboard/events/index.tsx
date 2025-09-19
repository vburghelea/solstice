import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { EventListItem } from "~/features/events/components/EventListItem";
import { listEvents } from "~/features/events/events.queries";
import type { EventListResult } from "~/features/events/events.types";
import { List } from "~/shared/ui/list";

export const Route = createFileRoute("/dashboard/events/")({
  component: EventsPage,
});

function EventsPage() {
  const { data } = useSuspenseQuery({
    queryKey: ["events", "dashboard"],
    queryFn: async () => listEvents({ data: { filters: { publicOnly: true } } }),
  });

  const result = data as EventListResult;

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-bold sm:text-3xl">Events</h1>
          <p className="text-muted-foreground">Browse and register for upcoming events</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/events/create">Create Event</Link>
        </Button>
      </div>

      {result.events.length === 0 ? (
        <p className="text-muted-foreground">No events found.</p>
      ) : (
        <List>
          {result.events.map((event) => (
            <EventListItem
              key={event.id}
              event={event}
              cta={
                <Button
                  size="sm"
                  disabled={!event.isRegistrationOpen || (event.availableSpots ?? 1) <= 0}
                >
                  {event.isRegistrationOpen ? "Register" : "View"}
                </Button>
              }
            />
          ))}
        </List>
      )}
    </div>
  );
}
