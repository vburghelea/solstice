import { createAuthClient } from "better-auth/react";

// Create auth client instance
export const authClient = createAuthClient({
  baseURL: import.meta.env["VITE_BASE_URL"],
});

// Export a facade with all auth methods
export const auth = {
  // Authentication methods
  signIn: {
    email: authClient.signIn.email,
    social: authClient.signIn.social,
  },
  signUp: {
    email: authClient.signUp.email,
  },
  signOut: authClient.signOut,

  // OAuth methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signInWithOAuth: (
    data: Parameters<typeof authClient.signIn.social>[0],
    ...args: any[]
  ) => authClient.signIn.social(data, ...args),

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
