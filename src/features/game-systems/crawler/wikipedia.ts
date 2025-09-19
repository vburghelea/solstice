import { eq } from "drizzle-orm";
import type { db } from "~/db";
import {
  gameSystems,
  publishers,
  systemCrawlEvents,
  type ExternalRefs,
} from "~/db/schema";
import { CrawlSeverity, type CrawlEventLog } from "./logging";

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const WIKIPEDIA_REST = "https://en.wikipedia.org/api/rest_v1";

export interface WikipediaSummary {
  title: string;
  extract?: string;
  contentUrl?: string;
}

export interface WikipediaInfobox {
  releaseDate?: Date;
  releaseRaw?: string | null;
  publisherNames: string[];
  publisherRaw?: string | null;
}

type Db = Awaited<ReturnType<typeof db>>;

export interface WikipediaEnrichParams {
  id: number;
  name: string;
  descriptionScraped?: string | null;
  releaseDate?: Date | null;
  publisherId?: number | null;
  externalRefs?: ExternalRefs | null;
}

function buildUrl(base: string, params: Record<string, string>) {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

export async function resolvePageTitle(name: string): Promise<string | null> {
  const url = buildUrl(WIKIPEDIA_API, {
    action: "opensearch",
    search: name,
    namespace: "0",
    redirects: "resolve",
    limit: "1",
    format: "json",
  });
  const res = await fetch(url, {
    headers: {
      "User-Agent": process.env["CRAWLER_USER_AGENT"] ?? "SolsticeGameCrawler/1.0",
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as [string, string[], unknown[], unknown[]];
  const title = data?.[1]?.[0];
  return title ?? null;
}

export async function fetchSummary(title: string): Promise<WikipediaSummary | null> {
  const res = await fetch(`${WIKIPEDIA_REST}/page/summary/${encodeURIComponent(title)}`, {
    headers: {
      "User-Agent": process.env["CRAWLER_USER_AGENT"] ?? "SolsticeGameCrawler/1.0",
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    title: string;
    extract?: string;
    content_urls?: { desktop?: { page?: string } };
  };
  const summary: WikipediaSummary = { title: data.title };
  if (data.extract) {
    summary.extract = data.extract;
  }
  const url = data.content_urls?.desktop?.page;
  if (url) {
    summary.contentUrl = url;
  }
  return summary;
}

async function fetchInfoboxRaw(title: string): Promise<string | null> {
  const res = await fetch(
    buildUrl(WIKIPEDIA_API, {
      action: "parse",
      page: title,
      prop: "wikitext",
      format: "json",
      formatversion: "2",
    }),
    {
      headers: {
        "User-Agent": process.env["CRAWLER_USER_AGENT"] ?? "SolsticeGameCrawler/1.0",
      },
    },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { parse?: { wikitext?: string } };
  return data.parse?.wikitext ?? null;
}

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export function stripWikiMarkup(value: string): string {
  let result = value;
  const templateRegex = /\{\{[^{}]*\}\}/g;
  while (templateRegex.test(result)) {
    result = result.replace(templateRegex, " ");
  }
  result = result
    .replace(/<ref[^>]*>.*?<\/ref>/gims, " ")
    .replace(/<br\s*\/?\s*>/gi, "|")
    .replace(/\[\[(?:[^\]|\]]*\|)?([^\]]+)\]\]/g, "$1")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, " ");
  result = result.replace(/^\s*\|\s*/, "").replace(/\s*\|\s*$/, "");
  return result.replace(/\s+/g, " ").trim();
}

export function parsePublisherNames(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const sanitized = stripWikiMarkup(raw);
  return sanitized
    .split(/[,;|]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => part.replace(/^and\s+/i, ""));
}

export function parseReleaseDate(raw: string | null | undefined): Date | undefined {
  if (!raw) return undefined;
  const startTemplateMatch = raw.match(/\{\{\s*start\s+date[^}]*\}\}/i);
  if (startTemplateMatch) {
    const inner = startTemplateMatch[0].slice(2, -2); // remove {{ }}
    const parts = inner.split("|").map((part) => part.trim());
    const numericParts = parts
      .map((part) => Number(part))
      .filter((num) => !Number.isNaN(num));
    if (numericParts.length >= 1) {
      const [year, month = 1, day = 1] = numericParts;
      const currentYear = new Date().getFullYear();
      if (year >= 1900 && year <= currentYear + 1) {
        const candidate = new Date(Date.UTC(year, month - 1, day));
        if (!Number.isNaN(candidate.getTime())) {
          return candidate;
        }
      }
    }
  }
  const sanitized = stripWikiMarkup(raw);
  const yearMatch = sanitized.match(/(19|20)\d{2}/);
  if (!yearMatch) return undefined;
  const year = Number(yearMatch[0]);
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear + 1) return undefined;
  const monthMatch = sanitized.match(new RegExp(MONTHS.join("|"), "i"));
  const dayMatch = sanitized.match(/\b([0-3]?\d)\b/);
  if (monthMatch) {
    const monthIndex = MONTHS.indexOf(monthMatch[0].toLowerCase());
    const day = dayMatch ? Number(dayMatch[1]) : 1;
    const candidate = new Date(Date.UTC(year, monthIndex, day));
    if (!Number.isNaN(candidate.getTime())) {
      return candidate;
    }
  }
  return new Date(Date.UTC(year, 0, 1));
}

export function extractInfobox(wikitext: string): WikipediaInfobox {
  const getField = (field: string) => {
    const regex = new RegExp(`\\|\\s*${field}\\s*=([^\\n]+)`);
    const match = wikitext.match(regex);
    return match ? match[1].trim() : null;
  };

  const releaseRaw =
    getField("release_date") ?? getField("released") ?? getField("publication_date");
  const publisherRaw = getField("publisher") ?? getField("publishers");

  const infobox: WikipediaInfobox = {
    publisherNames: parsePublisherNames(publisherRaw),
    publisherRaw,
    releaseRaw,
  };
  const release = parseReleaseDate(releaseRaw ?? undefined);
  if (release) {
    infobox.releaseDate = release;
  }
  return infobox;
}

async function recordEvent(
  database: Db,
  event: Omit<CrawlEventLog, "systemSlug"> & { systemId: number },
) {
  await database.insert(systemCrawlEvents).values({
    gameSystemId: event.systemId,
    source: event.source,
    status: event.status,
    startedAt: event.startedAt,
    finishedAt: event.finishedAt,
    httpStatus: event.httpStatus,
    errorMessage: event.errorMessage,
    severity: event.severity,
    details: event.details ?? null,
  });
}

export async function enrichFromWikipedia(database: Db, system: WikipediaEnrichParams) {
  const startedAt = new Date();
  try {
    const existingTitle = system.externalRefs?.wikipedia;
    const resolvedTitle = existingTitle ?? (await resolvePageTitle(system.name));
    if (!resolvedTitle) {
      await recordEvent(database, {
        systemId: system.id,
        source: "wikipedia",
        status: "partial",
        startedAt,
        finishedAt: new Date(),
        errorMessage: "No Wikipedia match found",
        severity: CrawlSeverity.WARNING,
      });
      return null;
    }

    const summary = await fetchSummary(resolvedTitle);
    const wikitext = await fetchInfoboxRaw(resolvedTitle);
    const infobox = wikitext
      ? extractInfobox(wikitext)
      : ({
          publisherNames: [],
          publisherRaw: null,
          releaseRaw: null,
        } as WikipediaInfobox);

    const externalRefs = { ...(system.externalRefs ?? {}), wikipedia: resolvedTitle };
    const externalRefChanged = system.externalRefs?.wikipedia !== resolvedTitle;
    const update: Record<string, unknown> = { externalRefs };
    const updatedFields: string[] = externalRefChanged ? ["externalRefs"] : [];
    const conflicts: string[] = [];

    if (summary?.extract) {
      if (!system.descriptionScraped) {
        update["descriptionScraped"] = summary.extract;
        updatedFields.push("descriptionScraped");
      } else if (summary.extract !== system.descriptionScraped) {
        conflicts.push("description_conflict");
      }
    }

    if (infobox.releaseDate) {
      if (!system.releaseDate) {
        update["releaseDate"] = infobox.releaseDate;
        updatedFields.push("releaseDate");
      } else if (system.releaseDate.getTime() !== infobox.releaseDate.getTime()) {
        conflicts.push("release_date_conflict");
      }
    } else if (infobox.releaseRaw) {
      conflicts.push("release_date_unparsed");
    }

    if (infobox.publisherNames.length > 0) {
      if (!system.publisherId) {
        const normalized = infobox.publisherNames[0];
        const existingPublisher = await database.query.publishers.findFirst({
          where: eq(publishers.name, normalized),
        });
        const publisherRecord = existingPublisher
          ? existingPublisher
          : ((
              await database
                .insert(publishers)
                .values({
                  name: normalized,
                  wikipediaUrl: summary?.contentUrl,
                })
                .onConflictDoNothing()
                .returning()
            )[0] ??
            (await database.query.publishers.findFirst({
              where: eq(publishers.name, normalized),
            })));

        if (publisherRecord) {
          update["publisherId"] = publisherRecord.id;
          update["publisherUrl"] =
            summary?.contentUrl ?? publisherRecord.wikipediaUrl ?? null;
          updatedFields.push("publisherId");
        }
      } else {
        conflicts.push("publisher_conflict");
      }
    } else if (
      summary?.contentUrl &&
      (!system.publisherId || !system.externalRefs?.wikipedia)
    ) {
      update["publisherUrl"] = summary.contentUrl;
      updatedFields.push("publisherUrl");
    }

    const shouldUpdate = updatedFields.length > 0;

    if (shouldUpdate) {
      await database.update(gameSystems).set(update).where(eq(gameSystems.id, system.id));
    }

    const status = conflicts.length ? "partial" : "success";
    const severity = status === "partial" ? CrawlSeverity.WARNING : CrawlSeverity.INFO;
    const eventPayload: Omit<CrawlEventLog, "systemSlug"> & { systemId: number } = {
      systemId: system.id,
      source: "wikipedia",
      status,
      startedAt,
      finishedAt: new Date(),
      severity,
    };
    if (conflicts.length) {
      eventPayload.errorMessage = conflicts.join(",");
      eventPayload.details = { conflicts };
    }

    await recordEvent(database, eventPayload);

    return {
      title: resolvedTitle,
      summaryUpdated: updatedFields.includes("descriptionScraped"),
      releaseDateUpdated: updatedFields.includes("releaseDate"),
      conflicts,
    };
  } catch (error) {
    await recordEvent(database, {
      systemId: system.id,
      source: "wikipedia",
      status: "error",
      startedAt,
      finishedAt: new Date(),
      errorMessage: error instanceof Error ? error.message : String(error),
      severity: CrawlSeverity.ERROR,
    });
    throw error;
  }
}
