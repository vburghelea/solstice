import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import {
  approveOrganizationMemberSchema,
  createDelegatedAccessSchema,
  createOrganizationSchema,
  inviteOrganizationMemberSchema,
  removeOrganizationMemberSchema,
  revokeDelegatedAccessSchema,
  updateOrganizationMemberRoleSchema,
  updateOrganizationSchema,
} from "./organizations.schemas";
import type {
  DelegatedAccessRow,
  OrganizationMemberRow,
  OrganizationOperationErrorCode,
  OrganizationOperationResult,
  OrganizationSummary,
} from "./organizations.types";

const errorResult = (code: OrganizationOperationErrorCode, message: string) => ({
  success: false,
  errors: [{ code, message }],
});

const getSessionUser = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });
  return session?.user ?? null;
};

export const createOrganization = createServerFn({ method: "POST" })
  .inputValidator(zod$(createOrganizationSchema))
  .handler(
    async ({ data }): Promise<OrganizationOperationResult<OrganizationSummary>> => {
      const sessionUser = await getSessionUser();
      if (!sessionUser?.id) {
        return errorResult("UNAUTHORIZED", "User not authenticated");
      }

      try {
        const { getDb } = await import("~/db/server-helpers");
        const { organizationMembers, organizations } = await import("~/db/schema");

        const db = await getDb();
        const [organization] = await db.transaction(async (tx) => {
          const [org] = await tx
            .insert(organizations)
            .values({
              name: data.name,
              slug: data.slug,
              type: data.type,
              parentOrgId: data.parentOrgId ?? null,
              settings: data.settings ?? {},
              metadata: data.metadata ?? {},
            })
            .returning();

          if (!org) return [];

          await tx.insert(organizationMembers).values({
            userId: sessionUser.id,
            organizationId: org.id,
            role: "owner",
            status: "active",
            approvedBy: sessionUser.id,
            approvedAt: new Date(),
          });

          return [org];
        });

        if (!organization) {
          return errorResult("DATABASE_ERROR", "Failed to create organization");
        }

        const { logAdminAction } = await import("~/lib/audit");
        await logAdminAction({
          action: "ORG_CREATE",
          actorUserId: sessionUser.id,
          actorOrgId: organization.id,
          targetType: "organization",
          targetId: organization.id,
          targetOrgId: organization.id,
          changes: { name: { new: organization.name } },
          metadata: { slug: organization.slug },
        });

        return {
          success: true,
          data: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            type: organization.type,
            status: organization.status,
            parentOrgId: organization.parentOrgId,
            createdAt: organization.createdAt,
            updatedAt: organization.updatedAt,
          },
        };
      } catch (error) {
        console.error("Failed to create organization", error);
        return errorResult("DATABASE_ERROR", "Failed to create organization");
      }
    },
  );

export const updateOrganization = createServerFn({ method: "POST" })
  .inputValidator(zod$(updateOrganizationSchema))
  .handler(
    async ({ data }): Promise<OrganizationOperationResult<OrganizationSummary>> => {
      const sessionUser = await getSessionUser();
      if (!sessionUser?.id) {
        return errorResult("UNAUTHORIZED", "User not authenticated");
      }

      const { requireOrganizationMembership, ORG_ADMIN_ROLES } =
        await import("~/lib/auth/guards/org-guard");
      await requireOrganizationMembership(
        { userId: sessionUser.id, organizationId: data.organizationId },
        { roles: ORG_ADMIN_ROLES },
      );

      try {
        const { getDb } = await import("~/db/server-helpers");
        const { organizations } = await import("~/db/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        const [existing] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, data.organizationId))
          .limit(1);

        if (!existing) {
          return errorResult("NOT_FOUND", "Organization not found");
        }

        const [updated] = await db
          .update(organizations)
          .set({
            name: data.data.name,
            slug: data.data.slug,
            type: data.data.type,
            parentOrgId: data.data.parentOrgId ?? null,
            status: data.data.status,
            settings: data.data.settings,
            metadata: data.data.metadata,
          })
          .where(eq(organizations.id, data.organizationId))
          .returning();

        if (!updated) {
          return errorResult("NOT_FOUND", "Organization not found");
        }

        const changeEntries = Object.entries(data.data).filter(
          ([, value]) => value !== undefined,
        );
        const { createAuditDiff, logAdminAction } = await import("~/lib/audit");
        const changes =
          changeEntries.length > 0
            ? await createAuditDiff(
                Object.fromEntries(
                  changeEntries.map(([key]) => [
                    key,
                    existing[key as keyof typeof existing],
                  ]),
                ),
                Object.fromEntries(
                  changeEntries.map(([key]) => [
                    key,
                    updated[key as keyof typeof updated],
                  ]),
                ),
              )
            : null;
        await logAdminAction({
          action: "ORG_UPDATE",
          actorUserId: sessionUser.id,
          actorOrgId: updated.id,
          targetType: "organization",
          targetId: updated.id,
          targetOrgId: updated.id,
          changes,
        });

        return {
          success: true,
          data: {
            id: updated.id,
            name: updated.name,
            slug: updated.slug,
            type: updated.type,
            status: updated.status,
            parentOrgId: updated.parentOrgId,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
          },
        };
      } catch (error) {
        console.error("Failed to update organization", error);
        return errorResult("DATABASE_ERROR", "Failed to update organization");
      }
    },
  );

export const inviteOrganizationMember = createServerFn({ method: "POST" })
  .inputValidator(zod$(inviteOrganizationMemberSchema))
  .handler(
    async ({ data }): Promise<OrganizationOperationResult<OrganizationMemberRow>> => {
      const sessionUser = await getSessionUser();
      if (!sessionUser?.id) {
        return errorResult("UNAUTHORIZED", "User not authenticated");
      }

      const { requireOrganizationMembership, ORG_ADMIN_ROLES } =
        await import("~/lib/auth/guards/org-guard");
      await requireOrganizationMembership(
        { userId: sessionUser.id, organizationId: data.organizationId },
        { roles: ORG_ADMIN_ROLES },
      );

      try {
        const { getDb } = await import("~/db/server-helpers");
        const { organizationMembers, user } = await import("~/db/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        const [targetUser] = await db
          .select({ id: user.id, email: user.email, name: user.name })
          .from(user)
          .where(eq(user.email, data.email.toLowerCase()))
          .limit(1);

        if (!targetUser) {
          return errorResult("NOT_FOUND", "User not found");
        }

        const [membership] = await db
          .insert(organizationMembers)
          .values({
            userId: targetUser.id,
            organizationId: data.organizationId,
            role: data.role,
            status: "pending",
            invitedBy: sessionUser.id,
            invitedAt: new Date(),
          })
          .returning();

        if (!membership) {
          return errorResult("DATABASE_ERROR", "Failed to invite member");
        }

        const { logAdminAction } = await import("~/lib/audit");
        await logAdminAction({
          action: "ORG_MEMBER_INVITE",
          actorUserId: sessionUser.id,
          actorOrgId: data.organizationId,
          targetType: "organization_member",
          targetId: membership.id,
          targetOrgId: data.organizationId,
          metadata: { invitedUserId: targetUser.id, role: data.role },
        });

        return {
          success: true,
          data: {
            id: membership.id,
            organizationId: membership.organizationId,
            userId: targetUser.id,
            userName: targetUser.name,
            userEmail: targetUser.email,
            role: membership.role,
            status: membership.status,
            invitedBy: membership.invitedBy,
            invitedAt: membership.invitedAt,
            approvedBy: membership.approvedBy,
            approvedAt: membership.approvedAt,
            createdAt: membership.createdAt,
            updatedAt: membership.updatedAt,
          },
        };
      } catch (error) {
        console.error("Failed to invite organization member", error);
        return errorResult("DATABASE_ERROR", "Failed to invite member");
      }
    },
  );

export const approveOrganizationMember = createServerFn({ method: "POST" })
  .inputValidator(zod$(approveOrganizationMemberSchema))
  .handler(
    async ({ data }): Promise<OrganizationOperationResult<OrganizationMemberRow>> => {
      const sessionUser = await getSessionUser();
      if (!sessionUser?.id) {
        return errorResult("UNAUTHORIZED", "User not authenticated");
      }

      try {
        const { getDb } = await import("~/db/server-helpers");
        const { organizationMembers, user } = await import("~/db/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        const [membership] = await db
          .select()
          .from(organizationMembers)
          .where(eq(organizationMembers.id, data.membershipId))
          .limit(1);

        if (!membership) {
          return errorResult("NOT_FOUND", "Membership not found");
        }

        const { requireOrganizationMembership, ORG_ADMIN_ROLES } =
          await import("~/lib/auth/guards/org-guard");
        await requireOrganizationMembership(
          { userId: sessionUser.id, organizationId: membership.organizationId },
          { roles: ORG_ADMIN_ROLES },
        );

        const [updated] = await db
          .update(organizationMembers)
          .set({
            status: "active",
            approvedBy: sessionUser.id,
            approvedAt: new Date(),
          })
          .where(eq(organizationMembers.id, data.membershipId))
          .returning();

        if (!updated) {
          return errorResult("DATABASE_ERROR", "Failed to approve member");
        }

        const [memberUser] = await db
          .select({ id: user.id, email: user.email, name: user.name })
          .from(user)
          .where(eq(user.id, updated.userId))
          .limit(1);

        const { logAdminAction } = await import("~/lib/audit");
        await logAdminAction({
          action: "ORG_MEMBER_APPROVE",
          actorUserId: sessionUser.id,
          actorOrgId: updated.organizationId,
          targetType: "organization_member",
          targetId: updated.id,
          targetOrgId: updated.organizationId,
          metadata: { approvedUserId: updated.userId },
        });

        return {
          success: true,
          data: {
            id: updated.id,
            organizationId: updated.organizationId,
            userId: updated.userId,
            userName: memberUser?.name ?? null,
            userEmail: memberUser?.email ?? "",
            role: updated.role,
            status: updated.status,
            invitedBy: updated.invitedBy,
            invitedAt: updated.invitedAt,
            approvedBy: updated.approvedBy,
            approvedAt: updated.approvedAt,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
          },
        };
      } catch (error) {
        console.error("Failed to approve organization member", error);
        return errorResult("DATABASE_ERROR", "Failed to approve member");
      }
    },
  );

export const updateOrganizationMemberRole = createServerFn({ method: "POST" })
  .inputValidator(zod$(updateOrganizationMemberRoleSchema))
  .handler(
    async ({ data }): Promise<OrganizationOperationResult<OrganizationMemberRow>> => {
      const sessionUser = await getSessionUser();
      if (!sessionUser?.id) {
        return errorResult("UNAUTHORIZED", "User not authenticated");
      }

      try {
        const { getDb } = await import("~/db/server-helpers");
        const { organizationMembers, user } = await import("~/db/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        const [membership] = await db
          .select()
          .from(organizationMembers)
          .where(eq(organizationMembers.id, data.membershipId))
          .limit(1);

        if (!membership) {
          return errorResult("NOT_FOUND", "Membership not found");
        }

        const { requireOrganizationMembership, ORG_ADMIN_ROLES } =
          await import("~/lib/auth/guards/org-guard");
        await requireOrganizationMembership(
          { userId: sessionUser.id, organizationId: membership.organizationId },
          { roles: ORG_ADMIN_ROLES },
        );

        const [updated] = await db
          .update(organizationMembers)
          .set({ role: data.role })
          .where(eq(organizationMembers.id, data.membershipId))
          .returning();

        if (!updated) {
          return errorResult("DATABASE_ERROR", "Failed to update member");
        }

        const [memberUser] = await db
          .select({ id: user.id, email: user.email, name: user.name })
          .from(user)
          .where(eq(user.id, updated.userId))
          .limit(1);

        const { logAdminAction } = await import("~/lib/audit");
        await logAdminAction({
          action: "ORG_MEMBER_ROLE_UPDATE",
          actorUserId: sessionUser.id,
          actorOrgId: updated.organizationId,
          targetType: "organization_member",
          targetId: updated.id,
          targetOrgId: updated.organizationId,
          changes: { role: { new: updated.role } },
        });

        return {
          success: true,
          data: {
            id: updated.id,
            organizationId: updated.organizationId,
            userId: updated.userId,
            userName: memberUser?.name ?? null,
            userEmail: memberUser?.email ?? "",
            role: updated.role,
            status: updated.status,
            invitedBy: updated.invitedBy,
            invitedAt: updated.invitedAt,
            approvedBy: updated.approvedBy,
            approvedAt: updated.approvedAt,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
          },
        };
      } catch (error) {
        console.error("Failed to update organization member role", error);
        return errorResult("DATABASE_ERROR", "Failed to update member");
      }
    },
  );

export const removeOrganizationMember = createServerFn({ method: "POST" })
  .inputValidator(zod$(removeOrganizationMemberSchema))
  .handler(
    async ({ data }): Promise<OrganizationOperationResult<OrganizationMemberRow>> => {
      const sessionUser = await getSessionUser();
      if (!sessionUser?.id) {
        return errorResult("UNAUTHORIZED", "User not authenticated");
      }

      try {
        const { getDb } = await import("~/db/server-helpers");
        const { organizationMembers, user } = await import("~/db/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        const [membership] = await db
          .select()
          .from(organizationMembers)
          .where(eq(organizationMembers.id, data.membershipId))
          .limit(1);

        if (!membership) {
          return errorResult("NOT_FOUND", "Membership not found");
        }

        const { requireOrganizationMembership, ORG_ADMIN_ROLES } =
          await import("~/lib/auth/guards/org-guard");
        await requireOrganizationMembership(
          { userId: sessionUser.id, organizationId: membership.organizationId },
          { roles: ORG_ADMIN_ROLES },
        );

        const [updated] = await db
          .update(organizationMembers)
          .set({ status: "removed" })
          .where(eq(organizationMembers.id, data.membershipId))
          .returning();

        if (!updated) {
          return errorResult("DATABASE_ERROR", "Failed to remove member");
        }

        const [memberUser] = await db
          .select({ id: user.id, email: user.email, name: user.name })
          .from(user)
          .where(eq(user.id, updated.userId))
          .limit(1);

        const { logAdminAction } = await import("~/lib/audit");
        await logAdminAction({
          action: "ORG_MEMBER_REMOVE",
          actorUserId: sessionUser.id,
          actorOrgId: updated.organizationId,
          targetType: "organization_member",
          targetId: updated.id,
          targetOrgId: updated.organizationId,
          metadata: { removedUserId: updated.userId },
        });

        return {
          success: true,
          data: {
            id: updated.id,
            organizationId: updated.organizationId,
            userId: updated.userId,
            userName: memberUser?.name ?? null,
            userEmail: memberUser?.email ?? "",
            role: updated.role,
            status: updated.status,
            invitedBy: updated.invitedBy,
            invitedAt: updated.invitedAt,
            approvedBy: updated.approvedBy,
            approvedAt: updated.approvedAt,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
          },
        };
      } catch (error) {
        console.error("Failed to remove organization member", error);
        return errorResult("DATABASE_ERROR", "Failed to remove member");
      }
    },
  );

export const createDelegatedAccess = createServerFn({ method: "POST" })
  .inputValidator(zod$(createDelegatedAccessSchema))
  .handler(async ({ data }): Promise<OrganizationOperationResult<DelegatedAccessRow>> => {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) {
      return errorResult("UNAUTHORIZED", "User not authenticated");
    }

    const { requireOrganizationMembership, ORG_ADMIN_ROLES } =
      await import("~/lib/auth/guards/org-guard");
    await requireOrganizationMembership(
      { userId: sessionUser.id, organizationId: data.organizationId },
      { roles: ORG_ADMIN_ROLES },
    );

    try {
      const { getDb } = await import("~/db/server-helpers");
      const { delegatedAccess, user } = await import("~/db/schema");
      const { eq } = await import("drizzle-orm");

      const db = await getDb();
      const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

      const [access] = await db
        .insert(delegatedAccess)
        .values({
          organizationId: data.organizationId,
          delegateUserId: data.delegateUserId,
          scope: data.scope,
          grantedBy: sessionUser.id,
          expiresAt,
          notes: data.notes ?? null,
        })
        .returning();

      if (!access) {
        return errorResult("DATABASE_ERROR", "Failed to grant delegated access");
      }

      const [delegateUser] = await db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, access.delegateUserId))
        .limit(1);

      const { logAdminAction } = await import("~/lib/audit");
      await logAdminAction({
        action: "ORG_DELEGATED_ACCESS_GRANT",
        actorUserId: sessionUser.id,
        actorOrgId: access.organizationId,
        targetType: "delegated_access",
        targetId: access.id,
        targetOrgId: access.organizationId,
        metadata: { delegateUserId: access.delegateUserId, scope: access.scope },
      });

      return {
        success: true,
        data: {
          id: access.id,
          organizationId: access.organizationId,
          delegateUserId: access.delegateUserId,
          delegateEmail: delegateUser?.email ?? null,
          scope: access.scope,
          grantedBy: access.grantedBy,
          grantedAt: access.grantedAt,
          expiresAt: access.expiresAt,
          revokedAt: access.revokedAt,
          revokedBy: access.revokedBy,
          notes: access.notes,
        },
      };
    } catch (error) {
      console.error("Failed to grant delegated access", error);
      return errorResult("DATABASE_ERROR", "Failed to grant delegated access");
    }
  });

export const revokeDelegatedAccess = createServerFn({ method: "POST" })
  .inputValidator(zod$(revokeDelegatedAccessSchema))
  .handler(async ({ data }): Promise<OrganizationOperationResult<DelegatedAccessRow>> => {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) {
      return errorResult("UNAUTHORIZED", "User not authenticated");
    }

    try {
      const { getDb } = await import("~/db/server-helpers");
      const { delegatedAccess, user } = await import("~/db/schema");
      const { eq } = await import("drizzle-orm");

      const db = await getDb();
      const [access] = await db
        .select()
        .from(delegatedAccess)
        .where(eq(delegatedAccess.id, data.accessId))
        .limit(1);

      if (!access) {
        return errorResult("NOT_FOUND", "Delegated access not found");
      }

      const { requireOrganizationMembership, ORG_ADMIN_ROLES } =
        await import("~/lib/auth/guards/org-guard");
      await requireOrganizationMembership(
        { userId: sessionUser.id, organizationId: access.organizationId },
        { roles: ORG_ADMIN_ROLES },
      );

      const [updated] = await db
        .update(delegatedAccess)
        .set({
          revokedAt: new Date(),
          revokedBy: sessionUser.id,
          notes: data.notes ?? access.notes,
        })
        .where(eq(delegatedAccess.id, data.accessId))
        .returning();

      if (!updated) {
        return errorResult("DATABASE_ERROR", "Failed to revoke access");
      }

      const [delegateUser] = await db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, updated.delegateUserId))
        .limit(1);

      const { logAdminAction } = await import("~/lib/audit");
      await logAdminAction({
        action: "ORG_DELEGATED_ACCESS_REVOKE",
        actorUserId: sessionUser.id,
        actorOrgId: updated.organizationId,
        targetType: "delegated_access",
        targetId: updated.id,
        targetOrgId: updated.organizationId,
        metadata: { delegateUserId: updated.delegateUserId },
      });

      return {
        success: true,
        data: {
          id: updated.id,
          organizationId: updated.organizationId,
          delegateUserId: updated.delegateUserId,
          delegateEmail: delegateUser?.email ?? null,
          scope: updated.scope,
          grantedBy: updated.grantedBy,
          grantedAt: updated.grantedAt,
          expiresAt: updated.expiresAt,
          revokedAt: updated.revokedAt,
          revokedBy: updated.revokedBy,
          notes: updated.notes,
        },
      };
    } catch (error) {
      console.error("Failed to revoke delegated access", error);
      return errorResult("DATABASE_ERROR", "Failed to revoke access");
    }
  });
