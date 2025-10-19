import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { EventCreateForm } from "~/features/events/components/event-create-form";
import { useEventsTranslation } from "~/hooks/useTypedTranslation";

export const Route = createFileRoute("/player/events/create")({
  beforeLoad: async ({ context, location }) => {
    const { user } = context;
    if (!user) {
      throw redirect({
        to: "/auth/login",
        search: { redirect: location.pathname },
      });
    }
  },
  component: CreateEventPage,
});

function CreateEventPage() {
  const { user } = Route.useRouteContext();
  const { t } = useEventsTranslation();

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/player/events">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            {t("admin.back_to_events")}
          </Link>
        </Button>
      </div>

      <EventCreateForm user={user} />
    </div>
  );
}
