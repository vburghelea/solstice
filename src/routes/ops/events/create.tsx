import { createFileRoute, redirect } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { LocalizedButtonLink } from "~/components/ui/LocalizedLink";
import { EventCreateForm } from "~/features/events/components/event-create-form";
import { useEventsTranslation } from "~/hooks/useTypedTranslation";

export const Route = createFileRoute("/ops/events/create")({
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
        <LocalizedButtonLink
          to="/ops/events"
          variant="ghost"
          size="sm"
          translationKey="navigation.back_to_events"
          translationNamespace="navigation"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          {t("admin.back_to_events")}
        </LocalizedButtonLink>
      </div>

      <EventCreateForm user={user} />
    </div>
  );
}
