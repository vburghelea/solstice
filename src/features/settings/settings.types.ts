import type { z } from "zod";
import type {
  changePasswordInputSchema,
  revokeSessionInputSchema,
  unlinkAccountInputSchema,
} from "./settings.schemas";

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
export type RevokeSessionInput = z.infer<typeof revokeSessionInputSchema>;
export type UnlinkAccountInput = z.infer<typeof unlinkAccountInputSchema>;

export interface SessionInfo {
  id: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  isCurrent: boolean;
}

export interface SessionsOverview {
  sessions: SessionInfo[];
  currentSessionToken: string | null;
}

export interface ConnectedAccount {
  id: string;
  providerId: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
  scopes: string[];
}

export interface LinkedAccountsOverview {
  accounts: ConnectedAccount[];
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  errors?: { code: string; message: string }[];
}
