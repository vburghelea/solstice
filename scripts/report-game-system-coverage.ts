import { sql } from "drizzle-orm";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  closeConnections,
  db,
  gameSystemToCategory,
  gameSystemToMechanics,
  gameSystems,
} from "~/db";

interface SystemCoverage {
  id: number;
  slug: string | null;
  name: string;
  hasDescription: boolean;
  hasHeroImage: boolean;
  hasPublisher: boolean;
  hasPlayers: boolean;
  hasAveragePlayTime: boolean;
  hasTaxonomy: boolean;
  hasBggRef: boolean;
  hasStartPlayingRef: boolean;
  sourceOfTruth: string | null;
  lastSuccessAt: Date | null;
  lastCrawledAt: Date | null;
}

function percent(part: number, whole: number) {
  if (whole === 0) return "0%";
  return `${((part / whole) * 100).toFixed(1)}%`;
}

async function main() {
  const database = await db();

  const systems = await database
    .select({
      id: gameSystems.id,
      slug: gameSystems.slug,
      name: gameSystems.name,
      descriptionCms: gameSystems.descriptionCms,
      descriptionScraped: gameSystems.descriptionScraped,
      heroImageId: gameSystems.heroImageId,
      publisherId: gameSystems.publisherId,
      minPlayers: gameSystems.minPlayers,
      maxPlayers: gameSystems.maxPlayers,
      averagePlayTime: gameSystems.averagePlayTime,
      externalRefs: gameSystems.externalRefs,
      sourceOfTruth: gameSystems.sourceOfTruth,
      lastSuccessAt: gameSystems.lastSuccessAt,
      lastCrawledAt: gameSystems.lastCrawledAt,
    })
    .from(gameSystems);

  const categoryCounts = await database
    .select({
      gameSystemId: gameSystemToCategory.gameSystemId,
      count: sql<number>`count(*)::int`,
    })
    .from(gameSystemToCategory)
    .groupBy(gameSystemToCategory.gameSystemId);

  const mechanicCounts = await database
    .select({
      gameSystemId: gameSystemToMechanics.gameSystemId,
      count: sql<number>`count(*)::int`,
    })
    .from(gameSystemToMechanics)
    .groupBy(gameSystemToMechanics.gameSystemId);

  const categoryMap = new Map<number, number>();
  for (const row of categoryCounts) {
    categoryMap.set(row.gameSystemId, row.count);
  }

  const mechanicMap = new Map<number, number>();
  for (const row of mechanicCounts) {
    mechanicMap.set(row.gameSystemId, row.count);
  }

  const coverage: SystemCoverage[] = systems.map((system) => {
    const description = Boolean(
      system.descriptionCms?.trim() || system.descriptionScraped?.trim(),
    );
    const hero = system.heroImageId != null;
    const publisher = system.publisherId != null;
    const players = system.minPlayers != null && system.maxPlayers != null;
    const avgPlayTime = system.averagePlayTime != null;
    const taxonomy =
      (categoryMap.get(system.id) ?? 0) > 0 || (mechanicMap.get(system.id) ?? 0) > 0;
    const refs = system.externalRefs ?? {};
    const hasBgg = typeof refs["bgg"] === "string" && refs["bgg"].trim().length > 0;
    const hasStartPlaying =
      typeof refs["startplaying"] === "string" && refs["startplaying"].trim().length > 0;

    return {
      id: system.id,
      slug: system.slug,
      name: system.name,
      hasDescription: description,
      hasHeroImage: hero,
      hasPublisher: publisher,
      hasPlayers: players,
      hasAveragePlayTime: avgPlayTime,
      hasTaxonomy: taxonomy,
      hasBggRef: hasBgg,
      hasStartPlayingRef: hasStartPlaying,
      sourceOfTruth: system.sourceOfTruth,
      lastSuccessAt: system.lastSuccessAt,
      lastCrawledAt: system.lastCrawledAt,
    };
  });

  const total = coverage.length;
  const withDescription = coverage.filter((c) => c.hasDescription).length;
  const withHeroImage = coverage.filter((c) => c.hasHeroImage).length;
  const withPublisher = coverage.filter((c) => c.hasPublisher).length;
  const withPlayers = coverage.filter((c) => c.hasPlayers).length;
  const withAveragePlayTime = coverage.filter((c) => c.hasAveragePlayTime).length;
  const withTaxonomy = coverage.filter((c) => c.hasTaxonomy).length;
  const withBgg = coverage.filter((c) => c.hasBggRef).length;
  const withStartPlaying = coverage.filter((c) => c.hasStartPlayingRef).length;

  console.log("\n=== Game System Coverage Summary ===");
  console.log(`Total systems: ${total}`);
  console.log(`Descriptions: ${withDescription} (${percent(withDescription, total)})`);
  console.log(`Hero images: ${withHeroImage} (${percent(withHeroImage, total)})`);
  console.log(`Publisher linked: ${withPublisher} (${percent(withPublisher, total)})`);
  console.log(`Min/max players: ${withPlayers} (${percent(withPlayers, total)})`);
  console.log(
    `Average play time: ${withAveragePlayTime} (${percent(withAveragePlayTime, total)})`,
  );
  console.log(`Taxonomy attached: ${withTaxonomy} (${percent(withTaxonomy, total)})`);
  console.log(`Bgg reference: ${withBgg} (${percent(withBgg, total)})`);
  console.log(
    `StartPlaying reference: ${withStartPlaying} (${percent(withStartPlaying, total)})`,
  );

  const missing = {
    hero: coverage.filter((c) => !c.hasHeroImage),
    taxonomy: coverage.filter((c) => !c.hasTaxonomy),
    description: coverage.filter((c) => !c.hasDescription),
  };

  const sampleSize = 10;

  console.log("\n=== Drill-down: Missing Hero Image ===");
  missing.hero.slice(0, sampleSize).forEach((system) => {
    console.log(`- ${system.slug ?? system.id}: ${system.name}`);
  });
  if (missing.hero.length > sampleSize) {
    console.log(`… ${missing.hero.length - sampleSize} more`);
  }

  console.log("\n=== Drill-down: Missing Taxonomy ===");
  missing.taxonomy.slice(0, sampleSize).forEach((system) => {
    console.log(`- ${system.slug ?? system.id}: ${system.name}`);
  });
  if (missing.taxonomy.length > sampleSize) {
    console.log(`… ${missing.taxonomy.length - sampleSize} more`);
  }

  console.log("\n=== Drill-down: Missing Description ===");
  missing.description.slice(0, sampleSize).forEach((system) => {
    console.log(`- ${system.slug ?? system.id}: ${system.name}`);
  });
  if (missing.description.length > sampleSize) {
    console.log(`… ${missing.description.length - sampleSize} more`);
  }

  const header = [
    "id",
    "slug",
    "name",
    "hasDescription",
    "hasHeroImage",
    "hasPublisher",
    "hasPlayers",
    "hasAveragePlayTime",
    "hasTaxonomy",
    "hasBggRef",
    "hasStartPlayingRef",
    "sourceOfTruth",
    "lastSuccessAt",
    "lastCrawledAt",
  ];

  const csvLines = [header.join(",")];
  for (const row of coverage) {
    csvLines.push(
      [
        row.id,
        row.slug ?? "",
        row.name.replace(/"/g, '""'),
        row.hasDescription,
        row.hasHeroImage,
        row.hasPublisher,
        row.hasPlayers,
        row.hasAveragePlayTime,
        row.hasTaxonomy,
        row.hasBggRef,
        row.hasStartPlayingRef,
        row.sourceOfTruth ?? "",
        row.lastSuccessAt ? row.lastSuccessAt.toISOString() : "",
        row.lastCrawledAt ? row.lastCrawledAt.toISOString() : "",
      ]
        .map((value) => (typeof value === "string" ? `"${value}"` : String(value)))
        .join(","),
    );
  }

  const outputDir = join("storage", "coverage");
  await mkdir(outputDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputPath = join(outputDir, `game-systems-coverage-${timestamp}.csv`);
  await writeFile(outputPath, csvLines.join("\n"), "utf8");

  console.log(`\nCoverage CSV written to ${outputPath}`);
}

try {
  await main();
} finally {
  await closeConnections();
}
