import { format, parseISO } from "date-fns";
import { CalendarIcon, MapPinIcon } from "~/components/ui/icons";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import type { EventWithDetails } from "~/features/events/events.types";

const FALLBACK_IMAGE = "/images/hero-tabletop-board-game-tournament-cards-optimized.png";

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
  const eventTitle = event?.name || title || "Upcoming Roundup Games Event";
  const eventDescription =
    event?.shortDescription ||
    description ||
    (event?.description
      ? truncate(event.description, 140)
      : "Stay tuned for more event details.");
  const to = link ?? (event ? `/visit/events/${event.slug}` : "/visit/events");
  const startDate = event?.startDate
    ? format(parseISO(event.startDate), "MMM d, yyyy")
    : null;
  const endDate = event?.endDate ? format(parseISO(event.endDate), "MMM d, yyyy") : null;
  const dateLabel = startDate
    ? endDate && endDate !== startDate
      ? `${startDate} - ${endDate}`
      : startDate
    : undefined;
  const locationLabel = [event?.city, event?.country].filter(Boolean).join(", ");
  const spotsRemaining =
    typeof event?.availableSpots === "number" && event.availableSpots >= 0
      ? `${event.availableSpots} spots left`
      : undefined;

  return (
    <Link to={to} className="group block h-full">
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[color:color-mix(in_oklab,var(--primary-soft)_32%,transparent)] bg-[color:color-mix(in_oklab,var(--primary-soft)_12%,white)]/90 shadow-sm transition-all duration-300 hover:border-[color:color-mix(in_oklab,var(--primary-soft)_52%,transparent)] hover:shadow-lg">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <img
            alt={eventTitle}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            src={coverImage}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
          {event?.isFeatured ? (
            <span className="bg-primary-strong/90 absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase shadow-md">
              Featured
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-4 p-5">
          <header className="token-stack-2xs">
            <h3 className="text-heading-xs text-foreground">{eventTitle}</h3>
            {eventDescription ? (
              <p className="text-body-sm text-muted-strong">{eventDescription}</p>
            ) : null}
          </header>
          <div className="token-stack-2xs text-body-xs text-muted-strong mt-auto">
            {dateLabel ? (
              <div className="text-body-sm flex items-center gap-2">
                <CalendarIcon className="text-primary-soft h-4 w-4" />
                <span>{dateLabel}</span>
              </div>
            ) : null}
            {locationLabel ? (
              <div className="text-body-sm flex items-center gap-2">
                <MapPinIcon className="text-primary-soft h-4 w-4" />
                <span>{locationLabel}</span>
              </div>
            ) : null}
            {spotsRemaining ? (
              <div className="text-primary-strong text-[0.7rem] font-semibold tracking-[0.12em] uppercase">
                {spotsRemaining}
              </div>
            ) : null}
          </div>
        </div>
      </article>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-[color:color-mix(in_oklab,var(--primary-soft)_32%,transparent)] bg-[color:color-mix(in_oklab,var(--primary-soft)_10%,white)]/90 shadow-sm">
      <div className="aspect-[4/3] w-full bg-[color:color-mix(in_oklab,var(--primary-soft)_20%,white)]" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-3/4 rounded bg-[color:color-mix(in_oklab,var(--primary-soft)_18%,white)]" />
        <div className="h-3 w-full rounded bg-[color:color-mix(in_oklab,var(--primary-soft)_18%,white)]" />
        <div className="h-3 w-2/3 rounded bg-[color:color-mix(in_oklab,var(--primary-soft)_18%,white)]" />
        <div className="mt-4 h-3 w-1/2 rounded bg-[color:color-mix(in_oklab,var(--primary-soft)_18%,white)]" />
        <div className="h-3 w-1/3 rounded bg-[color:color-mix(in_oklab,var(--primary-soft)_18%,white)]" />
      </div>
    </div>
  );
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}
