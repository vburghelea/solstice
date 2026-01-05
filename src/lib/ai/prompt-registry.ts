import { createServerOnlyFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import type { JsonRecord } from "~/shared/lib/json";

type PromptResolution = {
  template: {
    id: string;
    key: string;
    name: string;
    description: string | null;
    audiences: string[];
    isArchived: boolean;
    organizationId: string | null;
  };
  version: {
    id: string;
    templateId: string;
    version: number;
    status: "draft" | "active" | "archived";
    systemPrompt: string | null;
    userPrompt: string;
    model: string;
    temperature: number | null;
    topP: number | null;
    maxTokens: number | null;
    modelOptions: JsonRecord;
    variables: string[];
    notes: string | null;
  };
};

export const resolvePromptVersion = createServerOnlyFn(
  async (params: { promptKey?: string; promptVersionId?: string }) => {
    if (!params.promptKey && !params.promptVersionId) {
      throw new Error("promptKey or promptVersionId is required.");
    }

    const { getDb } = await import("~/db/server-helpers");
    const { aiPromptTemplates, aiPromptVersions } = await import("~/db/schema");

    const db = await getDb();

    if (params.promptVersionId) {
      const [row] = await db
        .select({
          template: aiPromptTemplates,
          version: aiPromptVersions,
        })
        .from(aiPromptVersions)
        .innerJoin(
          aiPromptTemplates,
          eq(aiPromptVersions.templateId, aiPromptTemplates.id),
        )
        .where(eq(aiPromptVersions.id, params.promptVersionId))
        .limit(1);

      return row ? (row as PromptResolution) : null;
    }

    const [row] = await db
      .select({
        template: aiPromptTemplates,
        version: aiPromptVersions,
      })
      .from(aiPromptTemplates)
      .leftJoin(
        aiPromptVersions,
        and(
          eq(aiPromptVersions.templateId, aiPromptTemplates.id),
          eq(aiPromptVersions.status, "active"),
        ),
      )
      .where(
        and(
          eq(aiPromptTemplates.key, params.promptKey!),
          eq(aiPromptTemplates.isArchived, false),
        ),
      )
      .limit(1);

    if (!row?.version) return null;
    return row as PromptResolution;
  },
);
