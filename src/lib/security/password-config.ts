/**
 * Password configuration constants
 * Shared between client and server - no environment dependencies
 */

export const PASSWORD_CONFIG = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
} as const;

// Export type for use in other modules
export type PasswordConfig = typeof PASSWORD_CONFIG;
