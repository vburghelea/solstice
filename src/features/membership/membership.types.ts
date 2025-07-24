import type { Membership, MembershipType } from "~/db/schema";

export interface MembershipOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: Array<{
    code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "PAYMENT_ERROR" | "NOT_FOUND";
    field?: string;
    message: string;
  }>;
}

export interface CheckoutSessionResult {
  checkoutUrl: string;
  sessionId: string;
}

export interface MembershipPurchaseInput {
  membershipTypeId: string;
  sessionId: string;
  paymentId?: string;
}

export interface UserMembership extends Membership {
  membershipType: MembershipType;
}

export interface MembershipStatus {
  hasMembership: boolean;
  currentMembership?: UserMembership;
  expiresAt?: Date;
  daysRemaining?: number;
}
