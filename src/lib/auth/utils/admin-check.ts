/**
 * Simple admin check utility
 * In a production app, this would check against a proper role/permission system
 */

// For demo purposes, we'll use a simple email-based check
// In production, this should be replaced with proper RBAC
const ADMIN_EMAILS = [
  "admin@roundup.games",
  "admin@example.com",
  // Add more admin emails as needed
];

export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;

  // Check if email is in admin list
  if (ADMIN_EMAILS.includes(email.toLowerCase())) {
    return true;
  }

  // Check if email domain is admin domain (for development)
  if (email.endsWith("@roundup.games")) {
    return true;
  }

  return false;
}

export async function requireAdmin(email: string | undefined | null): Promise<void> {
  if (!isAdmin(email)) {
    throw new Error("Unauthorized: Admin access required");
  }
}
