#!/usr/bin/env node

/**
 * AST-based String Extraction Script
 *
 * Extracts all user-facing strings from the codebase using TypeScript Compiler API
 * for comprehensive coverage including template literals, multi-line strings, and variables.
 * Uses i18next-parser configuration for consistency.
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Import AST extractor
import { ASTStringExtractor } from "./lib/ast-string-extractor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

/**
 * Load configuration from i18next-parser.config.js
 */
async function loadParserConfig() {
  const configPath = path.join(projectRoot, "i18next-parser.config.js");

  if (!existsSync(configPath)) {
    throw new Error(`i18next-parser.config.js not found at ${configPath}`);
  }

  try {
    // Import the ES module config
    const configModule = await import(configPath);
    return configModule.default;
  } catch (error) {
    throw new Error(`Failed to load i18next-parser config: ${error.message}`);
  }
}

/**
 * Extract configuration values from parser config
 */
function getI18nConfig(parserConfig) {
  const options = parserConfig.options || {};

  return {
    // File paths
    projectRoot,
    localesDir: path.resolve(
      projectRoot,
      options.resource?.loadPath
        ?.replace("{{lng}}", "")
        .replace("{{ns}}", "")
        .replace(/\/[^\/]*$/, "") || "src/lib/i18n/locales",
    ),
    outputLocalesDir: path.resolve(
      projectRoot,
      options.resource?.savePath
        ?.replace("{{lng}}", "")
        .replace("{{ns}}", "")
        .replace(/\/[^\/]*$/, "") || "src/lib/i18n/locales",
    ),

    // Languages and namespaces
    languages: options.lngs || ["en", "de", "pl"],
    defaultLanguage: options.defaultLng || "en",
    namespaces: options.ns || [],
    defaultNamespace: options.defaultNs || "common",

    // Input patterns for file discovery
    inputPatterns: parserConfig.input || ["src/**/*.{ts,tsx}"],

    // Function list (translation hooks)
    translationFunctions: options.func?.list || ["t", "i18next.t"],

    // Formatting options
    jsonIndent: options.jsonIndent || options.resource?.jsonIndent || 2,
    lineEnding: options.lineEnding || options.resource?.lineEnding || "\n",

    // Parser options
    keepRemoved: options.keepRemoved !== false,
    debug: options.debug || false,
    sort: options.sort || false,

    // Original parser config for reference
    parserConfig,
  };
}

/**
 * Infer namespace from file path using configured patterns
 */
function inferNamespaceFromPath(filePath, namespaces) {
  const normalizedPath = filePath.replace(/\\/g, "/");

  // Check for components directory - should go to common namespace
  if (normalizedPath.includes("/components/")) {
    return "common";
  }

  // Check for feature-based organization
  const featureMatch = normalizedPath.match(/\/features\/([^\/]+)/);
  if (featureMatch) {
    const feature = featureMatch[1];

    // Map feature names to namespaces
    const featureToNamespace = {
      auth: "auth",
      admin: "admin",
      campaigns: "campaigns",
      events: "events",
      games: "games",
      teams: "teams",
      membership: "membership",
      player: "player",
      profile: "profile",
      settings: "settings",
      "game-systems": "game-systems",
      gm: "gm",
      inbox: "inbox",
      collaboration: "collaboration",
      consent: "consent",
      members: "members",
      ops: "ops",
      reviews: "reviews",
      roles: "roles",
      social: "social",
    };

    const namespace = featureToNamespace[feature];
    if (namespace && namespaces.includes(namespace)) {
      return namespace;
    }
  }

  // Fallback to path-based detection
  for (const namespace of namespaces) {
    if (
      normalizedPath.includes(`/${namespace}/`) ||
      normalizedPath.includes(`-${namespace}`)
    ) {
      return namespace;
    }
  }

  // Default namespace
  return namespaces[0] || "common";
}

/**
 * Recursively find files matching patterns
 */
function findFilesRecursive(dir, extensions, excludePatterns = []) {
  const files = [];

  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip excluded patterns
    const shouldExclude = excludePatterns.some((pattern) => {
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      return regex.test(fullPath);
    });

    if (shouldExclude) continue;

    if (entry.isDirectory()) {
      // Recurse into subdirectories
      files.push(...findFilesRecursive(fullPath, extensions, excludePatterns));
    } else if (entry.isFile()) {
      // Check file extension
      const ext = path.extname(entry.name).slice(1); // Remove the dot
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Main extraction class
 */
class ASTStringExtraction {
  constructor(config) {
    this.config = config;
    this.extractions = [];
    this.namespaceExtractions = {};
    this.stats = {
      filesProcessed: 0,
      stringsFound: 0,
      templateLiterals: 0,
      jsxText: 0,
      jsxCAttributes: 0,
      propertyAssignments: 0,
      arrayElements: 0,
      errors: 0,
    };
  }

  /**
   * Run the extraction process
   */
  async run() {
    try {
      console.log("🔍 Starting AST-based string extraction...");
      console.log(`   Project root: ${this.config.projectRoot}`);
      console.log(`   Languages: ${this.config.languages.join(", ")}`);
      console.log(`   Namespaces: ${this.config.namespaces.join(", ")}`);

      // Find files to process
      const files = await this.findFiles();
      console.log(`   Found ${files.length} files to process`);

      // Extract strings from all files
      await this.extractFromFiles(files);

      // Organize by namespace
      this.organizeByNamespace();

      // Save extracted strings
      this.saveExtractions();

      // Generate report
      this.generateReport();

      console.log("✅ AST-based extraction completed successfully!");
    } catch (error) {
      console.error("❌ Error during extraction:", error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Find all files to process
   */
  async findFiles() {
    const extensions = ["ts", "tsx"];

    // Build exclude patterns from input patterns
    const excludePatterns = [
      ".*test\\.(ts|tsx)$",
      ".*spec\\.(ts|tsx)$",
      ".*stories\\.(ts|tsx)$",
      ".*i18n/.*",
      ".*generated-types\\.ts$",
      ".*routeTree\\.gen\\.ts$",
      "node_modules.*",
      "dist.*",
      "coverage.*",
    ];

    const files = findFilesRecursive(
      path.join(this.config.projectRoot, "src"),
      extensions,
      excludePatterns,
    );

    return files;
  }

  /**
   * Extract strings from multiple files
   */
  async extractFromFiles(files) {
    console.log("📚 Extracting strings from files...");

    for (const filePath of files) {
      try {
        const extractions = this.extractFromFile(filePath);
        this.extractions.push(...extractions);
        this.stats.filesProcessed++;

        // Update stats
        extractions.forEach((extraction) => {
          this.stats.stringsFound++;

          switch (extraction.context.type) {
            case "jsx_text":
            case "jsx_children":
              this.stats.jsxText++;
              break;
            case "jsx_attribute":
              this.stats.jsxCAttributes++;
              break;
            case "property_assignment":
              this.stats.propertyAssignments++;
              break;
            case "array_element":
              this.stats.arrayElements++;
              break;
          }

          if (extraction.variables && extraction.variables.length > 0) {
            this.stats.templateLiterals++;
          }
        });
      } catch (error) {
        console.warn(`⚠️  Warning processing ${filePath}: ${error.message}`);
        this.stats.errors++;
      }
    }
  }

  /**
   * Extract strings from a single file
   */
  extractFromFile(filePath) {
    const extractor = new ASTStringExtractor();
    return extractor.extractFromFile(filePath);
  }

  /**
   * Organize extractions by namespace
   */
  organizeByNamespace() {
    console.log("🗂️  Organizing extractions by namespace...");
    console.log(`   Available namespaces: ${this.config.namespaces.join(", ")}`);

    for (const extraction of this.extractions) {
      const namespace = inferNamespaceFromPath(
        extraction.filePath,
        this.config.namespaces,
      );

      // Debug: Show first few namespace inferences
      if (this.stats.stringsFound <= 5) {
        console.log(`   Debug: ${extraction.filePath} -> ${namespace}`);
      }

      if (!this.namespaceExtractions[namespace]) {
        this.namespaceExtractions[namespace] = {};
      }

      let uniqueKey = extraction.key;
      let counter = 1;

      // Generate unique key if this key already exists with different text
      while (
        this.namespaceExtractions[namespace][uniqueKey] &&
        this.namespaceExtractions[namespace][uniqueKey].text !== extraction.text
      ) {
        uniqueKey = `${extraction.key}_${counter}`;
        counter++;
      }

      const existingKey = this.namespaceExtractions[namespace][uniqueKey];

      // Keep the first occurrence, but note duplicates
      if (existingKey) {
        existingKey.occurrences = (existingKey.occurrences || 1) + 1;
        existingKey.locations.push({
          file: extraction.filePath,
          position: extraction.position,
          context: extraction.context,
        });
      } else {
        this.namespaceExtractions[namespace][uniqueKey] = {
          text: extraction.text,
          key: uniqueKey,
          context: extraction.context,
          variables: extraction.variables || [],
          occurrences: 1,
          locations: [
            {
              file: extraction.filePath,
              position: extraction.position,
              context: extraction.context,
            },
          ],
        };
      }
    }
  }

  /**
   * Save extractions to translation files
   */
  saveExtractions() {
    console.log("💾 Saving extractions to translation files...");

    // Create output directory
    const outputDir = this.config.outputLocalesDir;
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Save for each language and namespace
    for (const language of this.config.languages) {
      const languageDir = path.join(outputDir, language);
      if (!existsSync(languageDir)) {
        mkdirSync(languageDir, { recursive: true });
      }

      for (const [namespace, strings] of Object.entries(this.namespaceExtractions)) {
        const translationData = this.buildTranslationData(strings);
        const filePath = path.join(languageDir, `${namespace}.json`);

        writeFileSync(
          filePath,
          JSON.stringify(translationData, null, this.config.jsonIndent),
          "utf8",
        );
      }
    }
  }

  /**
   * Build translation data structure from extractions
   */
  buildTranslationData(strings) {
    const data = {};

    for (const [key, info] of Object.entries(strings)) {
      // Handle nested keys (e.g., "buttons.save" -> { buttons: { save: "text" } })
      this.setNestedProperty(data, key, info.text);
    }

    return data;
  }

  /**
   * Set nested property in object (e.g., "buttons.save" -> { buttons: { save: "text" } })
   */
  setNestedProperty(obj, key, value) {
    const parts = key.split(".");
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Generate detailed extraction report
   */
  generateReport() {
    console.log("\n📊 Extraction Report:");
    console.log("=".repeat(50));

    // Overall stats
    console.log(`Files processed: ${this.stats.filesProcessed}`);
    console.log(`Total strings found: ${this.stats.stringsFound}`);
    console.log(`Template literals with variables: ${this.stats.templateLiterals}`);
    console.log(`JSX text content: ${this.stats.jsxText}`);
    console.log(`JSX attributes: ${this.stats.jsxCAttributes}`);
    console.log(`Property assignments: ${this.stats.propertyAssignments}`);
    console.log(`Array elements: ${this.stats.arrayElements}`);
    console.log(`Errors: ${this.stats.errors}`);

    // Namespace breakdown
    console.log("\n📂 Strings by Namespace:");
    for (const [namespace, strings] of Object.entries(this.namespaceExtractions)) {
      const uniqueKeys = Object.keys(strings).length;
      const totalOccurrences = Object.values(strings).reduce(
        (sum, info) => sum + info.occurrences,
        0,
      );
      console.log(
        `  ${namespace}: ${uniqueKeys} unique keys, ${totalOccurrences} total occurrences`,
      );
    }

    // Show sample extractions
    console.log("\n🔍 Sample Extractions:");
    const samples = this.extractions.slice(0, 10);
    samples.forEach((extraction, index) => {
      console.log(`  ${index + 1}. "${extraction.text}"`);
      console.log(`     Key: ${extraction.key}`);
      console.log(`     Context: ${extraction.context.type}`);
      if (extraction.variables && extraction.variables.length > 0) {
        console.log(
          `     Variables: ${extraction.variables.map((v) => v.name).join(", ")}`,
        );
      }
      console.log(`     File: ${path.basename(extraction.filePath)}`);
      console.log();
    });

    // Show template literals with variables
    if (this.stats.templateLiterals > 0) {
      console.log("📝 Template Literals with Variables:");
      const templateSamples = this.extractions
        .filter((e) => e.variables && e.variables.length > 0)
        .slice(0, 5);

      templateSamples.forEach((extraction, index) => {
        console.log(`  ${index + 1}. "${extraction.text}"`);
        console.log(
          `     Variables: ${extraction.variables.map((v) => `${v.name} (${v.type})`).join(", ")}`,
        );
        console.log(`     File: ${path.basename(extraction.filePath)}`);
        console.log();
      });
    }

    // Show duplicates
    const duplicates = Object.entries(this.namespaceExtractions).flatMap(
      ([namespace, strings]) =>
        Object.entries(strings)
          .filter(([key, info]) => info.occurrences > 1)
          .map(([key, info]) => ({ namespace, key, ...info })),
    );

    if (duplicates.length > 0) {
      console.log(`🔄 Found ${duplicates.length} duplicate strings:`);
      duplicates.slice(0, 5).forEach((dup) => {
        console.log(`  "${dup.text}" appears ${dup.occurrences} times`);
        console.log(`  Key: ${dup.namespace}.${dup.key}`);
        console.log(`  Locations: ${dup.locations.length} files`);
      });
    }

    console.log(`\n💾 Extractions saved to: ${this.config.outputLocalesDir}`);
    console.log("📋 Ready for merge with existing translations");
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    console.log(`
AST-based String Extraction Script

Usage: node extract-hardcoded-strings-ast.js [options]

Options:
  --help        Show this help message
  --debug       Show detailed error information

This script uses TypeScript Compiler API to comprehensively extract
user-facing strings from the codebase, including:

✅ String literals in user-facing contexts
✅ Template literals with variables
✅ Multi-line strings
✅ JSX text content and attributes
✅ Form labels and placeholders
✅ Error messages and validation text
✅ Array elements with user content

Configuration is loaded from i18next-parser.config.js for consistency
with the i18next-parser workflow.

The extracted strings are saved to the temporary directory and can be
merged with existing translations using the merge script.
    `);
    return;
  }

  // Set debug mode if requested
  if (args.includes("--debug")) {
    process.env.DEBUG = "true";
  }

  try {
    // Load configuration from i18next-parser.config.js
    const parserConfig = await loadParserConfig();
    const config = getI18nConfig(parserConfig);

    // Debug: Check configuration loading
    console.log("🔧 Debug - Configuration loaded:");
    console.log(`   Languages: ${config.languages.join(", ")}`);
    console.log(`   Namespaces: ${config.namespaces.join(", ")}`);
    console.log(`   OutputLocalesDir: ${config.outputLocalesDir}`);

    // Create and run extractor with loaded configuration
    const extractor = new ASTStringExtraction(config);
    await extractor.run();
  } catch (error) {
    console.error("❌ Failed to load configuration or run extraction:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("❌ Extraction failed:", error);
    process.exit(1);
  });
}

export { ASTStringExtraction };
