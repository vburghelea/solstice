export type RoleOperationErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "DATABASE_ERROR";

export interface RoleOperationError {
  code: RoleOperationErrorCode;
  message: string;
}

export interface RoleOperationResult<T> {
  success: boolean;
  data?: T;
  errors?: RoleOperationError[];
}

export interface RoleSummary {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, boolean>;
  assignmentCount: number;
  requiresMfa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleAssignmentRow {
  id: string;
  roleId: string;
  roleName: string;
  roleDescription: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  teamId: string | null;
  eventId: string | null;
  assignedBy: string;
  assignedByName: string | null;
  assignedByEmail: string | null;
  assignedAt: Date;
  expiresAt: Date | null;
  notes: string | null;
}

export interface RoleManagementData {
  roles: RoleSummary[];
  assignments: RoleAssignmentRow[];
}

export interface RoleUserSearchResult {
  id: string;
  name: string;
  email: string;
  roleNames: string[];
}
