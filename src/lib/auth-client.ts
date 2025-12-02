import { createAuthClient } from "better-auth/react";
import { getBaseUrl } from "./env.client";

// Create a lazy-loaded auth client
let authClientInstance: ReturnType<typeof createAuthClient> | null = null;

function getAuthClient() {
  if (!authClientInstance) {
    const baseURL = getBaseUrl();
    console.log("Auth client created with baseURL:", baseURL);
    authClientInstance = createAuthClient({ baseURL });
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
  get $client() {
    return getAuthClient();
  },
};

// Default export for backward compatibility
export default {
  get: () => getAuthClient(),
};
