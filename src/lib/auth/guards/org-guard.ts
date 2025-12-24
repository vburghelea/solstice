import { forbidden, unauthorized } from "~/lib/server/errors";

export type OrganizationRole = "owner" | "admin" | "reporter" | "viewer" | "member";

export const ORG_ADMIN_ROLES: OrganizationRole[] = ["owner", "admin"];

type MembershipLookup = {
  userId: string;
  organizationId: string;
};

export async function getOrganizationMembership({
  userId,
  organizationId,
}: MembershipLookup) {
  const { getDb } = await import("~/db/server-helpers");
  const { organizationMembers } = await import("~/db/schema");
  const { and, eq } = await import("drizzle-orm");

  const db = await getDb();
  const [membership] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId),
      ),
    )
    .limit(1);

  return membership ?? null;
}

export async function requireOrganizationMembership(
  { userId, organizationId }: MembershipLookup,
  options?: { roles?: OrganizationRole[]; allowPending?: boolean },
) {
  if (!userId) {
    throw unauthorized("User not authenticated");
  }

  const membership = await getOrganizationMembership({ userId, organizationId });

  if (!membership) {
    throw forbidden("Organization membership required");
  }

  if (!options?.allowPending && membership.status !== "active") {
    throw forbidden("Organization membership is not active");
  }

  if (options?.roles && !options.roles.includes(membership.role as OrganizationRole)) {
    throw forbidden("Insufficient organization role");
  }

  return membership;
}
