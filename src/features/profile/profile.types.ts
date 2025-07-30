export interface PrivacySettings {
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  showLanguages: boolean;
  showGamePreferences: boolean;
  allowTeamInvitations: boolean;
  allowFollows: boolean;
  allowInvitesOnlyFromConnections?: boolean;
}

import type { AvailabilityData } from "~/db/schema/auth.schema";

export interface NotificationPreferences {
  gameReminders: boolean;
  gameUpdates: boolean;
  campaignDigests: boolean;
  campaignUpdates: boolean;
  reviewReminders: boolean;
  socialNotifications: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  uploadedAvatarPath?: string;
  profileComplete: boolean;
  gender?: string | undefined;
  pronouns?: string | undefined;
  phone?: string | undefined;
  privacySettings?: PrivacySettings | undefined;
  profileVersion: number;
  profileUpdatedAt?: Date | undefined;
  gameSystemPreferences?:
    | {
        favorite: { id: number; name: string }[];
        avoid: { id: number; name: string }[];
      }
    | undefined;
}

export interface ProfileInput {
  gender?: string;
  pronouns?: string;
  phone?: string;
  city?: string;
  country?: string;
  languages: string[];
  identityTags: string[];
  preferredGameThemes: string[];
  overallExperienceLevel?: "beginner" | "intermediate" | "advanced" | "expert";
  gameSystemPreferences?: {
    favorite: { id: number; name: string }[];
    avoid: { id: number; name: string }[];
  };
  calendarAvailability?: AvailabilityData;
  privacySettings?: PrivacySettings;
  notificationPreferences?: NotificationPreferences;
  isGM: boolean;
  gamesHosted: number;
  averageResponseTime?: number;
  responseRate: number;
  gmStyle?: string;
  gmRating?: number;
  gmTopStrengths?: string[];
  profileVersion: number;
  profileUpdatedAt?: Date;
}

export interface ProfileInput {
  gender?: string;
  pronouns?: string;
  phone?: string;
  city?: string;
  country?: string;
  languages?: string[];
  identityTags?: string[];
  preferredGameThemes?: string[];
  overallExperienceLevel?: "beginner" | "intermediate" | "advanced" | "expert";
  gameSystemPreferences?: {
    favorite: { id: number; name: string }[];
    avoid: { id: number; name: string }[];
  };
  calendarAvailability?: AvailabilityData;
  privacySettings?: PrivacySettings;
  notificationPreferences?: NotificationPreferences;
  isGM?: boolean;
  gmStyle?: string;
}

// Social Feature Types
export interface UserFollow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface GMReview {
  id: string;
  reviewerId: string;
  gmId: string;
  gameId: string;
  rating: number; // 1-5 scale
  selectedStrengths: string[];
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FollowInput {
  followingId: string;
}

export interface GMReviewInput {
  gmId: string;
  gameId: string;
  rating: number; // thumbs -2..2 on input (mapped server-side to 1..5)
  selectedStrengths: string[];
  comment?: string;
}

// Profile Display Types
export interface ProfileDisplayData extends UserProfile {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  canFollow: boolean;
  gmReviews: GMReview[];
  averageGMRating?: number;
}

export interface ProfileError {
  field?: string;
  message: string;
  code:
    | "AUTH_ERROR"
    | "VALIDATION_ERROR"
    | "MISSING_REQUIRED_FIELD"
    | "INVALID_FORMAT"
    | "DATABASE_ERROR";
}

export interface ProfileOperationResult {
  success: boolean;
  data?: UserProfile;
  errors?: ProfileError[];
}

export const defaultPrivacySettings: PrivacySettings = {
  showEmail: false,
  showPhone: false,
  showLocation: false,
  showLanguages: false,
  showGamePreferences: false,
  allowTeamInvitations: true,
  allowFollows: true,
  allowInvitesOnlyFromConnections: false,
};

export const defaultNotificationPreferences: NotificationPreferences = {
  gameReminders: true,
  gameUpdates: true,
  campaignDigests: true,
  campaignUpdates: true,
  reviewReminders: true,
  socialNotifications: false,
};
