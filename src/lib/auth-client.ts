import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { getBaseUrl } from "./env.client";

// Create a lazy-loaded auth client
const createClient = (baseURL: string) =>
  createAuthClient({
    baseURL,
    plugins: [twoFactorClient()],
  });

type AuthClient = ReturnType<typeof createClient>;

let authClientInstance: AuthClient | null = null;

function getAuthClient() {
  if (!authClientInstance) {
    const baseURL = getBaseUrl();
    // Only log in development to avoid noisy production logs
    if (import.meta.env.DEV) {
      console.log("Auth client created with baseURL:", baseURL);
    }
    authClientInstance = createClient(baseURL);
  }
  return authClientInstance;
}

// Export a facade with all auth methods
export const auth = {
  // Use getters to ensure the client is initialized before use
  get signIn() {
    return getAuthClient().signIn;
  },
  get signUp() {
    return getAuthClient().signUp;
  },
  get signOut() {
    return getAuthClient().signOut;
  },
  get signInWithOAuth() {
    return getAuthClient().signIn.social;
  },
  get getSession() {
    return getAuthClient().getSession;
  },
  get session() {
    return getAuthClient().useSession;
  },
  get updateUser() {
    return getAuthClient().updateUser;
  },
  get deleteUser() {
    return getAuthClient().deleteUser;
  },
  get resetPassword() {
    return getAuthClient().resetPassword;
  },
  get changePassword() {
    return getAuthClient().changePassword;
  },
  get sendVerificationEmail() {
    return getAuthClient().sendVerificationEmail;
  },
  get verifyEmail() {
    return getAuthClient().verifyEmail;
  },
  get twoFactor() {
    return getAuthClient().twoFactor;
  },
  get $client() {
    return getAuthClient();
  },
};

// Default export for backward compatibility
export default {
  get: () => getAuthClient(),
};
