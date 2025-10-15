#!/usr/bin/env node

/**
 * Generate TypeScript types from translation files
 * This script reads JSON translation files and generates TypeScript type definitions
 * Uses i18next-parser configuration for consistency.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Load i18next-parser configuration
const i18nextConfig = await import(path.join(projectRoot, "i18next-parser.config.js"));

// Extract configuration from i18next-parser config
const CONFIG = {
  languages: i18nextConfig.default.options.lngs,
  defaultLanguage: i18nextConfig.default.options.defaultLng,
  defaultNs: i18nextConfig.default.options.defaultNs,
  localesDir: path.join(
    projectRoot,
    i18nextConfig.default.options.resource.loadPath
      .replace("{{lng}}/", "")
      .replace("/{{ns}}.json", ""),
  ),
  namespaces: i18nextConfig.default.options.ns,
};

const EN_LOCALE_DIR = path.join(CONFIG.localesDir, CONFIG.defaultLanguage);
const TYPES_OUTPUT_FILE = path.join(projectRoot, "src/lib/i18n/generated-types.ts");

/**
 * Convert a nested object to TypeScript interface with dot notation keys
 */
function generateKeys(obj, prefix = "") {
  const keys = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        keys.push(...generateKeys(value, fullKey));
      } else {
        keys.push(`'${fullKey}'`);
      }
    }
  }

  return keys;
}

/**
 * Generate TypeScript types for a namespace with namespace prefix
 */
function generateNamespaceTypeWithPrefix(namespace, translations) {
  const keys = generateKeys(translations, namespace);

  // Skip empty namespaces
  if (keys.length === 0) {
    return `export type ${capitalize(namespace).replace(/-/g, "")}TranslationKeys = never;`;
  }

  // Convert namespace to valid TypeScript identifier (remove hyphens, etc.)
  const typeName = capitalize(namespace).replace(/[^a-zA-Z0-9]/g, "");

  return `export type ${typeName}TranslationKeys =\n  ${keys.join(" |\n  ")};`;
}

/**
 * Generate TypeScript types for a namespace
 */
function generateNamespaceType(namespace, translations) {
  const keys = generateKeys(translations);

  // Skip empty namespaces
  if (keys.length === 0) {
    return `export type ${capitalize(namespace).replace(/-/g, "")}TranslationKeys = never;`;
  }

  // Convert namespace to valid TypeScript identifier (remove hyphens, etc.)
  const typeName = capitalize(namespace).replace(/[^a-zA-Z0-9]/g, "");

  return `export type ${typeName}TranslationKeys =\n  ${keys.join(" |\n  ")};`;
}

/**
 * Capitalize first letter and handle special characters
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate all translation types
 */
function generateTranslationTypes() {
  console.log("🔧 Generating TypeScript types from translation files...");
  console.log(`   Using i18next-parser configuration`);
  console.log(`   Languages: ${CONFIG.languages.join(", ")}`);
  console.log(`   Namespaces: ${CONFIG.namespaces.join(", ")}`);
  console.log(`   Default language: ${CONFIG.defaultLanguage}`);

  const types = [];
  const allKeys = new Set();

  // Process each namespace from configuration
  for (const namespace of CONFIG.namespaces) {
    const filePath = path.join(EN_LOCALE_DIR, `${namespace}.json`);

    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, "utf8");
        const translations = JSON.parse(content);

        // Generate namespace type
        const namespaceType = generateNamespaceTypeWithPrefix(namespace, translations);
        types.push(namespaceType);

        // Collect all keys
        const keys = generateKeys(translations, namespace);
        keys.forEach((key) => allKeys.add(key));

        console.log(`  ✓ Processed ${namespace}: ${keys.length} keys`);
      } catch (error) {
        console.warn(`  ⚠️  Warning: Could not process ${namespace}: ${error.message}`);
      }
    } else {
      console.warn(`  ⚠️  Warning: Translation file not found: ${filePath}`);
    }
  }

  // Generate combined type
  const allKeysArray = Array.from(allKeys).sort();
  const combinedType = `/**
 * All translation keys across all namespaces
 * Auto-generated from translation files
 */
export type AllTranslationKeys =\n  ${allKeysArray.join(" |\n  ")};`;

  // Generate file header
  const header = `/**
 * AUTO-GENERATED: TypeScript types for translation keys
 * Generated from: src/lib/i18n/locales/en/*.json
 * DO NOT EDIT MANUALLY - run "pnpm i18n:generate-types" to regenerate
 * Generated: ${new Date().toISOString()}
 */

`;

  // Combine all types
  const fullContent = header + combinedType + "\n\n" + types.join("\n\n");

  // Write to file
  writeFileSync(TYPES_OUTPUT_FILE, fullContent, "utf8");
  console.log(`✅ Generated types written to: ${TYPES_OUTPUT_FILE}`);
  console.log(`📊 Total keys generated: ${allKeysArray.length}`);
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    generateTranslationTypes();
  } catch (error) {
    console.error("❌ Error generating translation types:", error.message);
    process.exit(1);
  }
}

export { generateTranslationTypes };
