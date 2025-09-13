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
    changes.push(`Status changed to ${updated.status}`);
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
    const prevLoc = JSON.stringify(previous.location ?? {});
    const nextLoc = JSON.stringify(updated.location ?? {});
    if (prevLoc !== nextLoc) {
      changes.push("Location updated");
    }
  }
  return changes;
}
