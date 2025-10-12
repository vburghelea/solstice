import type { QueryClient, QueryFunctionContext } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("~/features/events/events.queries", () => ({
  getUpcomingEvents: vi.fn(),
}));

import { getUpcomingEvents } from "~/features/events/events.queries";
import {
  DEFAULT_UPCOMING_EVENTS_LIMIT,
  createUpcomingEventsQueryFn,
  prefetchUpcomingEvents,
  upcomingEventsQueryKey,
} from "~/features/events/events.query-options";
import type { EventWithDetails } from "~/features/events/events.types";

const mockedGetUpcomingEvents = vi.mocked(getUpcomingEvents);

afterEach(() => {
  vi.clearAllMocks();
});

describe("upcoming events query options", () => {
  it("builds a stable query key with the provided limit", () => {
    expect(upcomingEventsQueryKey(5)).toEqual(["upcoming-events", { limit: 5 }]);
  });

  it("defaults to the configured limit", async () => {
    const events: EventWithDetails[] = [];
    mockedGetUpcomingEvents.mockResolvedValue(events);

    const queryFn = createUpcomingEventsQueryFn();
    const context = {
      queryKey: upcomingEventsQueryKey(DEFAULT_UPCOMING_EVENTS_LIMIT),
      signal: new AbortController().signal,
      meta: undefined,
      pageParam: undefined,
    } as QueryFunctionContext<ReturnType<typeof upcomingEventsQueryKey>>;
    await queryFn(context);

    expect(mockedGetUpcomingEvents).toHaveBeenCalledWith({
      data: { limit: DEFAULT_UPCOMING_EVENTS_LIMIT },
    });
  });

  it("passes through a custom limit and returns events", async () => {
    const events = [{ id: "event-1" }] as unknown as EventWithDetails[];
    mockedGetUpcomingEvents.mockResolvedValue(events);

    const queryFn = createUpcomingEventsQueryFn(3);
    const context = {
      queryKey: upcomingEventsQueryKey(3),
      signal: new AbortController().signal,
      meta: undefined,
      pageParam: undefined,
    } as QueryFunctionContext<ReturnType<typeof upcomingEventsQueryKey>>;
    const result = await queryFn(context);

    expect(mockedGetUpcomingEvents).toHaveBeenCalledWith({ data: { limit: 3 } });
    expect(result).toBe(events);
  });

  it("prefetches using the provided query client", async () => {
    const prefetchQuery = vi.fn().mockResolvedValue(undefined);
    const queryClient = { prefetchQuery } as Pick<QueryClient, "prefetchQuery">;

    await prefetchUpcomingEvents(queryClient, 6);

    expect(prefetchQuery).toHaveBeenCalledWith({
      queryKey: upcomingEventsQueryKey(6),
      queryFn: expect.any(Function),
      staleTime: 1000 * 60,
    });
  });

  it("logs and resolves when prefetching fails", async () => {
    const prefetchQuery = vi.fn().mockRejectedValue(new Error("boom"));
    const queryClient = { prefetchQuery } as Pick<QueryClient, "prefetchQuery">;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(prefetchUpcomingEvents(queryClient, 4)).resolves.toBeUndefined();

    expect(prefetchQuery).toHaveBeenCalledWith({
      queryKey: upcomingEventsQueryKey(4),
      queryFn: expect.any(Function),
      staleTime: 1000 * 60,
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to prefetch upcoming events",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});
