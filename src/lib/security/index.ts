/**
 * Security module exports
 * Centralizes all security-related functionality
 */

export { securityConfig } from "./config";
export type { CookieConfig, SecurityConfig, SessionConfig } from "./config";

export { getClientIp, rateLimit } from "./middleware/rate-limit";

export {
  getPasswordStrength,
  getPasswordStrengthLabel,
  validatePassword,
} from "./utils/password-validator";
