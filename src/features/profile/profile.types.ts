export interface PrivacySettings {
  showEmail: boolean;
  showPhone: boolean;
  allowTeamInvitations: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
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
  gameSystemPreferences?: {
    favorite: { id: number; name: string }[];
    avoid: { id: number; name: string }[];
  };
  privacySettings?: PrivacySettings;
}

export interface ProfileError {
  field?: string;
  message: string;
  code:
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
  allowTeamInvitations: true,
};
