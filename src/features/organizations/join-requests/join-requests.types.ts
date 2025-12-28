export interface DiscoverableOrganization {
  id: string;
  name: string;
  type: string;
  joinRequestsEnabled: boolean;
}

export interface JoinRequestSummary {
  id: string;
  organizationId: string;
  organizationName: string;
  status: string;
  requestedRole: string;
  message: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
}

export interface OrganizationJoinRequestRow {
  id: string;
  organizationId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  status: string;
  requestedRole: string;
  message: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
}
