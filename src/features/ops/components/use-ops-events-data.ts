import { addDays, differenceInCalendarDays, isWithinInterval } from "date-fns";
import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { listEvents } from "~/features/events/events.queries";
import type {
  EventListResult,
  EventStatus,
  EventWithDetails,
} from "~/features/events/events.types";

const PIPELINE_STATUSES: EventStatus[] = ["registration_open", "published", "completed"];

const CAPACITY_THRESHOLD = 5;

export interface OpsSnapshot {
  approvals: number;
  registrationOpen: number;
  confirmedEvents: number;
  upcomingWeek: number;
  capacityAlerts: number;
}

export interface OpsAttentionItem {
  id: string;
  name: string;
  severity: "critical" | "warning" | "info";
  message: string;
  startDate: Date;
  availableSpots: number | null;
  city: string | null;
}

export type MarketingHotspot = [string, { total: number; upcoming: number }];

interface OpsEventsData {
  pendingList: EventWithDetails[];
  pipelineList: EventWithDetails[];
  recentlyReviewed: EventWithDetails[];
  snapshot: OpsSnapshot;
  attentionItems: OpsAttentionItem[];
  marketingBreakdown: MarketingHotspot[];
  liveEvents: EventWithDetails[];
  isLoading: boolean;
  isRefreshing: boolean;
}

export function useOpsEventsData(): OpsEventsData {
  const {
    data: pendingEvents,
    isLoading: pendingLoading,
    isFetching: pendingFetching,
  } = useQuery<EventListResult, Error>({
    queryKey: ["ops", "events", "pending"],
    queryFn: () =>
      listEvents({
        data: {
          filters: {
            status: "draft",
            publicOnly: false,
          },
          pageSize: 50,
          sortBy: "createdAt",
          sortOrder: "asc",
        },
      }),
  });

  const {
    data: pipelineEvents,
    isLoading: pipelineLoading,
    isFetching: pipelineFetching,
  } = useQuery<EventListResult, Error>({
    queryKey: ["ops", "events", "pipeline"],
    queryFn: () =>
      listEvents({
        data: {
          filters: {
            status: PIPELINE_STATUSES,
            publicOnly: false,
          },
          pageSize: 75,
          sortBy: "startDate",
          sortOrder: "asc",
        },
      }),
  });

  const {
    data: reviewedEvents,
    isLoading: reviewedLoading,
    isFetching: reviewedFetching,
  } = useQuery<EventListResult, Error>({
    queryKey: ["ops", "events", "recent"],
    queryFn: () =>
      listEvents({
        data: {
          filters: {
            status: ["published", "registration_open"],
            publicOnly: false,
          },
          pageSize: 30,
          sortBy: "updatedAt",
          sortOrder: "desc",
        },
      }),
  });

  const pendingList = useMemo(
    () => pendingEvents?.events.filter((event) => !event.isPublic) ?? [],
    [pendingEvents],
  );

  const pipelineList = useMemo(() => pipelineEvents?.events ?? [], [pipelineEvents]);

  const recentlyReviewed = useMemo(() => reviewedEvents?.events ?? [], [reviewedEvents]);

  const snapshot = useMemo<OpsSnapshot>(() => {
    const now = new Date();
    const registrationOpen = pipelineList.filter(
      (event) => event.status === "registration_open",
    ).length;
    const confirmedEvents = pipelineList.filter(
      (event) => event.status === "published",
    ).length;
    const upcomingWeek = pipelineList.filter((event) => {
      const start = new Date(event.startDate);
      const diff = differenceInCalendarDays(start, now);
      return diff >= 0 && diff <= 7;
    }).length;
    const capacityAlerts = pipelineList.filter((event) => {
      if (typeof event.availableSpots !== "number") {
        return false;
      }
      return event.availableSpots <= CAPACITY_THRESHOLD;
    }).length;

    return {
      approvals: pendingList.length,
      registrationOpen,
      confirmedEvents,
      upcomingWeek,
      capacityAlerts,
    };
  }, [pendingList, pipelineList]);

  const attentionItems = useMemo<OpsAttentionItem[]>(() => {
    const now = new Date();
    return pipelineList
      .map((event) => {
        const startDate = new Date(event.startDate);
        const daysUntilStart = differenceInCalendarDays(startDate, now);
        const availableSpots = event.availableSpots ?? null;
        const lowCapacity =
          typeof availableSpots === "number" && availableSpots <= CAPACITY_THRESHOLD;
        const severity: OpsAttentionItem["severity"] =
          daysUntilStart <= 2 || lowCapacity
            ? "critical"
            : daysUntilStart <= 7
              ? "warning"
              : "info";
        const message =
          severity === "critical"
            ? "Confirm staffing, safety briefings, and arrival logistics"
            : severity === "warning"
              ? "Schedule marketing boost and finalize vendor confirmations"
              : "Review run-of-show document and volunteer assignments";

        return {
          id: event.id,
          name: event.name,
          severity,
          message,
          startDate,
          availableSpots,
          city: event.city ?? null,
        } satisfies OpsAttentionItem;
      })
      .filter((item) => item.severity !== "info")
      .slice(0, 4);
  }, [pipelineList]);

  const marketingBreakdown = useMemo<MarketingHotspot[]>(() => {
    const now = new Date();
    const grouped = new Map<string, { total: number; upcoming: number }>();

    pipelineList.forEach((event) => {
      const key = event.city
        ? `${event.city}${event.country ? `, ${event.country}` : ""}`
        : "Unlisted";
      const entry = grouped.get(key) ?? { total: 0, upcoming: 0 };
      entry.total += 1;
      if (
        isWithinInterval(new Date(event.startDate), {
          start: now,
          end: addDays(now, 30),
        })
      ) {
        entry.upcoming += 1;
      }
      grouped.set(key, entry);
    });

    return Array.from(grouped.entries())
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 5);
  }, [pipelineList]);

  const liveEvents = useMemo(() => pipelineList.slice(0, 10), [pipelineList]);

  return {
    pendingList,
    pipelineList,
    recentlyReviewed,
    snapshot,
    attentionItems,
    marketingBreakdown,
    liveEvents,
    isLoading: pendingLoading || pipelineLoading || reviewedLoading,
    isRefreshing: pendingFetching || pipelineFetching || reviewedFetching,
  };
}

export const opsCapacityThreshold = CAPACITY_THRESHOLD;
