import { User } from "~/lib/auth/types";

export const BASE_USER_PROPS = {
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  image: null,
  profileComplete: true,
  profileVersion: 1,
  gender: null,
  pronouns: null,
  phone: null,
  profileUpdatedAt: null,
  privacySettings: null,
};

export const MOCK_OWNER_USER: User = {
  id: "owner-user-id",
  name: "Owner User",
  email: "owner@example.com",
  emailVerified: true,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  profileComplete: true,
  phone: "+1234567890",
  gender: "male",
  pronouns: "he/him",
  privacySettings: JSON.stringify({
    showEmail: false,
    showPhone: false,
  }),
  profileUpdatedAt: new Date(),
  profileVersion: 1,
};

export const MOCK_PLAYER_USER: User = {
  id: "player-1",
  email: "player@example.com",
  name: "Campaign Player",
  ...BASE_USER_PROPS,
};

export const MOCK_INVITED_USER: User = {
  id: "invited-1",
  email: "invited@example.com",
  name: "Campaign Invited",
  ...BASE_USER_PROPS,
};

export const MOCK_OTHER_USER: User = {
  id: "other-1",
  email: "other@example.com",
  name: "Other User",
  ...BASE_USER_PROPS,
};
