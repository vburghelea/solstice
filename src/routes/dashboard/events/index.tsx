import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { EventList } from "~/features/events/components/event-list";

export const Route = createFileRoute("/dashboard/events/")({
  component: EventsPage,
});

function EventsPage() {
  const { user } = useRouteContext({ from: "/dashboard/events" });

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Events</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Browse and manage Quadball events across Canada
          </p>
        </div>
        {user && (
          <Button asChild>
            <Link to="/dashboard/events/create">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        )}
      </div>

      <EventList />
    </div>
  );
}
