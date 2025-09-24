import type { ExternalRefs } from "~/db/schema";

const PROCESS_BATCH_SIZE = 5;

type ScheduledEvent = {
  httpMethod?: string;
};

type CrawlStatus = "success" | "partial" | "error";
type CrawlSource = "bgg" | "wikipedia" | "startplaying";

interface CrawlSummary {
  eventId: number;
  systemId: number;
  status: CrawlStatus;
  source: CrawlSource;
  message?: string;
  details?: Record<string, unknown>;
}

function isGetRequest(event?: ScheduledEvent) {
  return !event?.httpMethod || event.httpMethod === "GET";
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const candidate = new Date(value as string);
  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

export default async function handler(event?: ScheduledEvent) {
  if (!isGetRequest(event)) {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    const [{ asc, eq }, { getDb }, schema, { CrawlSeverity }] = await Promise.all([
      import("drizzle-orm"),
      import("~/db/server-helpers"),
      import("~/db/schema"),
      import("~/features/game-systems/crawler/logging"),
    ]);

    const db = await getDb();
    const { systemCrawlEvents, gameSystems } = schema;

    const queuedEvents = await db
      .select({
        id: systemCrawlEvents.id,
        gameSystemId: systemCrawlEvents.gameSystemId,
        source: systemCrawlEvents.source,
        createdAt: systemCrawlEvents.createdAt,
      })
      .from(systemCrawlEvents)
      .where(eq(systemCrawlEvents.status, "queued"))
      .orderBy(asc(systemCrawlEvents.createdAt))
      .limit(PROCESS_BATCH_SIZE);

    if (queuedEvents.length === 0) {
      console.log("No queued crawl events found");
      return new Response(
        JSON.stringify({ message: "No queued events to process", processed: 0 }),
        {
          status: 200,
        },
      );
    }

    console.log(`Processing ${queuedEvents.length} crawl events`);

    const summaries: CrawlSummary[] = [];

    for (const queued of queuedEvents) {
      const startedAt = new Date();
      const originalSource = queued.source ?? "manual";
      const resolvedSource: CrawlSource =
        originalSource === "manual" || !originalSource
          ? "bgg"
          : (originalSource as CrawlSource);

      try {
        await db
          .update(systemCrawlEvents)
          .set({
            status: "processing",
            severity: CrawlSeverity.INFO,
            startedAt,
            finishedAt: startedAt,
            errorMessage: null,
            details: null,
          })
          .where(eq(systemCrawlEvents.id, queued.id));

        const [system] = await db
          .select({
            id: gameSystems.id,
            name: gameSystems.name,
            slug: gameSystems.slug,
            externalRefs: gameSystems.externalRefs,
            releaseDate: gameSystems.releaseDate,
            publisherId: gameSystems.publisherId,
            descriptionScraped: gameSystems.descriptionScraped,
          })
          .from(gameSystems)
          .where(eq(gameSystems.id, queued.gameSystemId))
          .limit(1);

        if (!system) {
          throw new Error(`Game system ${queued.gameSystemId} not found`);
        }

        await db
          .update(gameSystems)
          .set({
            crawlStatus: "processing",
            lastCrawledAt: startedAt,
            errorMessage: null,
          })
          .where(eq(gameSystems.id, system.id));

        const externalRefs =
          (system.externalRefs as ExternalRefs | null | undefined) ?? null;
        const releaseDate = toDate(system.releaseDate);

        const finalize = async (
          status: CrawlStatus,
          severity: (typeof CrawlSeverity)[keyof typeof CrawlSeverity],
          message?: string,
          details?: Record<string, unknown>,
        ) => {
          const finishedAt = new Date();
          await db
            .update(systemCrawlEvents)
            .set({
              status,
              severity,
              finishedAt,
              errorMessage: message ?? null,
              details: details ?? null,
            })
            .where(eq(systemCrawlEvents.id, queued.id));

          const systemUpdate: Record<string, unknown> = {
            crawlStatus: status,
            lastCrawledAt: finishedAt,
          };

          if (status === "success") {
            systemUpdate["lastSuccessAt"] = finishedAt;
            systemUpdate["errorMessage"] = null;
          } else if (message) {
            systemUpdate["errorMessage"] = message;
          }

          await db
            .update(gameSystems)
            .set(systemUpdate)
            .where(eq(gameSystems.id, system.id));
          const summary: CrawlSummary = {
            eventId: queued.id,
            systemId: system.id,
            status,
            source: resolvedSource,
          };
          if (message !== undefined) {
            summary.message = message;
          }
          if (details) {
            summary.details = details;
          }
          summaries.push(summary);
        };

        if (resolvedSource === "bgg") {
          const { enrichFromBgg } = await import("~/features/game-systems/crawler/bgg");
          const result = await enrichFromBgg(db, {
            id: system.id,
            name: system.name,
            externalRefs,
            releaseDate,
          });

          if (!result) {
            await finalize("partial", CrawlSeverity.WARNING, "BGG match not found", {
              requestedSource: originalSource,
              effectiveSource: resolvedSource,
            });
          } else {
            await finalize("success", CrawlSeverity.INFO, undefined, {
              requestedSource: originalSource,
              effectiveSource: resolvedSource,
              bggId: result.bggId,
              yearPublished: result.yearPublished ?? null,
            });
          }
          continue;
        }

        if (resolvedSource === "wikipedia") {
          const { enrichFromWikipedia } = await import(
            "~/features/game-systems/crawler/wikipedia"
          );
          const outcome = await enrichFromWikipedia(db, {
            id: system.id,
            name: system.name,
            descriptionScraped: system.descriptionScraped,
            releaseDate,
            publisherId: system.publisherId,
            externalRefs,
          });

          const conflicts = outcome?.conflicts ?? [];
          const status: CrawlStatus = conflicts.length ? "partial" : "success";
          await finalize(
            status,
            conflicts.length ? CrawlSeverity.WARNING : CrawlSeverity.INFO,
            conflicts.length ? conflicts.join(",") : undefined,
            {
              requestedSource: originalSource,
              effectiveSource: resolvedSource,
              conflicts,
              summaryUpdated: outcome?.summaryUpdated ?? false,
              releaseDateUpdated: outcome?.releaseDateUpdated ?? false,
            },
          );
          continue;
        }

        await finalize(
          "error",
          CrawlSeverity.ERROR,
          "StartPlaying recrawl is not yet supported",
          {
            requestedSource: originalSource,
            effectiveSource: resolvedSource,
          },
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(
          `Failed to process crawl event ${queued.id} (system ${queued.gameSystemId}):`,
          error,
        );

        const finishedAt = new Date();

        const summary: CrawlSummary = {
          eventId: queued.id,
          systemId: queued.gameSystemId,
          status: "error",
          source: resolvedSource,
        };
        if (message !== undefined) {
          summary.message = message;
        }
        summaries.push(summary);

        await db
          .update(systemCrawlEvents)
          .set({
            status: "error",
            severity: CrawlSeverity.ERROR,
            finishedAt,
            errorMessage: message,
          })
          .where(eq(systemCrawlEvents.id, queued.id));

        await db
          .update(gameSystems)
          .set({
            crawlStatus: "error",
            lastCrawledAt: finishedAt,
            errorMessage: message,
          })
          .where(eq(gameSystems.id, queued.gameSystemId));
      }
    }

    const processed = summaries.length;
    const successCount = summaries.filter((item) => item.status === "success").length;
    const partialCount = summaries.filter((item) => item.status === "partial").length;
    const errorCount = summaries.filter((item) => item.status === "error").length;

    return new Response(
      JSON.stringify({
        processed,
        success: successCount,
        partial: partialCount,
        error: errorCount,
        results: summaries,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Unhandled error in crawl queue processor:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 },
    );
  }
}
