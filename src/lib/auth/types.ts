import type { User as BetterAuthUser } from "better-auth";

// Extended user type that includes our custom fields
export interface User extends BetterAuthUser {
  // Profile completion tracking
  profileComplete: boolean;

  // Required profile fields
  dateOfBirth?: Date | null;
  emergencyContact?: string | null; // JSON string

  // Optional profile fields
  gender?: string | null;
  pronouns?: string | null;
  phone?: string | null;

  // Privacy and preferences
  privacySettings?: string | null; // JSON string

  // Audit and versioning
  profileVersion: number;
  profileUpdatedAt?: Date | null;
}

// Type definitions that can be safely imported on both client and server
export type AuthUser = User | null;
