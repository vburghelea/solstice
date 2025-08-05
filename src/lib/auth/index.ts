/**
 * Auth module - Client-safe exports
 *
 * For server-side auth configuration, import from ~/lib/auth/server-helpers
 */

// Export types that are safe for client use
export type { Session, User } from "better-auth";
export type { AuthUser, User as ExtendedUser } from "./types";
