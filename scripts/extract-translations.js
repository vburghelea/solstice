#!/usr/bin/env node

/**
 * Safe i18n Translation Extraction Script
 *
 * This script extracts translation keys from the codebase and merges them
 * with existing translations, preserving any existing translations that
 * might not be currently used in the code.
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Import centralized configuration
import config, { loadParserConfig } from "./lib/i18n-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize configuration from centralized config
 */
function initializeConfig() {
  const parserConfig = loadParserConfig();
  const options = parserConfig.options || {};

  return {
    // Paths - use centralized config
    tempLocalesDir: config.tempLocalesDir,
    localesDir: config.localesDir,
    projectRoot: config.projectRoot,

    // Language and namespace settings - use centralized config
    languages: config.languages,
    namespaces: config.namespaces,
    defaultLanguage: config.defaultLanguage,
    defaultNamespace: config.defaultNamespace,

    // Parser options
    inputPatterns: config.inputPatterns,
    tempSavePath: config.tempLocalesDir,

    // Formatting options - use centralized config
    jsonIndent: config.jsonIndent,
    lineEnding: config.lineEnding,

    // Original parser config for reference
    parserConfig,
  };
}

// Initialize configuration
const CONFIG = initializeConfig();

/**
 * Deep merge two objects, preserving existing values
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      // Only add new keys, don't overwrite existing ones
      if (!(key in result)) {
        result[key] = source[key];
      }
    }
  }

  return result;
}

/**
 * Load existing translations from disk
 */
function loadExistingTranslations() {
  const existing = {};

  for (const lang of CONFIG.languages) {
    existing[lang] = {};

    for (const ns of CONFIG.namespaces) {
      const filePath = path.join(CONFIG.localesDir, lang, `${ns}.json`);

      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, "utf8");
          existing[lang][ns] = JSON.parse(content);
        } catch (error) {
          console.warn(`Warning: Could not parse ${filePath}, using empty object`);
          existing[lang][ns] = {};
        }
      } else {
        existing[lang][ns] = {};
      }
    }
  }

  return existing;
}

/**
 * Load newly extracted translations from temp directory
 */
function loadNewTranslations() {
  const newTranslations = {};

  for (const lang of CONFIG.languages) {
    newTranslations[lang] = {};

    for (const ns of CONFIG.namespaces) {
      const filePath = path.join(CONFIG.tempLocalesDir, lang, `${ns}.json`);

      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, "utf8");
          newTranslations[lang][ns] = JSON.parse(content);
        } catch (error) {
          console.warn(`Warning: Could not parse extracted file ${filePath}`);
          newTranslations[lang][ns] = {};
        }
      } else {
        newTranslations[lang][ns] = {};
      }
    }
  }

  return newTranslations;
}

/**
 * Save merged translations back to disk
 */
function saveMergedTranslations(mergedTranslations) {
  for (const lang of CONFIG.languages) {
    const langDir = path.join(CONFIG.localesDir, lang);

    // Ensure directory exists
    if (!existsSync(langDir)) {
      mkdirSync(langDir, { recursive: true });
    }

    for (const ns of CONFIG.namespaces) {
      const filePath = path.join(langDir, `${ns}.json`);
      const content = JSON.stringify(
        mergedTranslations[lang][ns],
        null,
        CONFIG.jsonIndent,
      );

      writeFileSync(filePath, content + CONFIG.lineEnding, "utf8");
    }
  }
}

/**
 * Clean up temporary directory
 */
function cleanup() {
  try {
    execSync(`rm -rf "${CONFIG.tempLocalesDir}"`, { stdio: "inherit" });
  } catch (error) {
    console.warn("Warning: Could not clean up temp directory:", error.message);
  }
}

/**
 * Main extraction process
 */
function main() {
  try {
    console.log("🔍 Extracting translations from codebase...");
    console.log(`   Using config from i18next-parser.config.js`);
    console.log(`   Languages: ${CONFIG.languages.join(", ")}`);
    console.log(`   Namespaces: ${CONFIG.namespaces.length} found`);

    // Clean up any existing temp directory
    cleanup();

    // Build input pattern from config
    const inputPatterns = CONFIG.inputPatterns.join(" ");

    // Run i18next parser to extract translations to temp directory
    execSync(`npx i18next-parser --config i18next-parser.config.js "${inputPatterns}"`, {
      stdio: "inherit",
      cwd: CONFIG.projectRoot,
    });

    console.log("📚 Loading existing translations...");
    const existingTranslations = loadExistingTranslations();

    console.log("🆕 Loading newly extracted translations...");
    const newTranslations = loadNewTranslations();

    console.log("🔀 Merging translations...");
    const mergedTranslations = {};

    for (const lang of CONFIG.languages) {
      mergedTranslations[lang] = {};

      for (const ns of CONFIG.namespaces) {
        const existing = existingTranslations[lang][ns] || {};
        const newlyExtracted = newTranslations[lang][ns] || {};

        // Merge: preserve existing translations, add new ones
        mergedTranslations[lang][ns] = deepMerge(existing, newlyExtracted);

        const existingKeyCount = Object.keys(flattenObject(existing)).length;
        const newKeyCount = Object.keys(flattenObject(newlyExtracted)).length;
        const mergedKeyCount = Object.keys(
          flattenObject(mergedTranslations[lang][ns]),
        ).length;

        console.log(
          `  ${lang}/${ns}: ${existingKeyCount} existing + ${newKeyCount} new = ${mergedKeyCount} total keys`,
        );
      }
    }

    console.log("💾 Saving merged translations...");
    saveMergedTranslations(mergedTranslations);

    console.log("🧹 Cleaning up...");
    cleanup();

    console.log("✅ Translation extraction completed successfully!");
    console.log("\n📊 Summary:");
    console.log("   • Existing translations preserved");
    console.log("   • New translation keys added");
    console.log("   • No translations were lost");
    console.log(`   • Configuration loaded from i18next-parser.config.js`);
  } catch (error) {
    console.error("❌ Error during translation extraction:", error.message);
    cleanup();
    process.exit(1);
  }
}

/**
 * Helper function to flatten an object for counting keys
 */
function flattenObject(obj, prefix = "") {
  const flattened = {};

  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      Object.assign(flattened, flattenObject(obj[key], newKey));
    } else {
      flattened[newKey] = obj[key];
    }
  }

  return flattened;
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  deepMerge,
  flattenObject,
  initializeConfig,
  loadExistingTranslations,
  loadNewTranslations,
  main,
  saveMergedTranslations,
};
