import type { JsonRecord } from "~/shared/lib/json";

export type CatalogSeedEntry = {
  sourceType: string;
  sourceId: string;
  organizationId: string | null;
  title: string;
  description: string | null;
  tags: string[];
  metadata: JsonRecord;
  sourceUpdatedAt: Date | null;
};

export const buildCatalogSeedEntries = async (options?: {
  includeTemplates?: boolean;
}): Promise<CatalogSeedEntry[]> => {
  const { getDb } = await import("~/db/server-helpers");
  const { forms, importMappingTemplates, savedReports, templates } =
    await import("~/db/schema");

  const db = await getDb();

  const { eq } = await import("drizzle-orm");

  const [formRows, importRows, reportRows, templateRows] = await Promise.all([
    db.select().from(forms),
    db.select().from(importMappingTemplates),
    db.select().from(savedReports),
    options?.includeTemplates === false
      ? Promise.resolve([])
      : db.select().from(templates).where(eq(templates.isArchived, false)),
  ]);

  const entries: CatalogSeedEntry[] = [];

  for (const form of formRows) {
    entries.push({
      sourceType: "form",
      sourceId: form.id,
      organizationId: form.organizationId ?? null,
      title: form.name,
      description: form.description ?? null,
      tags: ["form"],
      metadata: {
        slug: form.slug,
        status: form.status,
      },
      sourceUpdatedAt: form.updatedAt ?? form.createdAt,
    });
  }

  for (const template of importRows) {
    entries.push({
      sourceType: "import_template",
      sourceId: template.id,
      organizationId: template.organizationId ?? null,
      title: template.name,
      description: template.description ?? null,
      tags: ["import", "template"],
      metadata: {
        targetFormId: template.targetFormId,
      },
      sourceUpdatedAt: template.updatedAt ?? template.createdAt,
    });
  }

  for (const report of reportRows) {
    entries.push({
      sourceType: "saved_report",
      sourceId: report.id,
      organizationId: report.organizationId ?? null,
      title: report.name,
      description: report.description ?? null,
      tags: ["report"],
      metadata: {
        dataSource: report.dataSource,
        isOrgWide: report.isOrgWide,
      },
      sourceUpdatedAt: report.updatedAt ?? report.createdAt,
    });
  }

  for (const template of templateRows) {
    entries.push({
      sourceType: "template",
      sourceId: template.id,
      organizationId: template.organizationId ?? null,
      title: template.name,
      description: template.description ?? null,
      tags: ["template", template.context],
      metadata: {
        context: template.context,
        fileName: template.fileName,
      },
      sourceUpdatedAt: template.updatedAt ?? template.createdAt,
    });
  }

  return entries;
};
