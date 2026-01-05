import { createServerFn } from "@tanstack/react-start";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import {
  createAiPromptTemplateSchema,
  createAiPromptVersionSchema,
  setAiPromptVersionStatusSchema,
} from "./ai.schemas";

export const createAiPromptTemplate = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(createAiPromptTemplateSchema))
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
    const { eq } = await import("drizzle-orm");
    const { getAiTextDefaults } = await import("~/lib/ai/ai.config");

    const db = await getDb();

    const [existing] = await db
      .select({ id: aiPromptTemplates.id })
      .from(aiPromptTemplates)
      .where(eq(aiPromptTemplates.key, data.key))
      .limit(1);

    if (existing) {
      const { badRequest } = await import("~/lib/server/errors");
      throw badRequest("Prompt template key already exists.");
    }

    const defaults = getAiTextDefaults();
    const status = data.setActive ? "active" : "draft";
    const model = data.model ?? defaults.model;

    return db.transaction(async (tx) => {
      const [template] = await tx
        .insert(aiPromptTemplates)
        .values({
          key: data.key,
          name: data.name,
          description: data.description ?? null,
          audiences: data.audiences ?? [],
          organizationId: data.organizationId ?? null,
          isArchived: false,
          createdBy: user.id,
          updatedBy: user.id,
        })
        .returning();

      const [version] = await tx
        .insert(aiPromptVersions)
        .values({
          templateId: template.id,
          version: 1,
          status,
          systemPrompt: data.systemPrompt ?? null,
          userPrompt: data.userPrompt,
          model,
          temperature: data.temperature ?? null,
          topP: data.topP ?? null,
          maxTokens: data.maxTokens ?? null,
          modelOptions: data.modelOptions ?? {},
          variables: data.variables ?? [],
          notes: data.notes ?? null,
          createdBy: user.id,
        })
        .returning();

      return { template, version };
    });
  });

export const createAiPromptVersion = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(createAiPromptVersionSchema))
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
    const { and, eq, sql } = await import("drizzle-orm");
    const { getAiTextDefaults } = await import("~/lib/ai/ai.config");

    const db = await getDb();
    const defaults = getAiTextDefaults();

    const [template] = data.templateId
      ? await db
          .select()
          .from(aiPromptTemplates)
          .where(eq(aiPromptTemplates.id, data.templateId))
          .limit(1)
      : await db
          .select()
          .from(aiPromptTemplates)
          .where(eq(aiPromptTemplates.key, data.key!))
          .limit(1);

    if (!template) {
      const { notFound } = await import("~/lib/server/errors");
      throw notFound("Prompt template not found.");
    }

    const status = data.status ?? "draft";
    const model = data.model ?? defaults.model;

    return db.transaction(async (tx) => {
      const [latest] = await tx
        .select({
          maxVersion: sql<number>`coalesce(max(${aiPromptVersions.version}), 0)`,
        })
        .from(aiPromptVersions)
        .where(eq(aiPromptVersions.templateId, template.id));

      const nextVersion = (latest?.maxVersion ?? 0) + 1;

      if (status === "active") {
        await tx
          .update(aiPromptVersions)
          .set({ status: "archived" })
          .where(
            and(
              eq(aiPromptVersions.templateId, template.id),
              eq(aiPromptVersions.status, "active"),
            ),
          );
      }

      const [version] = await tx
        .insert(aiPromptVersions)
        .values({
          templateId: template.id,
          version: nextVersion,
          status,
          systemPrompt: data.systemPrompt ?? null,
          userPrompt: data.userPrompt,
          model,
          temperature: data.temperature ?? null,
          topP: data.topP ?? null,
          maxTokens: data.maxTokens ?? null,
          modelOptions: data.modelOptions ?? {},
          variables: data.variables ?? [],
          notes: data.notes ?? null,
          createdBy: user.id,
        })
        .returning();

      await tx
        .update(aiPromptTemplates)
        .set({ updatedBy: user.id })
        .where(eq(aiPromptTemplates.id, template.id));

      return { template, version };
    });
  });

export const setAiPromptVersionStatus = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(setAiPromptVersionStatusSchema))
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
    const { and, eq } = await import("drizzle-orm");

    const db = await getDb();

    const [existing] = await db
      .select({
        id: aiPromptVersions.id,
        templateId: aiPromptVersions.templateId,
      })
      .from(aiPromptVersions)
      .where(eq(aiPromptVersions.id, data.promptVersionId))
      .limit(1);

    if (!existing) {
      const { notFound } = await import("~/lib/server/errors");
      throw notFound("Prompt version not found.");
    }

    return db.transaction(async (tx) => {
      if (data.status === "active") {
        await tx
          .update(aiPromptVersions)
          .set({ status: "archived" })
          .where(
            and(
              eq(aiPromptVersions.templateId, existing.templateId),
              eq(aiPromptVersions.status, "active"),
            ),
          );
      }

      const [version] = await tx
        .update(aiPromptVersions)
        .set({ status: data.status })
        .where(eq(aiPromptVersions.id, data.promptVersionId))
        .returning();

      await tx
        .update(aiPromptTemplates)
        .set({ updatedBy: user.id })
        .where(eq(aiPromptTemplates.id, existing.templateId));

      return { version };
    });
  });
