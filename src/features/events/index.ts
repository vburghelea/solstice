// Event queries
export {
  checkEventRegistration,
  getEvent,
  getUpcomingEvents,
  listEvents,
} from "./events.queries";

// Event mutations
export {
  cancelEvent,
  cancelEventRegistration,
  createEvent,
  registerForEvent,
  updateEvent,
} from "./events.mutations";

// Event types
export type {
  CreateEventInput,
  EventError,
  EventErrorCode,
  EventFilters,
  EventListResult,
  EventOperationResult,
  EventRegistrationInput,
  EventRegistrationWithDetails,
  EventStatus,
  EventType,
  EventWithDetails,
  RegistrationType,
  UpdateEventInput,
} from "./events.types";
