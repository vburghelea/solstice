import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarIcon, ClockIcon, MapPinIcon, TagIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/shared/lib/utils";
import { listEvents } from "../events.queries";
import type { EventFilters, EventListResult, EventWithDetails } from "../events.types";

type SortBy = "startDate" | "name" | "createdAt";
type SortOrder = "asc" | "desc";

interface EventListProps {
  showFilters?: boolean;
  initialFilters?: EventFilters;
  pageSize?: number;
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
  { label: "Start Date", value: "startDate" },
  { label: "Name", value: "name" },
  { label: "Recently Added", value: "createdAt" },
];

const SORT_ORDER_OPTIONS: { label: string; value: SortOrder }[] = [
  { label: "Ascending", value: "asc" },
  { label: "Descending", value: "desc" },
];

export function EventList({
  showFilters = true,
  initialFilters = DEFAULT_FILTERS,
  pageSize = 12,
}: EventListProps) {
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
    setFilters((prev) => {
      const next: EventFilters = { ...prev };
      if (value === undefined || (typeof value === "string" && value.length === 0)) {
        delete next[key];
      } else {
        next[key] = value as EventFilters[K];
      }
      return next;
    });
    setPage(1);
  };

  const typeFilterValue = typeof filters.type === "string" ? filters.type : "all";
  const statusFilterValue = typeof filters.status === "string" ? filters.status : "all";
  const provinceFilterValue = filters.province ?? "all";

  const filterSection = showFilters ? (
    <Card>
      <CardHeader>
        <CardTitle>Filter Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="type">Event Type</Label>
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
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="tournament">Tournament</SelectItem>
                <SelectItem value="league">League</SelectItem>
                <SelectItem value="camp">Camp</SelectItem>
                <SelectItem value="clinic">Clinic</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
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
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="registration_open">Registration Open</SelectItem>
                <SelectItem value="registration_closed">Registration Closed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="Filter by city"
              value={filters.city ?? ""}
              onChange={(event) =>
                handleFilterChange("city", event.target.value || undefined)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="province">Province</Label>
            <Select
              value={provinceFilterValue}
              onValueChange={(value) =>
                handleFilterChange(
                  "province",
                  value === "all" ? undefined : (value as EventFilters["province"]),
                )
              }
            >
              <SelectTrigger id="province">
                <SelectValue placeholder="All provinces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All provinces</SelectItem>
                <SelectItem value="AB">Alberta</SelectItem>
                <SelectItem value="BC">British Columbia</SelectItem>
                <SelectItem value="MB">Manitoba</SelectItem>
                <SelectItem value="NB">New Brunswick</SelectItem>
                <SelectItem value="NL">Newfoundland and Labrador</SelectItem>
                <SelectItem value="NS">Nova Scotia</SelectItem>
                <SelectItem value="ON">Ontario</SelectItem>
                <SelectItem value="PE">Prince Edward Island</SelectItem>
                <SelectItem value="QC">Quebec</SelectItem>
                <SelectItem value="SK">Saskatchewan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortBy">Sort By</Label>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
              <SelectTrigger id="sortBy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort Order</Label>
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
                    {option.label}
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
        Error loading events: {error.message}
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
          <p className="text-muted-foreground">No events found matching your criteria.</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {data && data.pageInfo.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground text-sm">
                Showing {(page - 1) * pageSize + 1}-
                {Math.min(page * pageSize, data.totalCount)} of {data.totalCount} events
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={!data.pageInfo.hasPreviousPage}
                >
                  Previous
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
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EventCard({ event }: { event: EventWithDetails }) {
  const typeIcon = getTypeIcon(event.type);
  const badgeAppearance = getStatusBadgeAppearance(event.status);

  return (
    <Card className="group transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link
              to="/dashboard/events/$slug"
              params={{ slug: event.slug }}
              className="group-hover:underline"
            >
              <CardTitle className="line-clamp-2">
                <span className="mr-2">{typeIcon}</span>
                {event.name}
              </CardTitle>
            </Link>
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
                {event.province && `, ${event.province}`}
              </span>
            </div>
          ) : null}

          {event.isRegistrationOpen ? (
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-emerald-600">Registration Open</span>
              {event.availableSpots !== undefined ? (
                <span className="text-muted-foreground">
                  ({event.availableSpots} spots left)
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <UsersIcon className="text-muted-foreground h-4 w-4" />
            <span>{event.registrationCount} registered</span>
          </div>

          <div className="flex items-center gap-2">
            <TagIcon className="text-muted-foreground h-4 w-4" />
            <span className="capitalize">{event.registrationType} registration</span>
          </div>
        </div>

        <div className="pt-2">
          <Button asChild className="w-full" size="sm">
            <Link to="/dashboard/events/$slug" params={{ slug: event.slug }}>
              View Details
            </Link>
          </Button>
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
    case "cancelled":
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
