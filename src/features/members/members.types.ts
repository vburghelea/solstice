export type MemberDirectoryErrorCode = "NOT_AUTHENTICATED" | "DATABASE_ERROR";

export interface MemberDirectoryError {
  code: MemberDirectoryErrorCode;
  message: string;
}

export interface MemberDirectoryMembershipSummary {
  status: "active" | "expired" | "cancelled";
  membershipType: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface MemberDirectoryMember {
  id: string;
  name: string;
  email: string | null;
  emailVisible: boolean;
  phone: string | null;
  phoneVisible: boolean;
  pronouns: string | null;
  teams: string[];
  membershipStatus: "active" | "expired" | "cancelled" | "none";
  membershipType: string | null;
  membershipEndDate: string | null;
  hasActiveMembership: boolean;
  allowTeamInvitations: boolean;
  birthYear: number | null;
  birthYearVisible: boolean;
  profileUpdatedAt: string | null;
  membershipHistory: MemberDirectoryMembershipSummary[];
}

export interface MemberDirectoryPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface MemberDirectoryResponse {
  members: MemberDirectoryMember[];
  pagination: MemberDirectoryPagination;
}

export interface MemberDirectoryOperationResult<TData> {
  success: boolean;
  data?: TData;
  errors?: MemberDirectoryError[];
}
