import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/events")({
  component: EventsPage,
});

function EventsPage() {
  return (
    <div className="container mx-auto space-y-8 p-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Events</h1>
      <p className="text-muted-foreground">Feature coming soon.</p>
    </div>
  );
}
