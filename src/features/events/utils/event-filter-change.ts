import type { EventFilters } from "~/features/events/events.types";

type FilterValue<K extends keyof EventFilters> = EventFilters[K] | undefined;

const valuesAreEqual = <K extends keyof EventFilters>(
  currentValue: FilterValue<K>,
  nextValue: FilterValue<K>,
): boolean => {
  if (Array.isArray(currentValue) && Array.isArray(nextValue)) {
    if (currentValue.length !== nextValue.length) {
      return false;
    }

    return currentValue.every((value, index) => Object.is(value, nextValue[index]));
  }

  return Object.is(currentValue, nextValue);
};

const normalizeValue = <K extends keyof EventFilters>(
  value: FilterValue<K>,
): FilterValue<K> => {
  if (typeof value === "string") {
    return value.trim() as FilterValue<K>;
  }

  return value;
};

const shouldRemoveValue = <K extends keyof EventFilters>(
  value: FilterValue<K>,
): value is undefined => {
  if (value === undefined) {
    return true;
  }

  return typeof value === "string" && value.length === 0;
};

export const applyEventFilterChange = <K extends keyof EventFilters>(
  filters: EventFilters,
  key: K,
  rawValue: FilterValue<K>,
): { nextFilters: EventFilters; changed: boolean } => {
  const value = normalizeValue(rawValue);

  if (shouldRemoveValue(value)) {
    if (!(key in filters)) {
      return { nextFilters: filters, changed: false };
    }

    const rest = { ...filters };
    delete rest[key];
    return { nextFilters: rest, changed: true };
  }

  if (valuesAreEqual(filters[key], value)) {
    return { nextFilters: filters, changed: false };
  }

  return {
    nextFilters: {
      ...filters,
      [key]: value as EventFilters[K],
    },
    changed: true,
  };
};
