/**
 * Client-safe security module exports
 * Only exports utilities that don't depend on server environment
 */

export {
  getPasswordStrength,
  getPasswordStrengthLabel,
  validatePassword,
} from "./utils/password-validator.client";
