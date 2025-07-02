import { createAuthClient } from "better-auth/react";
import { clientEnv } from "../env.client";

// Create auth client instance
export const authClient = createAuthClient({
  baseURL: clientEnv.VITE_BASE_URL,
});

// Export a facade with all auth methods
export const auth = {
  // Authentication methods
  signIn: authClient.signIn,
  signUp: authClient.signUp,
  signOut: authClient.signOut,

  // OAuth methods
  signInWithOAuth: authClient.signIn.social,

  // Session methods
  getSession: authClient.getSession,
  useSession: authClient.useSession,

  // User methods
  updateUser: authClient.updateUser,
  deleteUser: authClient.deleteUser,

  // Password methods
  forgetPassword: authClient.forgetPassword,
  resetPassword: authClient.resetPassword,
  changePassword: authClient.changePassword,

  // Email verification
  sendVerificationEmail: authClient.sendVerificationEmail,
  verifyEmail: authClient.verifyEmail,

  // Raw client for advanced usage
  $client: authClient,
};

// Default export for backward compatibility
export default authClient;
