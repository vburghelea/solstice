/**
 * Security module exports
 * Centralizes all security-related functionality
 */

// Server-only exports - only import these in server code
export { securityConfig } from "./config";
export type { CookieConfig, SecurityConfig, SessionConfig } from "./config";
export { getClientIp, rateLimit } from "./middleware/rate-limit";

// Shared exports - safe for both client and server
export { PASSWORD_CONFIG } from "./password-config";
export {
  getPasswordStrength,
  getPasswordStrengthLabel,
  validatePassword,
} from "./utils/password-validator";
