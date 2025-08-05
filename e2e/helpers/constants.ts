/**
 * Shared constants for E2E tests to avoid hardcoding values
 */

// Dynamic values that change with time
export const CURRENT_SEASON = new Date().getUTCFullYear();
export const ANNUAL_MEMBERSHIP_NAME = `Annual Player Membership ${CURRENT_SEASON}`;
export const ANNUAL_MEMBERSHIP_PRICE = "$45.00"; // Could be read from env/API

// Common test timeouts
export const TIMEOUTS = {
  navigation: 15000,
  action: 10000,
  expectation: 10000,
  networkIdle: 30000,
} as const;

// Test user patterns
export const TEST_USER_PATTERN = {
  email: (index: number) => `testuser${index}@example.com`,
  password: (email: string) => `${email.split("@")[0]}123`,
} as const;
