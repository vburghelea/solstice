import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { accountLockStatusSchema } from "./security.schemas";

const getSessionUserId = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });
  return session?.user?.id ?? null;
};

const listSecurityEventsSchema = z
  .object({
    userId: z.string().optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

export const listSecurityEvents = createServerFn({ method: "GET" })
  .inputValidator(zod$(listSecurityEventsSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_admin_security");
    const sessionUserId = await getSessionUserId();
    const { unauthorized, forbidden } = await import("~/lib/server/errors");
    if (!sessionUserId) {
      throw unauthorized("User not authenticated");
    }

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(sessionUserId);

    const { getRequest } = await import("@tanstack/react-start/server");
    const organizationId = getRequest().headers.get("x-organization-id");

    const { getDb } = await import("~/db/server-helpers");
    const { organizationMembers, securityEvents } = await import("~/db/schema");
    const { and, desc, eq, inArray } = await import("drizzle-orm");

    const db = await getDb();

    // If requesting a specific user's events:
    if (data.userId) {
      // self-access OK
      if (data.userId !== sessionUserId && !isGlobalAdmin) {
        if (!organizationId) {
          throw forbidden("Organization context required");
        }

        const { requireOrganizationMembership, ORG_ADMIN_ROLES } =
          await import("~/lib/auth/guards/org-guard");
        // requester must be org admin
        await requireOrganizationMembership(
          { userId: sessionUserId, organizationId },
          { roles: ORG_ADMIN_ROLES },
        );
        // target must be member of same org
        await requireOrganizationMembership({ userId: data.userId, organizationId });
      }

      return db
        .select()
        .from(securityEvents)
        .where(eq(securityEvents.userId, data.userId))
        .orderBy(desc(securityEvents.createdAt));
    }

    // Listing across users:
    if (isGlobalAdmin) {
      return db.select().from(securityEvents).orderBy(desc(securityEvents.createdAt));
    }

    // Org-scoped list requires org context + org admin
    if (!organizationId) {
      throw forbidden("Organization context required");
    }

    const { requireOrganizationMembership, ORG_ADMIN_ROLES } =
      await import("~/lib/auth/guards/org-guard");
    await requireOrganizationMembership(
      { userId: sessionUserId, organizationId },
      { roles: ORG_ADMIN_ROLES },
    );

    const memberRows = await db
      .select({ userId: organizationMembers.userId })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.status, "active"),
        ),
      );
    const memberUserIds = memberRows.map((row) => row.userId);
    if (memberUserIds.length === 0) return [];

    return db
      .select()
      .from(securityEvents)
      .where(inArray(securityEvents.userId, memberUserIds))
      .orderBy(desc(securityEvents.createdAt));
  });

export const listAccountLocks = createServerFn({ method: "GET" }).handler(async () => {
  await assertFeatureEnabled("sin_admin_security");
  const sessionUserId = await getSessionUserId();
  const { unauthorized, forbidden } = await import("~/lib/server/errors");
  if (!sessionUserId) {
    throw unauthorized("User not authenticated");
  }

  const { PermissionService } = await import("~/features/roles/permission.service");
  const isGlobalAdmin = await PermissionService.isGlobalAdmin(sessionUserId);

  const { getDb } = await import("~/db/server-helpers");
  const { accountLocks, organizationMembers } = await import("~/db/schema");
  const { and, desc, eq, inArray } = await import("drizzle-orm");

  const db = await getDb();
  if (isGlobalAdmin) {
    return db.select().from(accountLocks).orderBy(desc(accountLocks.lockedAt));
  }

  const { getRequest } = await import("@tanstack/react-start/server");
  const organizationId = getRequest().headers.get("x-organization-id");
  if (!organizationId) {
    throw forbidden("Organization context required");
  }

  const { requireOrganizationMembership, ORG_ADMIN_ROLES } =
    await import("~/lib/auth/guards/org-guard");
  await requireOrganizationMembership(
    { userId: sessionUserId, organizationId },
    { roles: ORG_ADMIN_ROLES },
  );

  const memberRows = await db
    .select({ userId: organizationMembers.userId })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.status, "active"),
      ),
    );
  const memberUserIds = memberRows.map((row) => row.userId);
  if (memberUserIds.length === 0) return [];

  return db
    .select()
    .from(accountLocks)
    .where(inArray(accountLocks.userId, memberUserIds))
    .orderBy(desc(accountLocks.lockedAt));
});

export const getAccountLockStatus = createServerFn({ method: "GET" })
  .inputValidator(zod$(accountLockStatusSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("security_core");
    const sessionUserId = await getSessionUserId();
    const { unauthorized, forbidden } = await import("~/lib/server/errors");
    if (!sessionUserId) {
      throw unauthorized("User not authenticated");
    }

    if (data.userId !== sessionUserId) {
      const { PermissionService } = await import("~/features/roles/permission.service");
      const isGlobalAdmin = await PermissionService.isGlobalAdmin(sessionUserId);

      if (!isGlobalAdmin) {
        const { getRequest } = await import("@tanstack/react-start/server");
        const organizationId = getRequest().headers.get("x-organization-id");
        if (!organizationId) {
          throw forbidden("Organization context required");
        }

        const { requireOrganizationMembership, ORG_ADMIN_ROLES } =
          await import("~/lib/auth/guards/org-guard");
        await requireOrganizationMembership(
          { userId: sessionUserId, organizationId },
          { roles: ORG_ADMIN_ROLES },
        );
        await requireOrganizationMembership({ userId: data.userId, organizationId });
      }
    }

    const { isAccountLocked } = await import("~/lib/security/lockout");
    return isAccountLocked(data.userId);
  });
