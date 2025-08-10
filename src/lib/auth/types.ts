import type { User as BetterAuthUser } from "better-auth";
import type { Tag } from "~/db/schema";

// User role with full role information
export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role: {
    id: string;
    name: string;
    description: string | null;
    permissions: Record<string, boolean>;
  };
  teamId?: string | null;
  eventId?: string | null;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date | null;
  notes?: string | null;
}

// User tag (for future implementation)
export interface UserTag {
  id: string;
  userId: string;
  tagId: string;
  tag: Tag;
  assignedBy?: string | null;
  assignedAt: Date;
  expiresAt?: Date | null;
  notes?: string | null;
}

// Extended user type that includes our custom fields
export interface User extends BetterAuthUser {
  image: string | null;
  // Profile completion tracking
  profileComplete: boolean;

  // Optional profile fields
  gender: string | null;
  pronouns: string | null;
  phone: string | null;

  // Privacy and preferences
  privacySettings: string | null; // JSON string

  // Audit and versioning
  profileVersion: number;
  profileUpdatedAt: Date | null;

  // Roles and permissions
  roles?: UserRole[];

  // Tags (for future implementation)
  tags?: UserTag[];
}

// Type definitions that can be safely imported on both client and server
export type AuthUser = User | null;
