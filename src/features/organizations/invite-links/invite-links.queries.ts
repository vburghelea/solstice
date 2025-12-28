import { createServerFn } from "@tanstack/react-start";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { listInviteLinksSchema } from "./invite-links.schemas";
import type { InviteLinkRow } from "./invite-links.types";

export const listInviteLinks = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(listInviteLinksSchema.parse)
  .handler(async ({ data, context }): Promise<InviteLinkRow[]> => {
    await assertFeatureEnabled("org_invite_links");
    const user = requireUser(context);

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(user.id);
    if (!isGlobalAdmin) {
      const { requireOrganizationAccess, ORG_ADMIN_ROLES } =
        await import("~/lib/auth/guards/org-guard");
      await requireOrganizationAccess(
        { userId: user.id, organizationId: data.organizationId },
        { roles: ORG_ADMIN_ROLES },
      );
    }

    const { getDb } = await import("~/db/server-helpers");
    const { organizationInviteLinks } = await import("~/db/schema");
    const { and, desc, eq, isNull } = await import("drizzle-orm");

    const db = await getDb();
    const conditions = [eq(organizationInviteLinks.organizationId, data.organizationId)];

    if (!data.includeRevoked) {
      conditions.push(isNull(organizationInviteLinks.revokedAt));
    }

    const rows = await db
      .select({
        id: organizationInviteLinks.id,
        organizationId: organizationInviteLinks.organizationId,
        token: organizationInviteLinks.token,
        role: organizationInviteLinks.role,
        autoApprove: organizationInviteLinks.autoApprove,
        maxUses: organizationInviteLinks.maxUses,
        useCount: organizationInviteLinks.useCount,
        expiresAt: organizationInviteLinks.expiresAt,
        createdBy: organizationInviteLinks.createdBy,
        createdAt: organizationInviteLinks.createdAt,
        revokedAt: organizationInviteLinks.revokedAt,
        revokedBy: organizationInviteLinks.revokedBy,
      })
      .from(organizationInviteLinks)
      .where(and(...conditions))
      .orderBy(desc(organizationInviteLinks.createdAt));

    return rows;
  });
