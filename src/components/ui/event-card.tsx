import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { CalendarIcon, MapPinIcon } from "~/components/ui/icons";
import type { EventWithDetails } from "~/features/events/events.types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80";

interface EventCardProps {
  event?: EventWithDetails;
  title?: string;
  description?: string;
  image?: string | null;
  link?: string;
  isLoading?: boolean;
}

export function EventCard({
  event,
  title,
  description,
  image,
  link,
  isLoading,
}: EventCardProps) {
  if (isLoading) {
    return <EventCardSkeleton />;
  }

  const coverImage = event?.bannerUrl || image || FALLBACK_IMAGE;
  const eventTitle = event?.name || title || "Upcoming Quadball Event";
  const eventDescription =
    event?.shortDescription ||
    description ||
    (event?.description
      ? truncate(event.description, 140)
      : "Stay tuned for more event details.");
  const to = link ?? (event ? `/events/${event.slug}` : "/events");
  const startDate = event?.startDate
    ? format(parseISO(event.startDate), "MMM d, yyyy")
    : null;
  const endDate = event?.endDate ? format(parseISO(event.endDate), "MMM d, yyyy") : null;
  const dateLabel = startDate
    ? endDate && endDate !== startDate
      ? `${startDate} - ${endDate}`
      : startDate
    : undefined;
  const locationLabel = [event?.city, event?.province].filter(Boolean).join(", ");
  const spotsRemaining =
    typeof event?.availableSpots === "number" && event.availableSpots >= 0
      ? `${event.availableSpots} spots left`
      : undefined;

  return (
    <Link to={to} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-lg transition-shadow duration-300 hover:shadow-2xl">
        <div className="relative h-56 w-full overflow-hidden">
          <img
            alt={eventTitle}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            src={coverImage}
            loading="lazy"
          />
          {event?.isFeatured && (
            <span className="bg-brand-red/95 absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase shadow-md">
              Featured
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <header className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">{eventTitle}</h3>
            {eventDescription && (
              <p className="text-sm text-gray-600">{eventDescription}</p>
            )}
          </header>
          <div className="mt-auto space-y-2 text-sm text-gray-600">
            {dateLabel && (
              <div className="flex items-center gap-2">
                <CalendarIcon className="text-brand-red h-4 w-4" />
                <span>{dateLabel}</span>
              </div>
            )}
            {locationLabel && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="text-brand-red h-4 w-4" />
                <span>{locationLabel}</span>
              </div>
            )}
            {spotsRemaining && (
              <div className="text-brand-red text-xs font-semibold tracking-wider uppercase">
                {spotsRemaining}
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl bg-white shadow-lg">
      <div className="h-56 w-full bg-gray-200" />
      <div className="space-y-3 p-6">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-2/3 rounded bg-gray-200" />
        <div className="mt-4 h-3 w-1/2 rounded bg-gray-200" />
        <div className="h-3 w-1/3 rounded bg-gray-200" />
      </div>
    </div>
  );
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}
