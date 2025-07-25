// Define types manually since we can't import from schema at top level
export interface MembershipType {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMonths: number;
  status: "active" | "inactive";
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Membership {
  id: string;
  userId: string;
  membershipTypeId: string;
  startDate: string | Date;
  endDate: string | Date;
  status: "active" | "cancelled" | "expired";
  paymentId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

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
