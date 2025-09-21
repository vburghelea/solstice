import type { EventPaymentMetadata } from "../events.db-types";
import type { Clock } from "./time";
import { isoTimestamp } from "./time";

export type ActorId = string;

/**
 * Capture a snapshot of the e-transfer instructions that were visible when the
 * registration was created. Keeps downstream finance emails consistent.
 */
export function buildEtransferSnapshot(
  instructions?: string | null,
  recipient?: string | null,
): EventPaymentMetadata {
  const metadata: EventPaymentMetadata = {};
  if (instructions) metadata.instructionsSnapshot = instructions;
  if (recipient) metadata.recipient = recipient;
  return metadata;
}

/** Record that an e-transfer was marked paid by a specific actor at a specific time. */
export function markEtransferPaidMetadata(
  existing: EventPaymentMetadata | undefined,
  actorId: ActorId,
  clock?: Clock,
): EventPaymentMetadata {
  const metadata: EventPaymentMetadata = { ...(existing ?? {}) };
  metadata.markedPaidAt = isoTimestamp(clock);
  metadata.markedPaidBy = actorId;
  return metadata;
}

/** Record that a reminder email was sent for an outstanding e-transfer. */
export function markEtransferReminderMetadata(
  existing: EventPaymentMetadata | undefined,
  actorId: ActorId,
  clock?: Clock,
): EventPaymentMetadata {
  const metadata: EventPaymentMetadata = { ...(existing ?? {}) };
  metadata.lastReminderAt = isoTimestamp(clock);
  metadata.lastReminderBy = actorId;
  return metadata;
}

/**
 * Optionally attach cancellation notes so finance/admin teams have context when
 * reviewing payment metadata.
 */
export function appendCancellationNote(
  existing: EventPaymentMetadata | undefined,
  note: string | undefined,
): EventPaymentMetadata {
  const metadata: EventPaymentMetadata = { ...(existing ?? {}) };
  if (note) {
    const existingNotes = metadata.notes ? metadata.notes.split("\n") : [];
    if (!existingNotes.includes(note)) {
      metadata.notes = existingNotes.length > 0 ? `${metadata.notes}\n${note}` : note;
    }
  }
  return metadata;
}
