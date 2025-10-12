import type { QueryClient, QueryFunction } from "@tanstack/react-query";

import { getUpcomingEvents } from "~/features/events/events.queries";
import type { EventWithDetails } from "~/features/events/events.types";

export const DEFAULT_UPCOMING_EVENTS_LIMIT = 10;

export const upcomingEventsQueryKey = (limit: number) =>
  ["upcoming-events", { limit }] as const;

type UpcomingEventsQueryKey = ReturnType<typeof upcomingEventsQueryKey>;

type UpcomingEventsQueryFn = QueryFunction<EventWithDetails[], UpcomingEventsQueryKey>;

export const createUpcomingEventsQueryFn = (
  limit: number = DEFAULT_UPCOMING_EVENTS_LIMIT,
): UpcomingEventsQueryFn => {
  const queryFn: UpcomingEventsQueryFn = () =>
    getUpcomingEvents({ data: { limit } }) as Promise<EventWithDetails[]>;
  return queryFn;
};

export const prefetchUpcomingEvents = async (
  queryClient: Pick<QueryClient, "prefetchQuery">,
  limit: number = DEFAULT_UPCOMING_EVENTS_LIMIT,
) => {
  try {
    await queryClient.prefetchQuery({
      queryKey: upcomingEventsQueryKey(limit),
      queryFn: createUpcomingEventsQueryFn(limit),
      staleTime: 1000 * 60,
    });
  } catch (error) {
    console.error("Failed to prefetch upcoming events", error);
  }
};
