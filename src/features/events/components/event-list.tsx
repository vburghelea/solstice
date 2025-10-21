import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, ClockIcon, MapPinIcon, TagIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { LocalizedButtonLink, LocalizedLink } from "~/components/ui/LocalizedLink";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { applyEventFilterChange } from "~/features/events/utils";
import { useEventsTranslation } from "~/hooks/useTypedTranslation";
import { COUNTRIES } from "~/shared/hooks/useCountries";
import { cn } from "~/shared/lib/utils";
import { listEvents } from "../events.queries";
import type { EventFilters, EventListResult, EventWithDetails } from "../events.types";

type SortBy = "startDate" | "name" | "createdAt";
type SortOrder = "asc" | "desc";

type LinkPrimitive = string | number | boolean;

type LinkConfig = {
  readonly to: string;
  readonly params?: Record<string, LinkPrimitive>;
  readonly search?: Record<string, LinkPrimitive>;
  readonly from?: string;
  readonly label?: string;
  readonly translationKey?: string;
  readonly translationNamespace?: string;
};

interface EventListProps {
  readonly showFilters?: boolean;
  readonly initialFilters?: EventFilters;
  readonly pageSize?: number;
  readonly buildEventLink?: (event: EventWithDetails) => LinkConfig | undefined;
  readonly actionLabel?: string;
}

const DEFAULT_FILTERS: EventFilters = {};
const SKELETON_CARD_KEYS = [
  "skeleton-0",
  "skeleton-1",
  "skeleton-2",
  "skeleton-3",
  "skeleton-4",
  "skeleton-5",
];

const SORT_OPTIONS: { label: string; value: SortBy }[] = [
  { label: "start_date", value: "startDate" },
  { label: "name", value: "name" },
  { label: "recently_added", value: "createdAt" },
];

const SORT_ORDER_OPTIONS: { label: string; value: SortOrder }[] = [
  { label: "ascending", value: "asc" },
  { label: "descending", value: "desc" },
];

export function EventList({
  showFilters = true,
  initialFilters = DEFAULT_FILTERS,
  pageSize = 12,
  buildEventLink,
  actionLabel,
}: EventListProps) {
  const { t } = useEventsTranslation();
  const [filters, setFilters] = useState<EventFilters>(() => ({ ...initialFilters }));
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>("startDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const { data, isLoading, error } = useQuery<EventListResult, Error>({
    queryKey: ["events", filters, page, pageSize, sortBy, sortOrder],
    queryFn: () =>
      listEvents({
        data: {
          filters,
          page,
          pageSize,
          sortBy,
          sortOrder,
        },
      }),
  });

  const handleFilterChange = <K extends keyof EventFilters>(
    key: K,
    value: EventFilters[K] | undefined,
  ) => {
    let didChange = false;
    setFilters((prev) => {
      const { nextFilters, changed } = applyEventFilterChange(prev, key, value);
      if (changed) {
        didChange = true;
        return nextFilters;
      }
      return prev;
    });
    if (didChange) {
      setPage(1);
    }
  };

  const typeFilterValue = typeof filters.type === "string" ? filters.type : "all";
  const statusFilterValue = typeof filters.status === "string" ? filters.status : "all";
  const countryFilterValue = filters.country ?? "all";

  const filterSection = showFilters ? (
    <Card>
      <CardHeader>
        <CardTitle>{t("list.filter_title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="type">{t("list.labels.event_type")}</Label>
            <Select
              value={typeFilterValue}
              onValueChange={(value) =>
                handleFilterChange(
                  "type",
                  value === "all" ? undefined : (value as EventFilters["type"]),
                )
              }
            >
              <SelectTrigger id="type">
                <SelectValue placeholder={t("list.placeholders.all_types")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("list.placeholders.all_types")}</SelectItem>
                <SelectItem value="tournament">{t("list.options.tournament")}</SelectItem>
                <SelectItem value="league">{t("list.options.league")}</SelectItem>
                <SelectItem value="camp">{t("list.options.camp")}</SelectItem>
                <SelectItem value="clinic">{t("list.options.clinic")}</SelectItem>
                <SelectItem value="social">{t("list.options.social")}</SelectItem>
                <SelectItem value="other">{t("list.options.other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t("list.labels.status")}</Label>
            <Select
              value={statusFilterValue}
              onValueChange={(value) =>
                handleFilterChange(
                  "status",
                  value === "all" ? undefined : (value as EventFilters["status"]),
                )
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder={t("list.placeholders.all_statuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("list.placeholders.all_statuses")}</SelectItem>
                <SelectItem value="published">{t("list.options.published")}</SelectItem>
                <SelectItem value="registration_open">
                  {t("list.options.registration_open")}
                </SelectItem>
                <SelectItem value="registration_closed">
                  {t("list.options.registration_closed")}
                </SelectItem>
                <SelectItem value="in_progress">
                  {t("list.options.in_progress")}
                </SelectItem>
                <SelectItem value="completed">{t("list.options.completed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">{t("list.labels.city")}</Label>
            <Input
              id="city"
              placeholder={t("list.placeholders.filter_by_city")}
              value={filters.city ?? ""}
              onChange={(event) =>
                handleFilterChange("city", event.target.value || undefined)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">{t("list.labels.country")}</Label>
            <Select
              value={countryFilterValue}
              onValueChange={(value) =>
                handleFilterChange(
                  "country",
                  value === "all" ? undefined : (value as EventFilters["country"]),
                )
              }
            >
              <SelectTrigger id="country">
                <SelectValue placeholder={t("list.placeholders.all_countries")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("list.placeholders.all_countries")}
                </SelectItem>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortBy">{t("list.labels.sort_by")}</Label>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
              <SelectTrigger id="sortBy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(`list.options.${option.label}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">{t("list.labels.sort_order")}</Label>
            <Select
              value={sortOrder}
              onValueChange={(value) => setSortOrder(value as SortOrder)}
            >
              <SelectTrigger id="sortOrder">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_ORDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(`list.options.${option.label}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  ) : null;

  if (error) {
    return (
      <div className="text-destructive text-center">
        {t("errors.load_failed", { message: error.message })}
      </div>
    );
  }

  const events = data?.events ?? [];
  const hasNoEvents = !isLoading && events.length === 0;

  return (
    <div className="space-y-6">
      {filterSection}

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SKELETON_CARD_KEYS.map((key) => (
            <Card key={key}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hasNoEvents ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">{t("list.empty_state")}</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                buildEventLink={buildEventLink}
                fallbackActionLabel={actionLabel}
                t={t}
              />
            ))}
          </div>

          {data && data.pageInfo.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground text-sm">
                {t("list.pagination.showing", {
                  start: (page - 1) * pageSize + 1,
                  end: Math.min(page * pageSize, data.totalCount),
                  total: data.totalCount,
                })}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={!data.pageInfo.hasPreviousPage}
                >
                  {t("list.pagination.previous")}
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, data.pageInfo.totalPages) },
                    (_, index) => {
                      const pageNumber = index + 1;
                      return (
                        <Button
                          key={`page-${pageNumber}`}
                          variant={pageNumber === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </Button>
                      );
                    },
                  )}
                  {data.pageInfo.totalPages > 5 && (
                    <span className="text-muted-foreground px-2">...</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={!data.pageInfo.hasNextPage}
                >
                  {t("list.pagination.next")}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EventCard({
  event,
  buildEventLink,
  fallbackActionLabel,
  t,
}: {
  readonly event: EventWithDetails;
  readonly buildEventLink?: EventListProps["buildEventLink"];
  readonly fallbackActionLabel?: EventListProps["actionLabel"];
  readonly t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const typeIcon = getTypeIcon(event.type);
  const badgeAppearance = getStatusBadgeAppearance(event.status);
  const builderLink = buildEventLink?.(event);
  const linkLabel =
    builderLink?.label ?? fallbackActionLabel ?? t("list.actions.view_details");
  const resolvedLink: LinkConfig = {
    to: builderLink?.to ?? "/events/$slug",
    params: builderLink?.params ?? { slug: event.slug },
    label: linkLabel,
    translationKey:
      builderLink?.translationKey ?? "links.event_management.view_event_details",
    translationNamespace: builderLink?.translationNamespace ?? "navigation",
    ...(builderLink?.search
      ? {
          search: Object.fromEntries(
            Object.entries(builderLink.search).filter(([, value]) => value !== undefined),
          ) as Record<string, LinkPrimitive>,
        }
      : {}),
    ...(builderLink?.from ? { from: builderLink.from } : {}),
  };

  return (
    <Card className="group transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <LocalizedLink
              to={resolvedLink.to}
              params={resolvedLink.params}
              search={resolvedLink.search}
              translationKey={resolvedLink.translationKey}
              translationNamespace={resolvedLink.translationNamespace}
              fallbackText={linkLabel}
              className="group-hover:underline"
            >
              <CardTitle className="line-clamp-2">
                <span className="mr-2">{typeIcon}</span>
                {event.name}
              </CardTitle>
            </LocalizedLink>
          </div>
          <Badge
            variant={badgeAppearance.variant}
            className={cn("ml-2 capitalize", badgeAppearance.className)}
          >
            {event.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground line-clamp-3 text-sm">
          {event.shortDescription || event.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-muted-foreground h-4 w-4" />
            <span>
              {format(new Date(event.startDate), "MMM d")}
              {event.endDate !== event.startDate &&
                ` - ${format(new Date(event.endDate), "MMM d, yyyy")}`}
            </span>
          </div>

          {event.city ? (
            <div className="flex items-center gap-2">
              <MapPinIcon className="text-muted-foreground h-4 w-4" />
              <span>
                {event.city}
                {event.country && `, ${event.country}`}
              </span>
            </div>
          ) : null}

          {event.isRegistrationOpen ? (
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-emerald-600">
                {t("list.registration.open")}
              </span>
              {event.availableSpots !== undefined ? (
                <span className="text-muted-foreground">
                  {t("list.registration.spots_left", { count: event.availableSpots })}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <UsersIcon className="text-muted-foreground h-4 w-4" />
            <span>
              {t("list.registration.registered", { count: event.registrationCount })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <TagIcon className="text-muted-foreground h-4 w-4" />
            <span className="capitalize">
              {t("list.registration.type_label", { type: event.registrationType })}
            </span>
          </div>
        </div>

        <div className="pt-2">
          <LocalizedButtonLink
            to={resolvedLink.to}
            params={resolvedLink.params}
            search={resolvedLink.search}
            translationKey={resolvedLink.translationKey}
            translationNamespace={resolvedLink.translationNamespace}
            fallbackText={linkLabel}
            className="w-full"
            size="sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBadgeAppearance(status: EventWithDetails["status"]): {
  variant: "default" | "secondary" | "destructive" | "outline";
  className?: string;
} {
  switch (status) {
    case "draft":
      return { variant: "secondary" };
    case "published":
      return { variant: "default" };
    case "registration_open":
      return {
        variant: "outline",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "registration_closed":
      return {
        variant: "outline",
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
    case "in_progress":
      return {
        variant: "outline",
        className: "border-sky-200 bg-sky-50 text-sky-700",
      };
    case "completed":
      return { variant: "default" };
    case "canceled":
      return { variant: "destructive" };
    default:
      return { variant: "default" };
  }
}

function getTypeIcon(type: EventWithDetails["type"]): string {
  const icons: Record<EventWithDetails["type"], string> = {
    tournament: "🏆",
    league: "📅",
    camp: "🏕️",
    clinic: "🎓",
    social: "🎉",
    other: "📍",
  };

  return icons[type] ?? "📍";
}
