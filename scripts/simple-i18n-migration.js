#!/usr/bin/env node

/**
 * Simplified I18n Migration Script
 *
 * A streamlined version that works with Node.js built-ins and focuses on
 * the core migration functionality.
 *
 * Uses i18next-parser.config.js as the single source of truth for configuration.
 */

import { existsSync, readFileSync } from "fs";
import path from "path";

// Import centralized configuration
import {
  getFilesToProcess,
  getI18nConfig,
  inferNamespaceFromPath,
  isValidNamespace,
} from "./lib/i18n-config.js";

/**
 * Load existing translations from the JSON files using config
 */
function loadExistingTranslations() {
  const translations = {};

  // Use configured namespaces
  i18nConfig.namespaces.forEach((ns) => {
    translations[ns] = {};

    // Load default language translations as the source
    const defaultLangPath = path.join(
      i18nConfig.localesDir,
      i18nConfig.defaultLanguage,
      `${ns}.json`,
    );
    if (existsSync(defaultLangPath)) {
      try {
        translations[ns] = JSON.parse(readFileSync(defaultLangPath, "utf8"));
      } catch (error) {
        console.warn(`Warning: Could not parse ${defaultLangPath}`);
      }
    }
  });

  return translations;
}

/**
 * Find TypeScript/React files using configured patterns
 */
async function findFilesToProcess() {
  try {
    const files = await getFilesToProcess();
    return files;
  } catch (error) {
    console.warn("Could not find files using configured patterns:", error.message);
    return [];
  }
}

/**
 * Analyze a single file for hardcoded strings
 */
function analyzeFile(filePath, existingTranslations) {
  const fullPath = path.join(i18nConfig.projectRoot, filePath);

  if (!existsSync(fullPath)) {
    return { file: filePath, strings: [], hasI18n: false };
  }

  const content = readFileSync(fullPath, "utf8");

  // Skip if already using i18n
  if (content.includes("useTypedTranslation") || content.includes("useTranslation")) {
    return { file: filePath, strings: [], hasI18n: true };
  }

  const strings = [];

  // Simple regex patterns for common hardcoded strings
  const patterns = [
    // JSX text content
    />\s*([A-Z][^<{>\n]{3,50}?)\s*</g,
    // Button text
    /<Button[^>]*>\s*([A-Z][^<{>\n]{2,30}?)\s*</g,
    // String literals that look like UI text
    /["']([A-Z][^"']{3,50}?)["']/g,
    // Form labels
    /label:\s*["']([A-Z][^"']{3,30}?)["']/g,
    // Placeholder text
    /placeholder:\s*["']([A-Za-z][^"']{3,50}?)["']/g,
    // Error messages
    /message:\s*["']([A-Z][^"']{3,50}?)["']/g,
  ];

  patterns.forEach((pattern, patternIndex) => {
    let match;
    const regex = new RegExp(pattern);
    while ((match = regex.exec(content)) !== null) {
      const text = match[1];

      if (shouldTranslateString(text)) {
        const key =
          findExistingTranslation(text, existingTranslations) ||
          generateKey(text, filePath);

        strings.push({
          text,
          key,
          pattern: patternIndex,
          line: content.substring(0, match.index).split("\n").length,
        });
      }
    }
  });

  return { file: filePath, strings, hasI18n: false };
}

/**
 * Check if a string should be translated
 */
function shouldTranslateString(text) {
  if (!text || text.trim().length < 3) return false;

  // Exclude technical strings
  const excludePatterns = [
    /^[a-zA-Z][a-zA-Z0-9_]*$/, // Variable names
    /^https?:\/\//, // URLs
    /^[{}[\]()]+$/, // Brackets and symbols
    /^\s*$/, // Whitespace only
    /^class\s+/, // Class definitions
    /^function\s+/, // Function definitions
    /^const\s+/, // Const declarations
    /^let\s+/, // Let declarations
    /^import\s+/, // Import statements
    /^export\s+/, // Export statements
    /^React$/, // React import
    /^div$|^span$|^button$/, // HTML tags
    /^[A-Z][a-zA-Z]*Component$/, // Component names
  ];

  return !excludePatterns.some((pattern) => pattern.test(text.trim()));
}

/**
 * Find existing translation for text
 */
function findExistingTranslation(text, existingTranslations) {
  for (const [namespace, translations] of Object.entries(existingTranslations)) {
    const result = searchInObject(translations, text);
    if (result.path) {
      return `${namespace}.${result.path}`;
    }
  }
  return null;
}

/**
 * Search for text in nested object and return path
 */
function searchInObject(obj, text, path = "") {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof value === "string" && value === text) {
      return { path: currentPath };
    }

    if (typeof value === "object" && value !== null) {
      const result = searchInObject(value, text, currentPath);
      if (result.path) {
        return result;
      }
    }
  }
  return { path: null };
}

// Load configuration at module level
const i18nConfig = getI18nConfig();

/**
 * Generate translation key for text using configured namespaces
 */
function generateKey(text, filePath) {
  // Use configured namespace inference
  const namespace = inferNamespaceFromPath(filePath);

  // Validate namespace
  if (!isValidNamespace(namespace)) {
    console.warn(
      `Warning: Invalid namespace "${namespace}" inferred from ${filePath}, using default`,
    );
  }

  // Convert text to key format
  const keyText = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 40);

  // Determine key type based on context
  let keyType = "content";
  if (text.toLowerCase().includes("button") || text.length < 20) keyType = "buttons";
  else if (text.toLowerCase().includes("error") || text.toLowerCase().includes("invalid"))
    keyType = "errors";
  else if (text.toLowerCase().includes("create") || text.toLowerCase().includes("new"))
    keyType = "actions";

  return `${namespace}.${keyType}.${keyText}`;
}

/**
 * Main migration analysis
 */
async function analyzeMigration(dryRun = true) {
  console.log("🔍 Analyzing i18n migration...\n");

  try {
    const existingTranslations = loadExistingTranslations();
    const files = await findFilesToProcess();

    console.log(`📁 Found ${files.length} files to analyze`);

    const results = {
      totalFiles: files.length,
      filesWithI18n: 0,
      filesWithStrings: 0,
      totalStrings: 0,
      existingMatches: 0,
      newKeys: 0,
      fileDetails: [],
    };

    console.log("📊 Analyzing files...\n");

    files.forEach((filePath) => {
      try {
        const analysis = analyzeFile(filePath, existingTranslations);

        if (analysis.hasI18n) {
          results.filesWithI18n++;
        } else if (analysis.strings.length > 0) {
          results.filesWithStrings++;
          results.totalStrings += analysis.strings.length;

          const existingMatches = analysis.strings.filter(
            (s) => s.key && existingTranslations[s.key.split(".")[0]],
          );
          results.existingMatches += existingMatches.length;
          results.newKeys += analysis.strings.length - existingMatches.length;

          results.fileDetails.push({
            file: filePath,
            stringCount: analysis.strings.length,
            existingMatches: existingMatches.length,
            newKeys: analysis.strings.length - existingMatches.length,
            strings: analysis.strings.slice(0, 3), // Show first 3 strings
          });
        }
      } catch (error) {
        console.warn(`Warning: Error analyzing ${filePath}:`, error.message);
      }
    });

    // Print results
    console.log("📈 Migration Analysis Results:");
    console.log("=".repeat(50));
    console.log(`Total files analyzed: ${results.totalFiles}`);
    console.log(`Files already using i18n: ${results.filesWithI18n}`);
    console.log(`Files with hardcoded strings: ${results.filesWithStrings}`);
    console.log(`Total hardcoded strings found: ${results.totalStrings}`);
    console.log(`Existing translation matches: ${results.existingMatches}`);
    console.log(`New translation keys needed: ${results.newKeys}`);

    if (results.fileDetails.length > 0) {
      console.log("\n📋 Files requiring migration (top 10):");
      results.fileDetails
        .sort((a, b) => b.stringCount - a.stringCount)
        .slice(0, 10)
        .forEach((detail, index) => {
          console.log(`\n${index + 1}. ${detail.file}`);
          console.log(
            `   🔄 ${detail.stringCount} strings (${detail.existingMatches} existing, ${detail.newKeys} new)`,
          );

          if (detail.strings.length > 0) {
            console.log("   Sample transformations:");
            detail.strings.forEach((str, i) => {
              const matchType = str.key.includes(".") ? "✅" : "➕";
              console.log(`     ${matchType} "${str.text}" → ${str.key}`);
            });
          }
        });
    }

    console.log("\n🎯 Recommended Next Steps:");
    if (results.newKeys > 0) {
      console.log("   1. Review the analysis above");
      console.log("   2. Add missing translation keys to JSON files");
      console.log('   3. Run "pnpm i18n:generate-types"');
      console.log("   4. Apply migration manually or with automated script");
    } else {
      console.log("   🎉 Most strings have existing translations!");
      console.log('   1. Run "pnpm i18n:generate-types"');
      console.log("   2. Consider applying automated migration");
    }

    return results;
  } catch (error) {
    console.error("❌ Error during analysis:", error.message);
    console.error(error.stack);
    throw error;
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--apply");

  if (args.includes("--help")) {
    console.log(`
Simplified I18n Migration Script

Usage: node simple-i18n-migration.js [options]

Options:
  --dry-run     Show analysis without making changes (default)
  --apply       Apply changes to files (NOT IMPLEMENTED YET)
  --help        Show this help message

This script analyzes your codebase for hardcoded strings that should be internationalized.
It checks for existing translations and generates new translation keys where needed.
    `);
    return;
  }

  try {
    await analyzeMigration(dryRun);
  } catch (error) {
    console.error("❌ Migration analysis failed:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeMigration, findExistingTranslation, loadExistingTranslations };
