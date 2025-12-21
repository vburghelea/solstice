import type { z } from "zod";
import type { Event, EventRegistration } from "~/db/schema";
import type { createEventInputSchema } from "~/db/schema/events.schema";
import type {
  EventAmenities,
  EventDivisions,
  EventMetadata,
  EventPaymentMetadata,
  EventRegistrationRoster,
  EventRequirements,
  EventRules,
  EventSchedule,
} from "./events.db-types";

// Input types
export type CreateEventInput = z.infer<typeof createEventInputSchema>;

export type UpdateEventInput = Partial<CreateEventInput> & {
  status?: EventStatus;
  isPublic?: boolean;
  isFeatured?: boolean;
};

export type EventFilters = {
  status?: Event["status"] | Event["status"][];
  type?: Event["type"] | Event["type"][];
  organizerId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  city?: string;
  province?: string;
  featured?: boolean;
  publicOnly?: boolean;
};

export type EventRegistrationInput = {
  eventId: string;
  teamId?: string;
  division?: string;
  notes?: string;
  roster?: {
    userId: string;
    role: string;
  }[];
};

// Response types
export interface EventWithDetails
  extends Omit<
    Event,
    "rules" | "schedule" | "divisions" | "amenities" | "requirements" | "metadata"
  > {
  rules: EventRules;
  schedule: EventSchedule;
  divisions: EventDivisions;
  amenities: EventAmenities;
  requirements: EventRequirements;
  metadata: EventMetadata;
  organizer: {
    id: string;
    name: string;
    email: string;
  };
  registrationCount: number;
  isRegistrationOpen: boolean;
  availableSpots: number | undefined;
}

export interface EventRegistrationWithDetails
  extends Omit<EventRegistration, "roster" | "paymentMetadata"> {
  roster: EventRegistrationRoster;
  paymentMetadata: EventPaymentMetadata | null;
  event: EventWithDetails;
  team?: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export type EventPaymentMethod = EventRegistration["paymentMethod"];
export type EventPaymentStatus = EventRegistration["paymentStatus"];

export type EventRegistrationPaymentInfo =
  | {
      method: "square";
      checkoutUrl: string;
      sessionId: string;
    }
  | {
      method: "etransfer";
      instructions?: string | null;
      recipient?: string | null;
    }
  | {
      method: "free";
    };

export interface EventRegistrationResultPayload {
  registration: EventRegistrationWithDetails;
  payment?: EventRegistrationPaymentInfo;
}

export type CancelEventErrorCode =
  | "REFUND_FAILED"
  | "NO_PAYMENT_SESSION"
  | "NOT_PAID"
  | "UNAUTHORIZED";

export interface CancelEventResult {
  eventId: string;
  affected: {
    totalRegistrations: number;
    cancelled: number;
    alreadyCancelled: number;
    squareRefunded: number;
    etransferMarkedForRefund: number;
    freeOrUnpaid: number;
  };
  errors: Array<{
    registrationId: string;
    code: CancelEventErrorCode;
    message: string;
    paymentId?: string;
  }>;
}

// Operation result types
export type EventOperationResult<T = Event> =
  | { success: true; data: T }
  | { success: false; errors: EventError[] };

export type EventError = {
  code: EventErrorCode;
  message: string;
  field?: string;
};

export type EventErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE_SLUG"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "REGISTRATION_CLOSED"
  | "EVENT_FULL"
  | "ALREADY_REGISTERED"
  | "INVALID_DATES"
  | "DATABASE_ERROR";

// Utility types
export type EventStatus = Event["status"];
export type EventType = Event["type"];
export type RegistrationType = Event["registrationType"];

// Pagination
export type EventListResult = {
  events: EventWithDetails[];
  totalCount: number;
  pageInfo: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};
