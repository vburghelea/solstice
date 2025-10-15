#!/usr/bin/env node

/**
 * Post-Migration Whitespace Fix Script
 *
 * Cleans up locale JSON files after AST extraction by:
 * - Fixing malformed newline characters (\n sequences)
 * - Normalizing multiple consecutive whitespaces
 * - Removing trailing/leading whitespace from values
 * - Fixing escaped quotes and other common encoding issues
 * - Preserving proper JSON formatting
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

/**
 * Clean up translation text by fixing whitespace and formatting issues
 */
function cleanTranslationText(text) {
  if (typeof text !== "string") {
    return text;
  }

  let cleaned = text;

  // Fix literal "\n" sequences to spaces (flatten to single line)
  cleaned = cleaned.replace(/\\n/g, " ");

  // Fix double backslashes that might be escaped newlines to spaces
  cleaned = cleaned.replace(/\\\\n/g, " ");

  // Fix literal "\t" sequences to spaces
  cleaned = cleaned.replace(/\\t/g, " ");

  // Fix escaped quotes that shouldn't be escaped in JSON values
  cleaned = cleaned.replace(/\\"/g, '"');

  // Replace all actual newlines with spaces to flatten to single line
  cleaned = cleaned.replace(/\n+/g, " ");

  // Normalize multiple consecutive whitespaces (including tabs) to single spaces
  cleaned = cleaned.replace(/[ \t]+/g, " ");

  // Remove leading and trailing whitespace from the entire text
  cleaned = cleaned.trim();

  // Fix common spacing issues around punctuation
  cleaned = cleaned.replace(/\s+([.,;:!?])/g, "$1"); // Space before punctuation
  cleaned = cleaned.replace(/([.,;:!?])\s+/g, "$1 "); // Space after punctuation (if not already there)

  // Fix spacing around parentheses
  cleaned = cleaned.replace(/\s*\(\s*/g, " ("); // Before opening parenthesis
  cleaned = cleaned.replace(/\s*\)\s*/g, ") "); // After closing parenthesis

  // Remove extra spaces before apostrophes
  cleaned = cleaned.replace(/\s+'/g, "'");

  // Final cleanup of any remaining multiple spaces
  cleaned = cleaned.replace(/ +/g, " ");

  return cleaned;
}

/**
 * Recursively clean all string values in a nested object
 */
function cleanTranslationsRecursively(obj) {
  if (typeof obj === "string") {
    return cleanTranslationText(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => cleanTranslationsRecursively(item));
  }

  if (obj && typeof obj === "object") {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = cleanTranslationsRecursively(value);
    }
    return cleaned;
  }

  return obj;
}

/**
 * Load and parse a JSON file safely
 */
function loadJsonFile(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.warn(`⚠️  Warning: Could not parse ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Save JSON file with proper formatting
 */
function saveJsonFile(filePath, data) {
  try {
    const jsonContent = JSON.stringify(data, null, 2);
    writeFileSync(filePath, jsonContent + "\n", "utf8");
    return true;
  } catch (error) {
    console.warn(`⚠️  Warning: Could not save ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Process all locale files in a directory
 */
function processLocaleDirectory(localeDir, language) {
  if (!existsSync(localeDir)) {
    console.warn(`⚠️  Locale directory not found: ${localeDir}`);
    return { filesProcessed: 0, filesUpdated: 0, errors: 0 };
  }

  const stats = { filesProcessed: 0, filesUpdated: 0, errors: 0 };
  const files = readdirSync(localeDir).filter((file) => file.endsWith(".json"));

  console.log(`📁 Processing ${language} locale directory: ${localeDir}`);
  console.log(`   Found ${files.length} JSON files`);

  for (const file of files) {
    const filePath = path.join(localeDir, file);

    try {
      // Load original file
      const originalData = loadJsonFile(filePath);
      if (!originalData) {
        stats.errors++;
        continue;
      }

      // Clean the translation data
      const cleanedData = cleanTranslationsRecursively(originalData);

      // Check if anything changed
      const originalJson = JSON.stringify(originalData, null, 2);
      const cleanedJson = JSON.stringify(cleanedData, null, 2);

      if (originalJson !== cleanedJson) {
        // Save the cleaned data
        if (saveJsonFile(filePath, cleanedData)) {
          stats.filesUpdated++;
          console.log(`   ✅ Updated: ${file}`);
        } else {
          stats.errors++;
        }
      } else {
        console.log(`   ⏭️  No changes needed: ${file}`);
      }

      stats.filesProcessed++;
    } catch (error) {
      console.warn(`   ❌ Error processing ${file}: ${error.message}`);
      stats.errors++;
    }
  }

  return stats;
}

/**
 * Main cleanup class
 */
class WhitespaceFixer {
  constructor(localesDir) {
    this.localesDir = localesDir;
    this.languages = ["en", "de", "pl"];
    this.stats = {
      totalFilesProcessed: 0,
      totalFilesUpdated: 0,
      totalErrors: 0,
      languageStats: {},
    };
  }

  /**
   * Run the whitespace fixing process
   */
  async run() {
    try {
      console.log("🧹 Starting post-migration whitespace cleanup...");
      console.log(`   Locales directory: ${this.localesDir}`);
      console.log(`   Languages: ${this.languages.join(", ")}`);

      // Process each language directory
      for (const language of this.languages) {
        const localeDir = path.join(this.localesDir, language);
        const langStats = processLocaleDirectory(localeDir, language);

        this.stats.languageStats[language] = langStats;
        this.stats.totalFilesProcessed += langStats.filesProcessed;
        this.stats.totalFilesUpdated += langStats.filesUpdated;
        this.stats.totalErrors += langStats.errors;
      }

      // Generate report
      this.generateReport();

      console.log("✅ Post-migration whitespace cleanup completed!");
    } catch (error) {
      console.error("❌ Error during cleanup:", error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Generate detailed cleanup report
   */
  generateReport() {
    console.log("\n📊 Cleanup Report:");
    console.log("=".repeat(50));

    // Overall stats
    console.log(`Total files processed: ${this.stats.totalFilesProcessed}`);
    console.log(`Total files updated: ${this.stats.totalFilesUpdated}`);
    console.log(`Total errors: ${this.stats.totalErrors}`);

    // Language breakdown
    console.log("\n📂 Files by Language:");
    for (const [language, langStats] of Object.entries(this.stats.languageStats)) {
      console.log(`  ${language}:`);
      console.log(`    Files processed: ${langStats.filesProcessed}`);
      console.log(`    Files updated: ${langStats.filesUpdated}`);
      console.log(`    Errors: ${langStats.errors}`);
    }

    // Show sample improvements
    if (this.stats.totalFilesUpdated > 0) {
      console.log("\n🔧 Common fixes applied:");
      console.log(
        "  • Converted newline characters to single spaces (flattened multiline text)",
      );
      console.log("  • Normalized multiple consecutive whitespaces to single spaces");
      console.log("  • Removed leading/trailing whitespace from values");
      console.log("  • Fixed escaped quotes and formatting issues");
      console.log("  • Normalized spacing around punctuation");
    }
  }
}

/**
 * Load configuration from i18next-parser.config.js
 */
async function loadParserConfig() {
  const configPath = path.join(projectRoot, "i18next-parser.config.js");

  if (!existsSync(configPath)) {
    throw new Error(`i18next-parser.config.js not found at ${configPath}`);
  }

  try {
    const configModule = await import(configPath);
    return configModule.default;
  } catch (error) {
    throw new Error(`Failed to load i18next-parser config: ${error.message}`);
  }
}

/**
 * Extract locales directory from parser config
 */
function getLocalesDirectory(parserConfig) {
  const options = parserConfig.options || {};
  const savePath = options.resource?.savePath || "temp-locales/{{lng}}/{{ns}}.json";

  // Extract the base directory from the save path
  const baseDir = savePath
    .replace("{{lng}}", "")
    .replace("{{ns}}", "placeholder.json")
    .replace(/\/[^\/]*$/, "");

  return path.resolve(projectRoot, baseDir);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    console.log(`
Post-Migration Whitespace Fix Script

Usage: node fix-whitespace-multiline.js [options]

Options:
  --help        Show this help message
  --debug       Show detailed error information
  --dry-run     Show what would be changed without making changes

This script cleans up locale JSON files after AST extraction by:

✅ Converting newline characters to single spaces (flattens multiline text)
✅ Normalizing multiple consecutive whitespaces to single spaces
✅ Removing leading/trailing whitespace from values
✅ Fixing escaped quotes and encoding issues
✅ Preserving proper JSON formatting
✅ Processing all configured languages and namespaces

Configuration is loaded from i18next-parser.config.js for consistency
with the extraction workflow.
    `);
    return;
  }

  // Set debug mode if requested
  if (args.includes("--debug")) {
    process.env.DEBUG = "true";
  }

  // Check for dry run mode
  const isDryRun = args.includes("--dry-run");
  if (isDryRun) {
    console.log("🔍 DRY RUN MODE - No files will be modified");
  }

  try {
    // Load configuration to get locales directory
    const parserConfig = await loadParserConfig();
    const localesDir = getLocalesDirectory(parserConfig);

    console.log("🔧 Debug - Configuration loaded:");
    console.log(`   Locales directory: ${localesDir}`);
    console.log(`   Dry run: ${isDryRun}`);

    if (!existsSync(localesDir)) {
      console.error(`❌ Locales directory not found: ${localesDir}`);
      process.exit(1);
    }

    // Create and run whitespace fixer
    const fixer = new WhitespaceFixer(localesDir);

    if (isDryRun) {
      // Override the save method to prevent actual file changes
      const originalSave = saveJsonFile;
      saveJsonFile = (filePath, data) => {
        console.log(`   📝 Would update: ${path.basename(filePath)}`);
        return true;
      };

      await fixer.run();

      // Restore original method
      saveJsonFile = originalSave;
    } else {
      await fixer.run();
    }
  } catch (error) {
    console.error("❌ Failed to run whitespace cleanup:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  });
}

export { cleanTranslationText, WhitespaceFixer };
