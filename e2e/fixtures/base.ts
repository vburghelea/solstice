import { test as base } from "@playwright/test";

// Extend basic test by providing common fixtures
export const test = base.extend({
  // Add any custom fixtures here
});

export { expect } from "@playwright/test";
