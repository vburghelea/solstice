import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import { listMembersSchema } from "./members.schemas";
import type {
  MemberDirectoryMember,
  MemberDirectoryMembershipSummary,
  MemberDirectoryOperationResult,
  MemberDirectoryResponse,
} from "./members.types";

type PrivacySettings = import("~/features/profile/profile.types").PrivacySettings;
type SQLExpression = import("drizzle-orm").SQL<unknown>;

type ListMembersResult = MemberDirectoryOperationResult<MemberDirectoryResponse>;

type MembershipAccumulator = {
  id: string;
  status: "active" | "expired" | "cancelled";
  membershipType: string | null;
  startDate: Date | null;
  endDate: Date | null;
};

type MemberAccumulator = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  pronouns: string | null;
  dateOfBirth: Date | null;
  privacySettings: string | null;
  profileUpdatedAt: Date | null;
  teams: Set<string>;
  memberships: Map<string, MembershipAccumulator>;
};

function escapeSearchTerm(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

function parsePrivacySettings(
  value: string | null,
  fallback: PrivacySettings,
): PrivacySettings {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as Partial<PrivacySettings>;
    return {
      showEmail: parsed.showEmail ?? fallback.showEmail,
      showPhone: parsed.showPhone ?? fallback.showPhone,
      showBirthYear: parsed.showBirthYear ?? fallback.showBirthYear,
      allowTeamInvitations: parsed.allowTeamInvitations ?? fallback.allowTeamInvitations,
    };
  } catch (error) {
    console.warn("Failed to parse privacy settings", error);
    return fallback;
  }
}

export const listMembers = createServerFn({ method: "POST" })
  .inputValidator(zod$(listMembersSchema))
  .handler(async ({ data }): Promise<ListMembersResult> => {
    try {
      const searchTerm = data.search?.trim();
      const limit = Math.min(100, Math.max(1, data.limit ?? 50));
      const offset = Math.max(0, data.offset ?? 0);

      const [{ getDb }, { getCurrentUser }] = await Promise.all([
        import("~/db/server-helpers"),
        import("~/features/auth/auth.queries"),
      ]);

      const [db, currentUser] = await Promise.all([getDb(), getCurrentUser()]);

      if (!currentUser) {
        return {
          success: false,
          errors: [
            {
              code: "NOT_AUTHENTICATED",
              message: "User not authenticated",
            },
          ],
        };
      }

      const { user, teamMembers, teams, memberships, membershipTypes } = await import(
        "~/db/schema"
      );
      const { defaultPrivacySettings } = await import("~/features/profile/profile.types");
      const { and, eq, inArray, sql } = await import("drizzle-orm");

      const conditions: SQLExpression[] = [];

      if (searchTerm) {
        const pattern = `%${escapeSearchTerm(searchTerm)}%`;
        conditions.push(
          sql`(
            ${user.name} ILIKE ${pattern} OR
            ${user.email} ILIKE ${pattern} OR
            ${user.phone} ILIKE ${pattern} OR
            ${teams.name} ILIKE ${pattern}
          )`,
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const baseQuery = db
        .select({ userId: user.id })
        .from(user)
        .leftJoin(teamMembers, eq(teamMembers.userId, user.id))
        .leftJoin(teams, eq(teamMembers.teamId, teams.id));

      const filteredBaseQuery = whereClause ? baseQuery.where(whereClause) : baseQuery;

      const userIdRows = await filteredBaseQuery
        .groupBy(user.id)
        .orderBy(sql`LOWER(${user.name})`)
        .limit(limit)
        .offset(offset);
      const userIds = userIdRows.map((row) => row.userId);

      const totalQuery = db
        .select({ count: sql<number>`COUNT(DISTINCT ${user.id})::int` })
        .from(user)
        .leftJoin(teamMembers, eq(teamMembers.userId, user.id))
        .leftJoin(teams, eq(teamMembers.teamId, teams.id));

      const filteredTotalQuery = whereClause ? totalQuery.where(whereClause) : totalQuery;

      const totalResult = await filteredTotalQuery;
      const total = totalResult[0]?.count ?? 0;

      if (userIds.length === 0) {
        return {
          success: true,
          data: {
            members: [],
            pagination: {
              total,
              limit,
              offset,
              hasMore: false,
            },
          },
        };
      }

      const detailRows = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          pronouns: user.pronouns,
          dateOfBirth: user.dateOfBirth,
          privacySettings: user.privacySettings,
          profileUpdatedAt: user.profileUpdatedAt,
          teamId: teamMembers.teamId,
          teamName: teams.name,
          teamStatus: teamMembers.status,
          membershipId: memberships.id,
          membershipStatus: memberships.status,
          membershipStartDate: memberships.startDate,
          membershipEndDate: memberships.endDate,
          membershipTypeName: membershipTypes.name,
        })
        .from(user)
        .leftJoin(teamMembers, eq(teamMembers.userId, user.id))
        .leftJoin(teams, eq(teamMembers.teamId, teams.id))
        .leftJoin(memberships, eq(memberships.userId, user.id))
        .leftJoin(membershipTypes, eq(membershipTypes.id, memberships.membershipTypeId))
        .where(inArray(user.id, userIds));

      const memberAccumulator = new Map<string, MemberAccumulator>();

      for (const row of detailRows) {
        let accumulator = memberAccumulator.get(row.id);

        if (!accumulator) {
          const dateOfBirth = row.dateOfBirth
            ? row.dateOfBirth instanceof Date
              ? row.dateOfBirth
              : new Date(row.dateOfBirth)
            : null;
          const profileUpdatedAt = row.profileUpdatedAt
            ? row.profileUpdatedAt instanceof Date
              ? row.profileUpdatedAt
              : new Date(row.profileUpdatedAt)
            : null;

          accumulator = {
            id: row.id,
            name: row.name || "Unknown",
            email: row.email ?? null,
            phone: row.phone ?? null,
            pronouns: row.pronouns ?? null,
            dateOfBirth,
            privacySettings: row.privacySettings ?? null,
            profileUpdatedAt,
            teams: new Set<string>(),
            memberships: new Map<string, MembershipAccumulator>(),
          };

          memberAccumulator.set(row.id, accumulator);
        }

        if (row.teamName && row.teamStatus === "active") {
          accumulator.teams.add(row.teamName);
        }

        if (row.membershipId) {
          const existingMembership = accumulator.memberships.get(row.membershipId);

          if (!existingMembership) {
            const startDate = row.membershipStartDate
              ? new Date(row.membershipStartDate)
              : null;
            const endDate = row.membershipEndDate
              ? new Date(row.membershipEndDate)
              : null;

            accumulator.memberships.set(row.membershipId, {
              id: row.membershipId,
              status: (row.membershipStatus ??
                "expired") as MembershipAccumulator["status"],
              membershipType: row.membershipTypeName ?? null,
              startDate,
              endDate,
            });
          }
        }
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const members: MemberDirectoryMember[] = [];

      for (const memberId of userIds) {
        const accumulator = memberAccumulator.get(memberId);

        if (!accumulator) {
          continue;
        }

        const privacy = parsePrivacySettings(
          accumulator.privacySettings,
          defaultPrivacySettings,
        );

        const isSelf = memberId === currentUser.id;
        const showEmail = privacy.showEmail || isSelf;
        const showPhone = privacy.showPhone || isSelf;
        const showBirthYear = privacy.showBirthYear || isSelf;

        const membershipList = Array.from(accumulator.memberships.values()).sort(
          (a, b) => {
            const aTime = a.endDate ? a.endDate.getTime() : 0;
            const bTime = b.endDate ? b.endDate.getTime() : 0;
            return bTime - aTime;
          },
        );

        const activeMembership = membershipList.find(
          (membership) =>
            membership.status === "active" &&
            membership.endDate !== null &&
            membership.endDate.getTime() >= today.getTime(),
        );

        const latestMembership = membershipList[0];

        const membershipStatus = activeMembership
          ? "active"
          : latestMembership
            ? latestMembership.status
            : "none";

        const membershipType = activeMembership
          ? activeMembership.membershipType
          : (latestMembership?.membershipType ?? null);

        const membershipEndDate = activeMembership?.endDate
          ? activeMembership.endDate.toISOString()
          : latestMembership?.endDate
            ? latestMembership.endDate.toISOString()
            : null;

        const membershipHistory: MemberDirectoryMembershipSummary[] = membershipList.map(
          (membership) => ({
            status: membership.status,
            membershipType: membership.membershipType,
            startDate: membership.startDate ? membership.startDate.toISOString() : null,
            endDate: membership.endDate ? membership.endDate.toISOString() : null,
          }),
        );

        const birthDate = accumulator.dateOfBirth;

        members.push({
          id: accumulator.id,
          name: accumulator.name,
          email: showEmail ? accumulator.email : null,
          emailVisible: Boolean(showEmail && accumulator.email),
          phone: showPhone ? accumulator.phone : null,
          phoneVisible: Boolean(showPhone && accumulator.phone),
          pronouns: accumulator.pronouns,
          teams: Array.from(accumulator.teams).sort((a, b) => a.localeCompare(b)),
          membershipStatus,
          membershipType,
          membershipEndDate,
          hasActiveMembership: membershipStatus === "active",
          allowTeamInvitations: privacy.allowTeamInvitations,
          birthYear: showBirthYear && birthDate ? birthDate.getUTCFullYear() : null,
          birthYearVisible: showBirthYear && Boolean(birthDate),
          profileUpdatedAt: accumulator.profileUpdatedAt
            ? accumulator.profileUpdatedAt.toISOString()
            : null,
          membershipHistory,
        });
      }

      return {
        success: true,
        data: {
          members,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + members.length < total,
          },
        },
      };
    } catch (error) {
      console.error("Error listing members:", error);
      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to fetch members",
          },
        ],
      };
    }
  });
