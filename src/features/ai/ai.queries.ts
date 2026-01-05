import { createServerFn } from "@tanstack/react-start";
import type { SQL } from "drizzle-orm";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { listAiPromptTemplatesSchema, listAiUsageLogsSchema } from "./ai.schemas";

export const listAiPromptTemplates = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listAiPromptTemplatesSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_ai");
    const user = requireUser(context);

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(user.id);
    if (!isAdmin) {
      const { forbidden } = await import("~/lib/server/errors");
      throw forbidden("Global admin access required.");
    }

    const { getDb } = await import("~/db/server-helpers");
    const { aiPromptTemplates, aiPromptVersions } = await import("~/db/schema");
    const { and, desc, eq } = await import("drizzle-orm");

    const db = await getDb();
    const limit = data.limit ?? 50;
    const includeArchived = data.includeArchived ?? false;

    const baseQuery = db
      .select({
        id: aiPromptTemplates.id,
        key: aiPromptTemplates.key,
        name: aiPromptTemplates.name,
        description: aiPromptTemplates.description,
        audiences: aiPromptTemplates.audiences,
        organizationId: aiPromptTemplates.organizationId,
        isArchived: aiPromptTemplates.isArchived,
        updatedAt: aiPromptTemplates.updatedAt,
        activeVersionId: aiPromptVersions.id,
        activeVersion: aiPromptVersions.version,
        activeModel: aiPromptVersions.model,
        activeStatus: aiPromptVersions.status,
      })
      .from(aiPromptTemplates)
      .leftJoin(
        aiPromptVersions,
        and(
          eq(aiPromptVersions.templateId, aiPromptTemplates.id),
          eq(aiPromptVersions.status, "active"),
        ),
      );

    const conditions: SQL[] = [];
    if (!includeArchived) {
      conditions.push(eq(aiPromptTemplates.isArchived, false));
    }
    if (data.organizationId) {
      conditions.push(eq(aiPromptTemplates.organizationId, data.organizationId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const query = whereClause ? baseQuery.where(whereClause) : baseQuery;

    return query.orderBy(desc(aiPromptTemplates.updatedAt)).limit(limit);
  });

export const listAiUsageLogs = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listAiUsageLogsSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_ai");
    const user = requireUser(context);

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isAdmin = await PermissionService.isGlobalAdmin(user.id);
    if (!isAdmin) {
      const { forbidden } = await import("~/lib/server/errors");
      throw forbidden("Global admin access required.");
    }

    const { getDb } = await import("~/db/server-helpers");
    const { aiUsageLogs } = await import("~/db/schema");
    const { and, desc, eq, gte } = await import("drizzle-orm");

    const db = await getDb();
    const limit = data.limit ?? 100;

    const baseQuery = db.select().from(aiUsageLogs);
    const conditions: SQL[] = [];

    if (data.organizationId) {
      conditions.push(eq(aiUsageLogs.organizationId, data.organizationId));
    }
    if (data.userId) {
      conditions.push(eq(aiUsageLogs.userId, data.userId));
    }
    if (data.templateId) {
      conditions.push(eq(aiUsageLogs.templateId, data.templateId));
    }
    if (data.promptVersionId) {
      conditions.push(eq(aiUsageLogs.promptVersionId, data.promptVersionId));
    }
    if (data.status) {
      conditions.push(eq(aiUsageLogs.status, data.status));
    }
    if (data.operation) {
      conditions.push(eq(aiUsageLogs.operation, data.operation));
    }
    if (data.since) {
      conditions.push(gte(aiUsageLogs.createdAt, new Date(data.since)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const query = whereClause ? baseQuery.where(whereClause) : baseQuery;

    return query.orderBy(desc(aiUsageLogs.createdAt)).limit(limit);
  });
