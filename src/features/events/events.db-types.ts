/**
 * Type definitions for events database jsonb fields
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface EventRules {
  [key: string]: any;
}

export interface EventScheduleItem {
  time: string;
  activity: string;
  location?: string;
  notes?: string;
}

export interface EventSchedule {
  items?: EventScheduleItem[];
  [key: string]: any;
}

export interface EventDivision {
  name: string;
  maxTeams?: number;
  description?: string;
  [key: string]: any;
}

export interface EventDivisions {
  divisions?: EventDivision[];
  [key: string]: any;
}

export type EventAmenity = string;

export interface EventAmenities {
  amenities?: EventAmenity[];
  [key: string]: any;
}

export type EventRequirement = string;

export interface EventRequirements {
  requirements?: EventRequirement[];
  [key: string]: any;
}

export interface EventMetadata {
  [key: string]: any;
}

export interface EventRegistrationRosterPlayer {
  userId: string;
  name?: string;
  role?: string;
  jerseyNumber?: string;
  [key: string]: any;
}

export interface EventRegistrationRoster {
  players?: EventRegistrationRosterPlayer[];
  [key: string]: any;
}

export interface EventPaymentMetadata {
  instructionsSnapshot?: string;
  recipient?: string;
  lastReminderAt?: string;
  lastReminderBy?: string;
  markedPaidAt?: string;
  markedPaidBy?: string;
  notes?: string;
  [key: string]: any;
}
