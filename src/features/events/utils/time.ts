export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

/** Returns the current Date using the provided or system clock. */
export const currentTimestamp = (clock: Clock = systemClock): Date => clock.now();

/** Returns an ISO string timestamp using the provided or system clock. */
export const isoTimestamp = (clock: Clock = systemClock): string =>
  clock.now().toISOString();

/** Retrieves a test clock from the server-fn context, falling back to the system clock. */
export const getClockFromContext = (context: unknown): Clock => {
  const candidate = (context as Record<string, unknown> | undefined)?.["clock"];
  if (candidate && typeof (candidate as Partial<Clock>).now === "function") {
    return candidate as Clock;
  }
  return systemClock;
};

/** Creates a clock that always returns the provided fixed instant. */
export const fixedClock = (at: Date | string | number): Clock => {
  const fixedDate = at instanceof Date ? at : new Date(at);
  return {
    now: () => fixedDate,
  };
};

/**
 * Creates a clock whose value can change. Useful for deterministic tests that need to
 * advance time in steps.
 */
export const mutableClock = (start: Date = new Date()) => {
  let current = start;
  return {
    now: () => current,
    set: (next: Date | string | number) => {
      current = next instanceof Date ? next : new Date(next);
    },
  } as Clock & { set: (next: Date | string | number) => void };
};
