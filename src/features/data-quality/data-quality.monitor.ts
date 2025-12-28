import type { JsonRecord } from "~/shared/lib/json";

type DataQualitySummary = {
  totals: {
    totalSubmissions: number;
    missingFields: number;
    validationErrors: number;
    lowCompleteness: number;
    draftSubmissions: number;
  };
  byOrganization: Array<{
    organizationId: string;
    organizationName: string | null;
    totalSubmissions: number;
    missingFields: number;
    validationErrors: number;
    lowCompleteness: number;
    draftSubmissions: number;
    latestSubmittedAt: string | null;
  }>;
};

const buildSummary = async (): Promise<DataQualitySummary> => {
  const { getDb } = await import("~/db/server-helpers");
  const { formSubmissions, organizations } = await import("~/db/schema");
  const { inArray, sql } = await import("drizzle-orm");

  const db = await getDb();

  const stats = await db
    .select({
      organizationId: formSubmissions.organizationId,
      totalSubmissions: sql<number>`count(*)`,
      missingFields: sql<number>`count(*) filter (where jsonb_array_length(${formSubmissions.missingFields}) > 0)`,
      validationErrors: sql<number>`count(*) filter (where jsonb_array_length(${formSubmissions.validationErrors}) > 0)`,
      lowCompleteness: sql<number>`count(*) filter (where ${formSubmissions.completenessScore} < 80)`,
      draftSubmissions: sql<number>`count(*) filter (where ${formSubmissions.status} = 'draft')`,
      latestSubmittedAt: sql<Date | null>`max(${formSubmissions.submittedAt})`,
    })
    .from(formSubmissions)
    .groupBy(formSubmissions.organizationId);

  const orgIds = stats.map((row) => row.organizationId).filter(Boolean);
  const orgRows =
    orgIds.length === 0
      ? []
      : await db
          .select({ id: organizations.id, name: organizations.name })
          .from(organizations)
          .where(inArray(organizations.id, orgIds));

  const orgNameById = new Map(orgRows.map((org) => [org.id, org.name]));

  const byOrganization = stats.map((row) => ({
    organizationId: row.organizationId,
    organizationName: orgNameById.get(row.organizationId) ?? null,
    totalSubmissions: Number(row.totalSubmissions ?? 0),
    missingFields: Number(row.missingFields ?? 0),
    validationErrors: Number(row.validationErrors ?? 0),
    lowCompleteness: Number(row.lowCompleteness ?? 0),
    draftSubmissions: Number(row.draftSubmissions ?? 0),
    latestSubmittedAt: row.latestSubmittedAt ? row.latestSubmittedAt.toISOString() : null,
  }));

  const totals = byOrganization.reduce(
    (acc, row) => ({
      totalSubmissions: acc.totalSubmissions + row.totalSubmissions,
      missingFields: acc.missingFields + row.missingFields,
      validationErrors: acc.validationErrors + row.validationErrors,
      lowCompleteness: acc.lowCompleteness + row.lowCompleteness,
      draftSubmissions: acc.draftSubmissions + row.draftSubmissions,
    }),
    {
      totalSubmissions: 0,
      missingFields: 0,
      validationErrors: 0,
      lowCompleteness: 0,
      draftSubmissions: 0,
    },
  );

  return { totals, byOrganization };
};

export const runDataQualityCheck = async () => {
  const { getDb } = await import("~/db/server-helpers");
  const { dataQualityRuns } = await import("~/db/schema");

  const db = await getDb();
  const startedAt = new Date();

  try {
    const summary = await buildSummary();
    const [run] = await db
      .insert(dataQualityRuns)
      .values({
        status: "success",
        summary: summary as unknown as JsonRecord,
        startedAt,
        completedAt: new Date(),
      })
      .returning();

    return { run, summary };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Data quality check failed";
    await db.insert(dataQualityRuns).values({
      status: "failed",
      summary: {} as JsonRecord,
      errorMessage: message,
      startedAt,
      completedAt: new Date(),
    });
    throw error;
  }
};
