import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { forbidden, notFound, unauthorized } from "~/lib/server/errors";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";

const requireSessionUserId = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });

  if (!session?.user?.id) {
    throw unauthorized("User not authenticated");
  }

  return session.user.id;
};

const requireOrgAccess = async (
  userId: string,
  organizationId: string | null | undefined,
) => {
  if (!organizationId) {
    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(userId);
    if (!isAdmin) {
      throw forbidden("Organization access required");
    }
    return null;
  }

  const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
  return requireOrganizationAccess({ userId, organizationId });
};

const getImportJobSchema = z.object({
  jobId: z.uuid(),
});

const listImportJobsSchema = z
  .object({
    organizationId: z.uuid().optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

const listMappingTemplatesSchema = z
  .object({
    organizationId: z.uuid().optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

const listImportJobErrorsSchema = z.object({
  jobId: z.uuid(),
});

export const getImportJob = createServerFn({ method: "GET" })
  .inputValidator(zod$(getImportJobSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_imports");
    const userId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { importJobs } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [job] = await db.select().from(importJobs).where(eq(importJobs.id, data.jobId));
    if (!job) return null;
    await requireOrgAccess(userId, job.organizationId);
    return job;
  });

export const listImportJobs = createServerFn({ method: "GET" })
  .inputValidator(zod$(listImportJobsSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_imports");
    const userId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { importJobs, organizationMembers } = await import("~/db/schema");
    const { and, desc, eq, inArray, isNull, or } = await import("drizzle-orm");

    const db = await getDb();
    if (data.organizationId) {
      await requireOrgAccess(userId, data.organizationId);
      return db
        .select()
        .from(importJobs)
        .where(eq(importJobs.organizationId, data.organizationId))
        .orderBy(desc(importJobs.createdAt));
    }

    const memberships = await db
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.status, "active"),
        ),
      );

    const orgIds = memberships.map((membership) => membership.organizationId);
    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(userId);

    if (!isAdmin && orgIds.length === 0) {
      return [];
    }

    if (isAdmin && orgIds.length === 0) {
      return db.select().from(importJobs).orderBy(desc(importJobs.createdAt));
    }

    const conditions = [];
    if (orgIds.length > 0) {
      conditions.push(inArray(importJobs.organizationId, orgIds));
    }
    if (isAdmin) {
      conditions.push(isNull(importJobs.organizationId));
    }

    return db
      .select()
      .from(importJobs)
      .where(conditions.length === 1 ? conditions[0] : or(...conditions))
      .orderBy(desc(importJobs.createdAt));
  });

export const listMappingTemplates = createServerFn({ method: "GET" })
  .inputValidator(zod$(listMappingTemplatesSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_imports");
    const userId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { importMappingTemplates } = await import("~/db/schema");
    const { eq, isNull, or } = await import("drizzle-orm");

    const db = await getDb();

    if (data.organizationId) {
      await requireOrgAccess(userId, data.organizationId);
      return db
        .select()
        .from(importMappingTemplates)
        .where(
          or(
            eq(importMappingTemplates.organizationId, data.organizationId),
            isNull(importMappingTemplates.organizationId),
          ),
        );
    }

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(userId);
    if (!isAdmin) {
      return db
        .select()
        .from(importMappingTemplates)
        .where(isNull(importMappingTemplates.organizationId));
    }

    return db.select().from(importMappingTemplates);
  });

export const listImportJobErrors = createServerFn({ method: "GET" })
  .inputValidator(zod$(listImportJobErrorsSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_imports");
    const userId = await requireSessionUserId();
    const { getDb } = await import("~/db/server-helpers");
    const { importJobErrors, importJobs } = await import("~/db/schema");
    const { desc, eq } = await import("drizzle-orm");

    const db = await getDb();
    const [job] = await db
      .select({ organizationId: importJobs.organizationId })
      .from(importJobs)
      .where(eq(importJobs.id, data.jobId))
      .limit(1);

    if (!job) {
      throw notFound("Import job not found");
    }

    await requireOrgAccess(userId, job.organizationId);

    return db
      .select()
      .from(importJobErrors)
      .where(eq(importJobErrors.jobId, data.jobId))
      .orderBy(desc(importJobErrors.rowNumber));
  });
