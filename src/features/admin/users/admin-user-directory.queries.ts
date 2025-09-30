import { useMutation, useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type { SQL } from "drizzle-orm";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";

import type { OperationResult } from "~/shared/types/common";

const membershipStatusSchema = z.enum(["active", "expired", "canceled", "none"]);

const adminUserFiltersSchema = z.object({
  search: z.string().trim().min(1).optional(),
  membershipStatus: membershipStatusSchema.optional(),
  roleId: z.string().min(1).optional(),
  requireMfa: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(50).optional(),
});

type AdminUserFiltersInput = z.infer<typeof adminUserFiltersSchema>;

type AdminMembershipStatus = z.infer<typeof membershipStatusSchema>;

type AdminUserRecordWire = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  profileComplete: boolean;
  createdAt: string;
  lastActiveAt: string | null;
  membershipStatus: AdminMembershipStatus;
  membershipExpiresAt: string | null;
  membershipTypeName: string | null;
  roles: {
    id: string;
    roleId: string;
    name: string;
    assignedAt: string;
    expiresAt: string | null;
    scope: string | null;
  }[];
  personaCoverage: { personaId: string; label: string }[];
  mfaEnrolled: boolean;
  riskFlags: { type: "security" | "compliance"; message: string }[];
  auditTrail: { label: string; timestamp: string }[];
};

type AdminUserDirectoryWire = {
  items: AdminUserRecordWire[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type AdminUserRecord = Omit<
  AdminUserRecordWire,
  "createdAt" | "lastActiveAt" | "membershipExpiresAt" | "roles" | "auditTrail"
> & {
  createdAt: Date;
  lastActiveAt: Date | null;
  membershipExpiresAt: Date | null;
  roles: Array<{
    id: string;
    roleId: string;
    name: string;
    assignedAt: Date;
    expiresAt: Date | null;
    scope: string | null;
  }>;
  auditTrail: Array<{ label: string; timestamp: Date }>;
};

export type AdminUserDirectory = {
  items: AdminUserRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
};

function sanitizeSearch(search?: string) {
  if (!search) return undefined;
  const trimmed = search.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function buildWhereClause(
  filters: AdminUserFiltersInput,
  tables: {
    user: typeof import("~/db/schema").user;
    memberships: typeof import("~/db/schema").memberships;
    userRoles: typeof import("~/db/schema").userRoles;
    account: typeof import("~/db/schema").account;
  },
  today: Date,
): SQL<unknown> | null {
  const conditions: SQL<unknown>[] = [];
  const todayString = today.toISOString().slice(0, 10);

  if (filters.search) {
    const pattern = `%${filters.search.replace(/[%_]/g, "\\$&")}%`;
    const orFn = or as unknown as (...args: SQL<unknown>[]) => SQL<unknown>;
    conditions.push(
      orFn(ilike(tables.user.name, pattern), ilike(tables.user.email, pattern)),
    );
  }

  if (filters.membershipStatus === "active") {
    conditions.push(
      sql`exists (select 1 from ${tables.memberships} m where m.user_id = ${tables.user.id} and m.status = 'active' and m.end_date >= ${todayString})`,
    );
  } else if (filters.membershipStatus === "expired") {
    conditions.push(
      sql`exists (select 1 from ${tables.memberships} m where m.user_id = ${tables.user.id} and (m.status = 'expired' or m.end_date < ${todayString}))`,
    );
  } else if (filters.membershipStatus === "canceled") {
    conditions.push(
      sql`exists (select 1 from ${tables.memberships} m where m.user_id = ${tables.user.id} and m.status = 'canceled')`,
    );
  } else if (filters.membershipStatus === "none") {
    conditions.push(
      sql`not exists (select 1 from ${tables.memberships} m where m.user_id = ${tables.user.id})`,
    );
  }

  if (filters.roleId) {
    conditions.push(
      sql`exists (select 1 from ${tables.userRoles} ur where ur.user_id = ${tables.user.id} and ur.role_id = ${filters.roleId})`,
    );
  }

  if (filters.requireMfa) {
    conditions.push(
      sql`exists (select 1 from ${tables.account} acc where acc.user_id = ${tables.user.id} and acc.provider_id in ('totp', 'better-auth:totp', 'two-factor'))`,
    );
  }

  if (conditions.length === 0) return null;
  if (conditions.length === 1) return conditions[0];
  const andFn = and as unknown as (...args: SQL<unknown>[]) => SQL<unknown>;
  return andFn(...conditions);
}

interface QueryContext {
  filters: AdminUserFiltersInput;
  page: number;
  pageSize: number;
}

async function fetchAdminDirectory({ filters, page, pageSize }: QueryContext) {
  const [{ getCurrentUser }, { getDb }] = await Promise.all([
    import("~/features/auth/auth.queries"),
    import("~/db/server-helpers"),
  ]);
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      success: false,
      errors: [{ code: "UNAUTHORIZED", message: "User not authenticated" }],
    } satisfies OperationResult<AdminUserDirectoryWire>;
  }

  const { PermissionService } = await import("~/features/roles/permission.service");
  const isAdmin = await PermissionService.isGlobalAdmin(currentUser.id);
  if (!isAdmin) {
    return {
      success: false,
      errors: [{ code: "FORBIDDEN", message: "Admin access required" }],
    } satisfies OperationResult<AdminUserDirectoryWire>;
  }

  const db = await getDb();
  const { user, memberships, membershipTypes, userRoles, roles, session, account } =
    await import("~/db/schema");

  const sanitizedFilters: AdminUserFiltersInput = {
    ...filters,
    search: sanitizeSearch(filters.search),
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const whereClause = buildWhereClause(
    sanitizedFilters,
    { user, memberships, userRoles, account },
    today,
  );

  const countResult = whereClause
    ? await db
        .select({ value: sql<number>`count(*)::int` })
        .from(user)
        .where(whereClause)
    : await db.select({ value: sql<number>`count(*)::int` }).from(user);
  const [countRow] = countResult;
  const totalCount = Number(countRow?.value ?? 0);

  if (totalCount === 0) {
    const empty: AdminUserDirectoryWire = {
      items: [],
      totalCount: 0,
      page,
      pageSize,
    };
    return {
      success: true,
      data: empty,
    } satisfies OperationResult<AdminUserDirectoryWire>;
  }

  const selectBuilder = db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      profileComplete: user.profileComplete,
      createdAt: user.createdAt,
    })
    .from(user);

  const rowsBuilder = whereClause ? selectBuilder.where(whereClause) : selectBuilder;

  const rows = await rowsBuilder
    .orderBy(desc(user.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const userIds = rows.map((row) => row.id);

  const [roleAssignments, membershipRows, sessionRows, accountRows] = await Promise.all([
    userIds.length > 0
      ? db
          .select({
            id: userRoles.id,
            userId: userRoles.userId,
            roleId: userRoles.roleId,
            name: roles.name,
            assignedAt: userRoles.assignedAt,
            expiresAt: userRoles.expiresAt,
            teamId: userRoles.teamId,
            eventId: userRoles.eventId,
          })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(inArray(userRoles.userId, userIds))
      : [],
    userIds.length > 0
      ? db
          .select({
            userId: memberships.userId,
            status: memberships.status,
            endDate: memberships.endDate,
            updatedAt: memberships.updatedAt,
            membershipTypeName: membershipTypes.name,
          })
          .from(memberships)
          .leftJoin(membershipTypes, eq(memberships.membershipTypeId, membershipTypes.id))
          .where(inArray(memberships.userId, userIds))
      : [],
    userIds.length > 0
      ? db
          .select({
            userId: session.userId,
            lastActiveAt: sql<string | null>`max(${session.updatedAt})`,
          })
          .from(session)
          .where(inArray(session.userId, userIds))
          .groupBy(session.userId)
      : [],
    userIds.length > 0
      ? db
          .select({
            userId: account.userId,
            providerId: account.providerId,
          })
          .from(account)
          .where(inArray(account.userId, userIds))
      : [],
  ]);

  type RoleAssignment = (typeof roleAssignments)[number];
  const rolesByUser = new Map<string, RoleAssignment[]>();
  for (const assignment of roleAssignments) {
    const list = rolesByUser.get(assignment.userId) ?? [];
    list.push(assignment);
    rolesByUser.set(assignment.userId, list);
  }

  const membershipByUser = new Map<
    string,
    {
      status: string;
      endDate: Date | null;
      updatedAt: Date | null;
      membershipTypeName: string | null;
    }
  >();
  for (const membership of membershipRows) {
    const existing = membershipByUser.get(membership.userId);
    const endDate = membership.endDate ? new Date(membership.endDate) : null;
    const updatedAt = membership.updatedAt ? new Date(membership.updatedAt) : null;
    if (
      !existing ||
      !existing.updatedAt ||
      (updatedAt && updatedAt > existing.updatedAt)
    ) {
      membershipByUser.set(membership.userId, {
        status: membership.status,
        endDate,
        updatedAt,
        membershipTypeName: membership.membershipTypeName ?? null,
      });
    }
  }

  const sessionByUser = new Map<string, Date | null>();
  for (const sessionRow of sessionRows) {
    sessionByUser.set(
      sessionRow.userId,
      sessionRow.lastActiveAt ? new Date(sessionRow.lastActiveAt) : null,
    );
  }

  const mfaByUser = new Map<string, boolean>();
  for (const row of accountRows) {
    const prev = mfaByUser.get(row.userId) ?? false;
    const isMfaProvider = ["totp", "better-auth:totp", "two-factor"].includes(
      row.providerId ?? "",
    );
    if (isMfaProvider) {
      mfaByUser.set(row.userId, true);
    } else if (!mfaByUser.has(row.userId)) {
      mfaByUser.set(row.userId, prev);
    }
  }

  const personaRoleMap: Record<string, { personaId: string; label: string }> = {
    "Platform Admin": { personaId: "admin", label: "Platform Admin" },
    "Games Admin": { personaId: "admin", label: "Games Admin" },
    "Event Admin": { personaId: "ops", label: "Event Admin" },
    "Team Admin": { personaId: "ops", label: "Team Admin" },
    "Game Master": { personaId: "gm", label: "Game Master" },
    Player: { personaId: "player", label: "Player" },
  };

  const wireItems: AdminUserRecordWire[] = rows.map((row) => {
    const assignments = rolesByUser.get(row.id) ?? [];
    const membership = membershipByUser.get(row.id) ?? null;
    let membershipStatus: AdminMembershipStatus = "none";
    let membershipExpiresAt: string | null = null;
    if (membership) {
      const { status, endDate } = membership;
      if (status === "canceled") {
        membershipStatus = "canceled";
      } else if (status === "expired" || (endDate && endDate < today)) {
        membershipStatus = "expired";
      } else if (status === "active") {
        membershipStatus = "active";
      }
      membershipExpiresAt = endDate ? endDate.toISOString() : null;
    }

    const personaCoverageMap = new Map<string, { personaId: string; label: string }>();
    for (const assignment of assignments) {
      const persona = personaRoleMap[assignment.name];
      if (persona) {
        personaCoverageMap.set(persona.personaId, persona);
      }
    }

    const lastActiveAt = sessionByUser.get(row.id) ?? null;
    const mfaEnrolled = mfaByUser.get(row.id) ?? false;

    const riskFlags: AdminUserRecordWire["riskFlags"] = [];
    if (!row.emailVerified) {
      riskFlags.push({ type: "security", message: "Email not verified" });
    }
    if (!mfaEnrolled) {
      riskFlags.push({ type: "security", message: "MFA not enrolled" });
    }
    if (membershipStatus !== "active") {
      riskFlags.push({ type: "compliance", message: "Membership not active" });
    }

    const latestRole = assignments.reduce<{ label: string; timestamp: Date } | null>(
      (acc, assignment) => {
        const timestamp = assignment.assignedAt ?? null;
        if (!timestamp) return acc;
        const current = { label: `${assignment.name} granted`, timestamp };
        if (!acc || current.timestamp > acc.timestamp) {
          return current;
        }
        return acc;
      },
      null,
    );

    const auditTrail: AdminUserRecordWire["auditTrail"] = [];
    if (latestRole) {
      auditTrail.push({
        label: latestRole.label,
        timestamp: latestRole.timestamp.toISOString(),
      });
    }
    if (membership?.updatedAt) {
      auditTrail.push({
        label: `Membership ${membershipStatus}`,
        timestamp: membership.updatedAt.toISOString(),
      });
    }
    if (lastActiveAt) {
      auditTrail.push({ label: "Last active", timestamp: lastActiveAt.toISOString() });
    }
    auditTrail.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      emailVerified: row.emailVerified,
      profileComplete: row.profileComplete,
      createdAt: row.createdAt.toISOString(),
      lastActiveAt: lastActiveAt ? lastActiveAt.toISOString() : null,
      membershipStatus,
      membershipExpiresAt,
      membershipTypeName: membership?.membershipTypeName ?? null,
      roles: assignments.map((assignment) => ({
        id: assignment.id,
        roleId: assignment.roleId,
        name: assignment.name,
        assignedAt: assignment.assignedAt?.toISOString() ?? new Date().toISOString(),
        expiresAt: assignment.expiresAt ? assignment.expiresAt.toISOString() : null,
        scope: assignment.teamId
          ? `Team ${assignment.teamId}`
          : assignment.eventId
            ? `Event ${assignment.eventId}`
            : null,
      })),
      personaCoverage: Array.from(personaCoverageMap.values()),
      mfaEnrolled,
      riskFlags,
      auditTrail,
    } satisfies AdminUserRecordWire;
  });

  const payload: AdminUserDirectoryWire = {
    items: wireItems,
    totalCount,
    page,
    pageSize,
  };
  return {
    success: true,
    data: payload,
  } satisfies OperationResult<AdminUserDirectoryWire>;
}

export const getAdminUserDirectory = createServerFn({ method: "GET" })
  .validator((input: unknown) => adminUserFiltersSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    try {
      const filters = data ?? {};
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 20;
      return await fetchAdminDirectory({ filters, page, pageSize });
    } catch (error) {
      console.error("getAdminUserDirectory error", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Unable to load user directory" }],
      } satisfies OperationResult<AdminUserDirectoryWire>;
    }
  });

export const exportAdminComplianceReport = createServerFn({
  method: "GET",
  response: "raw",
})
  .validator((input: unknown) => adminUserFiltersSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const filters = data ?? {};
    const result = await fetchAdminDirectory({ filters, page: 1, pageSize: 500 });
    if (!result.success || !result.data) {
      const message = result.errors?.[0]?.message ?? "Unable to export report";
      return new Response(message, { status: 400 });
    }

    const header = [
      "User ID",
      "Name",
      "Email",
      "Membership Status",
      "Membership Expires",
      "Roles",
      "Last Active",
      "MFA Enrolled",
      "Risk Flags",
    ];

    const rows = result.data.items.map((item) => [
      item.id,
      item.name,
      item.email,
      item.membershipStatus,
      item.membershipExpiresAt ?? "",
      item.roles.map((role) => role.name).join("; "),
      item.lastActiveAt ?? "",
      item.mfaEnrolled ? "yes" : "no",
      item.riskFlags.map((flag) => `${flag.type}:${flag.message}`).join("; "),
    ]);

    const csv = [header, ...rows]
      .map((line) =>
        line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename=platform-compliance-${new Date()
          .toISOString()
          .slice(0, 10)}.csv`,
      },
    });
  });

function deserializeDirectory(data: AdminUserDirectoryWire): AdminUserDirectory {
  return {
    page: data.page,
    pageSize: data.pageSize,
    totalCount: data.totalCount,
    items: data.items.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      lastActiveAt: item.lastActiveAt ? new Date(item.lastActiveAt) : null,
      membershipExpiresAt: item.membershipExpiresAt
        ? new Date(item.membershipExpiresAt)
        : null,
      roles: item.roles.map((role) => ({
        ...role,
        assignedAt: new Date(role.assignedAt),
        expiresAt: role.expiresAt ? new Date(role.expiresAt) : null,
      })),
      auditTrail: item.auditTrail.map((entry) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      })),
    })),
  };
}

export function useAdminUserDirectory(filters: AdminUserFiltersInput = {}) {
  return useQuery<AdminUserDirectory, Error>({
    queryKey: ["admin", "users", filters],
    queryFn: async () => {
      const result = await getAdminUserDirectory({ data: filters });
      if (!result.success || !result.data) {
        throw new Error(result.errors?.[0]?.message ?? "Unable to load user directory");
      }
      return deserializeDirectory(result.data);
    },
    staleTime: 60_000,
  });
}

export function useExportComplianceReport() {
  return useMutation({
    mutationFn: async (filters: AdminUserFiltersInput = {}) => {
      const response = await exportAdminComplianceReport({ data: filters });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to export compliance report");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      return url;
    },
  });
}

export type { AdminMembershipStatus, AdminUserFiltersInput };
