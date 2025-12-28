import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { OrganizationRole } from "~/lib/auth/guards/org-guard";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";

const ANALYTICS_ROLES: OrganizationRole[] = ["owner", "admin", "reporter"];

const listSavedReportsSchema = z
  .object({
    organizationId: z.uuid().optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

export const listSavedReports = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listSavedReportsSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_analytics");
    const user = requireUser(context);
    const { getDb } = await import("~/db/server-helpers");
    const { savedReports } = await import("~/db/schema");
    const { and, eq, inArray, isNull, or, sql } = await import("drizzle-orm");
    const { PermissionService } = await import("~/features/roles/permission.service");

    const db = await getDb();
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(user.id);

    if (isGlobalAdmin) {
      if (data.organizationId) {
        return db
          .select()
          .from(savedReports)
          .where(eq(savedReports.organizationId, data.organizationId));
      }

      return db.select().from(savedReports);
    }

    if (data.organizationId) {
      const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
      await requireOrganizationAccess(
        { userId: user.id, organizationId: data.organizationId },
        { roles: ANALYTICS_ROLES },
      );

      return db
        .select()
        .from(savedReports)
        .where(
          and(
            eq(savedReports.organizationId, data.organizationId),
            or(
              eq(savedReports.ownerId, user.id),
              sql`${savedReports.sharedWith} @> ${JSON.stringify([user.id])}::jsonb`,
              eq(savedReports.isOrgWide, true),
            ),
          ),
        );
    }

    const { listAccessibleOrganizationsForUser } =
      await import("~/features/organizations/organizations.access");
    const accessibleOrganizations = await listAccessibleOrganizationsForUser(user.id);
    const accessibleOrgIds = accessibleOrganizations
      .filter((org) => org.role !== null && ANALYTICS_ROLES.includes(org.role))
      .map((org) => org.id);

    const personalCondition = and(
      isNull(savedReports.organizationId),
      eq(savedReports.ownerId, user.id),
    );

    if (accessibleOrgIds.length === 0) {
      return db.select().from(savedReports).where(personalCondition);
    }

    const sharedWithCondition = sql`${savedReports.sharedWith} @> ${JSON.stringify([
      user.id,
    ])}::jsonb`;

    const orgScopedCondition = and(
      inArray(savedReports.organizationId, accessibleOrgIds),
      or(
        eq(savedReports.ownerId, user.id),
        sharedWithCondition,
        eq(savedReports.isOrgWide, true),
      ),
    );

    return db
      .select()
      .from(savedReports)
      .where(or(personalCondition, orgScopedCondition));
  });
