export interface EmergencyContact {
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
}

export interface PrivacySettings {
  showEmail: boolean;
  showPhone: boolean;
  showBirthYear: boolean;
  allowTeamInvitations: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profileComplete: boolean;
  dateOfBirth?: Date | undefined;
  emergencyContact?: EmergencyContact | undefined;
  gender?: string | undefined;
  pronouns?: string | undefined;
  phone?: string | undefined;
  privacySettings?: PrivacySettings | undefined;
  profileVersion: number;
  profileUpdatedAt?: Date | undefined;
}

export interface ProfileInput {
  dateOfBirth: Date;
  emergencyContact: EmergencyContact;
  gender?: string;
  pronouns?: string;
  phone?: string;
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
  showBirthYear: true,
  allowTeamInvitations: true,
};
