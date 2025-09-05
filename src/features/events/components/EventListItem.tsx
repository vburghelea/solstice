import { Calendar, Users } from "lucide-react";
import type { EventWithDetails } from "~/features/events/events.types";
import { List } from "~/shared/ui/list";

interface EventListItemProps {
  event: EventWithDetails;
  cta?: React.ReactNode;
}

export function EventListItem({ event, cta }: EventListItemProps) {
  const formattedDate = (event as unknown as { startDate?: string }).startDate
    ? new Date(event.startDate).toLocaleDateString()
    : "TBD";
  const feeCents =
    event.registrationType === "team"
      ? event.teamRegistrationFee
      : event.individualRegistrationFee;
  const price = feeCents ? `$${(feeCents / 100).toFixed(2)}` : "Free";
  const spots =
    typeof event.availableSpots === "number"
      ? `${event.availableSpots} spots left`
      : undefined;

  return (
    <List.Item className="group">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-gray-900">
            {event.name}
          </div>
          {event.description ? (
            <div className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">
              {event.description}
            </div>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {formattedDate}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {spots || "Capacity TBD"}
            </span>
            <span className="inline-flex items-center gap-1">{price}</span>
            <span
              className={event.isRegistrationOpen ? "text-emerald-700" : "text-amber-700"}
            >
              {event.isRegistrationOpen ? "Registration Open" : "Registration Closed"}
            </span>
          </div>
        </div>
        {cta ? cta : null}
      </div>
    </List.Item>
  );
}
