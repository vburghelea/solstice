import { securityConfig } from "../config";

interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a password against security requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const config = securityConfig.password;

  // Check minimum length
  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters long`);
  }

  // Check uppercase requirement
  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Check lowercase requirement
  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Check numbers requirement
  if (config.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Check special characters requirement
  if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates a password strength score (0-5)
 */
export function getPasswordStrength(password: string): number {
  let strength = 0;

  // Length bonuses
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (password.length >= 16) strength++;

  // Complexity bonuses
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

  // Cap at 5
  return Math.min(strength, 5);
}

/**
 * Get a human-readable password strength label
 */
export function getPasswordStrengthLabel(strength: number): string {
  switch (strength) {
    case 0:
    case 1:
      return "Very Weak";
    case 2:
      return "Weak";
    case 3:
      return "Fair";
    case 4:
      return "Strong";
    case 5:
      return "Very Strong";
    default:
      return "Unknown";
  }
}
