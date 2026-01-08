#!/usr/bin/env node

import { execFileSync } from "child_process";
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Read the current schema overview to extract the mermaid diagram
const schemaDocPath = join(rootDir, "docs/quadball-plan/database/schema-overview.md");
const outputDir = join(rootDir, "docs/reference/database");
const outputPath = join(outputDir, "schema-erd.svg");

let content = "";
try {
  content = readFileSync(schemaDocPath, "utf-8");
} catch (error) {
  console.error("Schema documentation not found at:", schemaDocPath);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

// Extract mermaid diagram from markdown
const mermaidMatch = content.match(/```mermaid\n([\s\S]*?)```/);

if (!mermaidMatch) {
  console.error("No mermaid diagram found in schema documentation");
  process.exit(1);
}

// Get the currently implemented ERD (first mermaid block)
const mermaidDiagram = mermaidMatch[1];

// Create output directory if it doesn't exist
mkdirSync(outputDir, { recursive: true });

// Create a temporary mermaid file
const tempMermaidPath = join(rootDir, "temp-erd.mmd");
writeFileSync(tempMermaidPath, mermaidDiagram);

try {
  // Generate SVG using mermaid CLI
  console.log("Generating ERD...");
  const puppeteerConfigPath = join(rootDir, "puppeteer.config.json");
  execFileSync(
    "pnpm",
    [
      "mmdc",
      "-i",
      tempMermaidPath,
      "-o",
      outputPath,
      "-t",
      "dark",
      "-b",
      "transparent",
      "-p",
      puppeteerConfigPath,
    ],
    { cwd: rootDir, stdio: "inherit" },
  );

  console.log("✅ ERD generated successfully at:", outputPath);

  // Also generate a PNG version
  const pngPath = join(outputDir, "schema-erd.png");
  execFileSync(
    "pnpm",
    [
      "mmdc",
      "-i",
      tempMermaidPath,
      "-o",
      pngPath,
      "-t",
      "dark",
      "-b",
      "white",
      "-p",
      puppeteerConfigPath,
    ],
    { cwd: rootDir, stdio: "inherit" },
  );

  console.log("✅ PNG version generated at:", pngPath);
} catch (error) {
  console.error("Failed to generate ERD:", error.message);
  process.exit(1);
} finally {
  // Clean up temp file
  try {
    unlinkSync(tempMermaidPath);
  } catch {
    // Ignore cleanup errors.
  }
}

// Update the schema documentation to reference the generated images
const updatedContent = content.replace(
  /### Currently Implemented \(Better Auth\)\n```mermaid/,
  `### Currently Implemented (Better Auth)\n\n![Database ERD](../../reference/database/schema-erd.svg)\n\n\`\`\`mermaid`,
);

writeFileSync(schemaDocPath, updatedContent);
console.log("✅ Updated schema documentation with ERD reference");
