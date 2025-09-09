import type { user as dbUser } from "~/db/schema/auth.schema";
import { defaultPrivacySettings } from "~/features/profile/profile.types";

type DbUser = typeof dbUser.$inferSelect;

export const BASE_USER_PROPS: Omit<DbUser, "id" | "name" | "email"> = {
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  image: null,
  uploadedAvatarPath: null,
  profileComplete: true,
  profileVersion: 1,
  gender: null,
  pronouns: null,
  phone: null,
  city: null,
  country: null,
  languages: [],
  identityTags: [],
  preferredGameThemes: [],
  overallExperienceLevel: null,
  calendarAvailability: null,
  privacySettings: JSON.stringify(defaultPrivacySettings),
  isGM: false,
  gamesHosted: 0,
  averageResponseTime: null,
  responseRate: 0,
  gmStyle: null,
  gmRating: null,
  profileUpdatedAt: null,
};

export const MOCK_NON_OWNER_USER: DbUser = {
  id: "non-owner-test-user-id",
  name: "Non Owner",
  email: "nonowner@example.com",
  ...BASE_USER_PROPS,
};

export const MOCK_OWNER_USER: DbUser = {
  id: "test-user-id",
  name: "Owner User",
  email: "owner@example.com",
  emailVerified: true,
  image: null,
  uploadedAvatarPath: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  profileComplete: true,
  phone: "+1234567890",
  gender: "male",
  pronouns: "he/him",
  city: "Test City",
  country: "Test Country",
  languages: ["English"],
  identityTags: ["gamer"],
  preferredGameThemes: ["fantasy"],
  overallExperienceLevel: "intermediate",
  calendarAvailability: null,
  privacySettings: JSON.stringify({
    showEmail: false,
    showPhone: false,
    showLocation: false,
    showLanguages: false,
    showGamePreferences: false,
    allowTeamInvitations: true,
    allowFollows: true,
  }),
  isGM: true,
  gamesHosted: 5,
  averageResponseTime: 30,
  responseRate: 95,
  gmStyle: "storytelling",
  gmRating: 4,
  profileUpdatedAt: new Date(),
  profileVersion: 1,
};

export const MOCK_PLAYER_USER: DbUser = {
  id: "player-1",
  email: "player@example.com",
  name: "Campaign Player",
  ...BASE_USER_PROPS,
};

export const MOCK_INVITED_USER: DbUser = {
  id: "invited-1",
  email: "invited@example.com",
  name: "Campaign Invited",
  ...BASE_USER_PROPS,
};

export const MOCK_OTHER_USER: DbUser = {
  id: "other-1",
  email: "other@example.com",
  name: "Other User",
  ...BASE_USER_PROPS,
};
