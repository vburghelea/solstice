import type { OrganizationRole } from "~/lib/auth/guards/org-guard";

export type OrganizationOperationErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "DATABASE_ERROR";

export interface OrganizationOperationError {
  code: OrganizationOperationErrorCode;
  message: string;
}

export interface OrganizationOperationResult<T> {
  success: boolean;
  data?: T;
  errors?: OrganizationOperationError[];
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  parentOrgId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMemberRow {
  id: string;
  organizationId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  role: string;
  status: string;
  invitedBy: string | null;
  invitedAt: Date | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DelegatedAccessRow {
  id: string;
  organizationId: string;
  delegateUserId: string;
  delegateEmail: string | null;
  scope: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  revokedBy: string | null;
  notes: string | null;
}

export interface AccessibleOrganization extends OrganizationSummary {
  role: OrganizationRole | null;
  delegatedScopes?: string[];
}
