import { createAuthClient } from "better-auth/react";

// Create auth client instance
export const authClient = createAuthClient({
  baseURL: import.meta.env["VITE_BASE_URL"],
});

console.log("Auth client created with baseURL:", import.meta.env["VITE_BASE_URL"]);

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
  signInWithOAuth: (
    data: Parameters<typeof authClient.signIn.social>[0],
    ...args: Parameters<typeof authClient.signIn.social> extends [unknown, ...infer Rest]
      ? Rest
      : []
  ) => {
    console.log("signInWithOAuth called with:", data);
    console.log("Additional args:", args);
    const result = authClient.signIn.social(data, ...args);
    console.log("signIn.social returned:", result);
    return result;
  },

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
