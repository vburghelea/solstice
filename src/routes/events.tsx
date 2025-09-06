import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { EventListItem } from "~/features/events/components/EventListItem";
import { listEvents } from "~/features/events/events.queries";
import type { EventListResult } from "~/features/events/events.types";
import { PublicLayout } from "~/features/layouts/public-layout";
import { List } from "~/shared/ui/list";

export const Route = createFileRoute("/events")({
  component: PublicEventsPage,
});

function PublicEventsPage() {
  const { data } = useSuspenseQuery({
    queryKey: ["events", "public"],
    queryFn: async () =>
      listEvents({
        data: {
          filters: {
            publicOnly: true,
            status: ["published", "registration_open"],
            startDateFrom: new Date(),
          },
        },
      }),
  });

  const result = data as EventListResult;

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="font-heading mb-6 text-center text-4xl">Upcoming Events</h1>

        {result.events.length === 0 ? (
          <p className="text-muted-foreground text-center">No upcoming events.</p>
        ) : (
          <List>
            {result.events.map((event) => (
              <EventListItem
                key={event.id}
                event={event}
                cta={
                  <Link
                    to="/event/$eventId"
                    params={{ eventId: event.id }}
                    className="text-primary inline-flex shrink-0 items-center gap-1 text-sm font-medium hover:underline"
                  >
                    View
                  </Link>
                }
              />
            ))}
          </List>
        )}
      </div>
    </PublicLayout>
  );
}
