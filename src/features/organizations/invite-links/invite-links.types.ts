export interface InviteLinkRow {
  id: string;
  organizationId: string;
  token: string;
  role: string;
  autoApprove: boolean;
  maxUses: number | null;
  useCount: number;
  expiresAt: Date | null;
  createdBy: string;
  createdAt: Date;
  revokedAt: Date | null;
  revokedBy: string | null;
}

export type InviteRedemptionStatus =
  | "joined"
  | "pending"
  | "already_member"
  | "already_requested";

export interface InviteRedemptionResult {
  status: InviteRedemptionStatus;
  organizationId: string;
  organizationName: string;
  joinRequestId?: string;
}
