export type EventSnapshot = {
  status?: string | null;
  dateTime?: Date | string | null;
  location?: unknown;
};

/**
 * Returns an array of human-readable change descriptions between two event snapshots.
 * Only reports fields that actually changed.
 */
export function summarizeEventChanges(
  previous: EventSnapshot,
  updated: EventSnapshot,
): string[] {
  const changes: string[] = [];
  if (
    typeof updated.status !== "undefined" &&
    updated.status !== previous.status &&
    updated.status
  ) {
    const normalizedStatus = `${updated.status}`.toLowerCase();
    if (normalizedStatus === "canceled" || normalizedStatus === "cancelled") {
      changes.push("Canceled");
    } else {
      changes.push(`Status changed to ${updated.status}`);
    }
  }
  if (
    typeof updated.dateTime !== "undefined" &&
    updated.dateTime &&
    previous.dateTime &&
    new Date(updated.dateTime).getTime() !== new Date(previous.dateTime).getTime()
  ) {
    changes.push("Rescheduled");
  }
  if (typeof updated.location !== "undefined") {
    const prevLoc = normalizeLocation(previous.location);
    const nextLoc = normalizeLocation(updated.location);
    if (!areLocationsEqual(prevLoc, nextLoc)) {
      changes.push("Location updated");
    }
  }
  return changes;
}

type NormalizedLocation = {
  address: string | null;
  lat: number | null;
  lng: number | null;
  placeId: string | null;
} | null;

function normalizeLocation(value: unknown): NormalizedLocation {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  return {
    address: normalizeString(record["address"]),
    lat: normalizeCoordinate(record["lat"]),
    lng: normalizeCoordinate(record["lng"]),
    placeId: normalizeString(record["placeId"]),
  };
}

function normalizeString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (value == null) {
    return null;
  }
  return `${value}`.trim() || null;
}

function normalizeCoordinate(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function areLocationsEqual(a: NormalizedLocation, b: NormalizedLocation): boolean {
  if (!a && !b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return (
    a.address === b.address &&
    coordinatesEqual(a.lat, b.lat) &&
    coordinatesEqual(a.lng, b.lng) &&
    a.placeId === b.placeId
  );
}

function coordinatesEqual(a: number | null, b: number | null): boolean {
  if (a == null && b == null) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  return Math.abs(a - b) < 1e-6;
}
