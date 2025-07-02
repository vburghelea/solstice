import type { User } from "better-auth";

// Type definitions that can be safely imported on both client and server
export type AuthUser = User | null;
