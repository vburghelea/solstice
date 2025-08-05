/**
 * Test data generators for E2E tests
 * These ensure unique data for parallel test execution
 */

export function generateUniqueUser(prefix: string) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return {
    name: `${prefix} User ${timestamp}`,
    email: `${prefix}+${timestamp}-${random}@example.com`,
    password: "testpassword123",
  };
}

export function generateUniqueTeam(prefix: string) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return {
    name: `${prefix} Team ${timestamp}`,
    slug: `${prefix}-${timestamp}-${random}`,
    description: `Test team created at ${new Date().toISOString()}`,
  };
}

export function generateUniqueMembership() {
  const timestamp = Date.now();
  return {
    name: `Test Membership ${timestamp}`,
    price: "$45.00",
    duration: "12 months",
  };
}

export function generateUniquePhone() {
  const random = Math.floor(1000000 + Math.random() * 9000000);
  return `+1555${random}`;
}
