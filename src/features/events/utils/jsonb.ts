import type { Event as DbEvent, EventRegistration } from "~/db/schema";
import type {
  EventAmenities,
  EventDivisions,
  EventMetadata,
  EventPaymentMetadata,
  EventRegistrationRoster,
  EventRequirements,
  EventRules,
  EventSchedule,
} from "../events.db-types";
import type { EventWithDetails } from "../events.types";

export type EventRegistrationWithRoster = Omit<
  EventRegistration,
  "roster" | "paymentMetadata"
> & {
  roster: EventRegistrationRoster;
  paymentMetadata: EventPaymentMetadata | null;
};

export function castEventJsonbFields(event: DbEvent): EventWithDetails {
  return {
    ...event,
    rules: (event.rules || {}) as EventRules,
    schedule: (event.schedule || {}) as EventSchedule,
    divisions: (event.divisions || {}) as EventDivisions,
    amenities: (event.amenities || {}) as EventAmenities,
    requirements: (event.requirements || {}) as EventRequirements,
    metadata: (event.metadata || {}) as EventMetadata,
  } as EventWithDetails;
}

export function castRegistrationJsonbFields(
  registration: EventRegistration,
): EventRegistrationWithRoster {
  return {
    ...registration,
    roster: (registration.roster || {}) as EventRegistrationRoster,
    paymentMetadata: registration.paymentMetadata
      ? (registration.paymentMetadata as EventPaymentMetadata)
      : null,
  };
}
