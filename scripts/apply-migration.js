#!/usr/bin/env node

/**
 * Apply I18n Migration Script
 *
 * This script actually applies the migration by replacing hardcoded strings
 * with translation keys and adding necessary imports.
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Import the analysis function
import {
  getFilesToProcess,
  getNamespaceHookMapping,
  inferNamespaceFromPath,
} from "./lib/i18n-config.js";

// Import the analysis function (which now also uses centralized config)
import { analyzeMigration, loadExistingTranslations } from "./simple-i18n-migration.js";

/**
 * Transform a single file by replacing strings with translation keys
 */
function transformFile(filePath, existingTranslations) {
  const fullPath = path.join(projectRoot, filePath);

  if (!existsSync(fullPath)) {
    return { file: filePath, transformed: false, changes: [] };
  }

  let content = readFileSync(fullPath, "utf8");
  const originalContent = content;

  // Skip if already using i18n properly
  if (content.includes("useTypedTranslation()") || content.includes("{ t }")) {
    return {
      file: filePath,
      transformed: false,
      changes: [],
      reason: "Already properly uses i18n",
    };
  }

  const changes = [];
  const namespace = inferNamespace(filePath);
  const hookName = getHookName(namespace);

  // First, check what strings we can actually replace
  const stringReplacements = replaceStringsWithTranslations(
    content,
    filePath,
    existingTranslations,
  );

  // Only add imports and hooks if we actually have strings to replace
  if (stringReplacements.changes.length > 0) {
    // Add import if needed
    if (!content.includes("useTypedTranslation")) {
      content = addTranslationImport(content, hookName);
      changes.push({ type: "import_added", hook: hookName });
    }

    // Add hook usage if needed
    if (!content.includes(`const { t } = ${hookName}()`)) {
      content = addTranslationUsage(content, hookName);
      changes.push({ type: "hook_usage_added", hook: hookName });
    }

    // Now apply the string replacements to the content that already has imports/hooks
    const finalReplacements = replaceStringsWithTranslations(
      content,
      filePath,
      existingTranslations,
    );
    content = finalReplacements.content;
    changes.push(...finalReplacements.changes);
  }

  // Write back if changed
  const transformed = content !== originalContent;
  if (transformed) {
    writeFileSync(fullPath, content);
  }

  return {
    file: filePath,
    transformed,
    changes,
    originalLength: originalContent.length,
    transformedLength: content.length,
  };
}

/**
 * Infer namespace from file path using configured mapping
 */
function inferNamespace(filePath) {
  return inferNamespaceFromPath(filePath);
}

/**
 * Get hook name for namespace using configured mapping
 */
function getHookName(namespace) {
  const hookMapping = getNamespaceHookMapping();
  return hookMapping[namespace] || "useCommonTranslation";
}

/**
 * Check if file needs translation import
 */
function needsTranslationImport(content) {
  const patterns = [
    /["']([A-Z][^"']{3,50}?)["']/g, // Capitalized strings
    />\s*([A-Z][^<{>\n]{3,50}?)\s*</g, // JSX content
    /<Button[^>]*>\s*([A-Z][^<{>\n]{2,30}?)\s*</g, // Button text
  ];

  return patterns.some((pattern) => pattern.test(content));
}

/**
 * Check if file needs translation hook usage
 */
function needsTranslationUsage(content, changes) {
  return changes.some((change) => change.type === "import_added");
}

/**
 * Add translation import
 */
function addTranslationImport(content, hookName) {
  const importStatement = `import { ${hookName} } from "~/hooks/useTypedTranslation";`;

  // Find existing imports
  const importRegex = /import[^;]+;/g;
  const imports = content.match(importRegex) || [];

  if (imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const insertPosition = content.lastIndexOf(lastImport) + lastImport.length;
    return (
      content.slice(0, insertPosition) +
      "\n" +
      importStatement +
      content.slice(insertPosition)
    );
  } else {
    return importStatement + "\n\n" + content;
  }
}

/**
 * Add translation hook usage
 */
function addTranslationUsage(content, hookName) {
  // Find component function with proper regex that captures the full signature INCLUDING the opening brace
  const functionPatterns = [
    // Function declarations: export function Name(params) {
    /(export\s+function\s+\w+\s*\([^)]*\)\s*\{)/,
    // Regular function declarations: function Name(params) {
    /(function\s+\w+\s*\([^)]*\)\s*\{)/,
    // Arrow function components: export const Name = (params) => {
    /(export\s+const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)/,
    // Regular arrow functions: const Name = (params) => {
    /(const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)/,
    // Function without parameters: export function Name() {
    /(export\s+function\s+\w+\s*\(\s*\)\s*\{)/,
    // Arrow without parameters: export const Name = () => {
    /(export\s+const\s+\w+\s*=\s*\(\s*\)\s*=>\s*\{)/,
  ];

  for (const pattern of functionPatterns) {
    const match = content.match(pattern);
    if (match) {
      // The match now includes the opening brace, so we can insert right after it
      const insertPosition = content.indexOf(match[0]) + match[0].length;
      const hookUsage = `\n  const { t } = ${hookName}();`;
      return content.slice(0, insertPosition) + hookUsage + content.slice(insertPosition);
    }
  }

  return content;
}

/**
 * Replace strings with translation keys
 */
function replaceStringsWithTranslations(content, filePath, existingTranslations) {
  let newContent = content;
  const changes = [];

  const patterns = [
    {
      regex: />\s*([A-Z][^<{>\n]{3,50}?)\s*</g,
      replacement: (match, text, offset) => {
        const key = findExistingTranslation(text, existingTranslations);
        if (key) {
          const namespace = key.split(".")[0];
          const keyPath = key.split(".").slice(1).join(".");
          changes.push({ type: "jsx_replaced", original: text, key });
          return `>{t('${keyPath}')}<`;
        }
        return match;
      },
    },
    {
      regex: /<Button[^>]*>\s*([A-Z][^<{>\n]{2,30}?)\s*</g,
      replacement: (match, text, offset) => {
        const key = findExistingTranslation(text, existingTranslations);
        if (key) {
          const namespace = key.split(".")[0];
          const keyPath = key.split(".").slice(1).join(".");
          changes.push({ type: "button_replaced", original: text, key });
          return match.replace(text, `{t('${keyPath}')}`);
        }
        return match;
      },
    },
    {
      regex: /["']([A-Z][^"']{3,50}?)["']/g,
      replacement: (match, text, offset) => {
        // Skip if it looks like a technical string
        if (isTechnicalString(text)) return match;

        const key = findExistingTranslation(text, existingTranslations);
        if (key) {
          const namespace = key.split(".")[0];
          const keyPath = key.split(".").slice(1).join(".");
          changes.push({ type: "string_replaced", original: text, key });
          return `t('${keyPath}')`;
        }
        return match;
      },
    },
  ];

  // Apply replacements in reverse order to maintain positions
  patterns.forEach(({ regex, replacement }) => {
    newContent = newContent.replace(regex, replacement);
  });

  return { content: newContent, changes };
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

/**
 * Check if string is technical
 */
function isTechnicalString(text) {
  const technicalPatterns = [
    /^[a-zA-Z][a-zA-Z0-9_]*$/, // Variable names
    /^https?:\/\//, // URLs
    /^[{}[\]()]+$/, // Brackets
    /^\s*$/, // Whitespace
    /^class\s+/, // Class definitions
    /^function\s+/, // Function definitions
    /^const\s+/, // Const declarations
    /^let\s+/, // Let declarations
    /^import\s+/, // Import statements
    /^export\s+/, // Export statements
    /^React$/, // React
    /^[A-Z][a-zA-Z]*Component$/, // Component names
  ];

  return technicalPatterns.some((pattern) => pattern.test(text.trim()));
}

/**
 * Apply migration to files
 */
function applyMigration(files, existingTranslations) {
  console.log("🔧 Applying migration to files...\n");

  const results = {
    processed: 0,
    transformed: 0,
    skipped: 0,
    totalChanges: 0,
    errors: 0,
    details: [],
  };

  files.forEach((filePath, index) => {
    try {
      process.stdout.write(
        `\rProcessing ${index + 1}/${files.length}: ${path.basename(filePath)}`,
      );

      const result = transformFile(filePath, existingTranslations);
      results.processed++;

      if (result.transformed) {
        results.transformed++;
        results.totalChanges += result.changes.length;
        results.details.push({
          file: filePath,
          changes: result.changes.length,
          types: result.changes.map((c) => c.type),
        });
      } else if (result.reason) {
        results.skipped++;
      }
    } catch (error) {
      console.error(`\n❌ Error processing ${filePath}:`, error.message);
      results.errors++;
    }
  });

  console.log("\n");
  return results;
}

/**
 * Main migration function
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--apply");

  if (args.includes("--help")) {
    console.log(`
Apply I18n Migration Script

Usage: node apply-migration.js [options]

Options:
  --dry-run     Show what would be changed without making changes (default)
  --apply       Actually apply the changes to files
  --help        Show this help message

This script replaces hardcoded strings with translation keys and adds
necessary imports to use the translation system.
    `);
    return;
  }

  try {
    console.log("🚀 Starting i18n migration...\n");

    // Load existing translations
    const existingTranslations = loadExistingTranslations();

    // Find files to process using configured patterns
    const files = await getFilesToProcess();
    console.log(`📁 Found ${files.length} files to process`);

    if (dryRun) {
      console.log("🔍 DRY RUN MODE - No files will be changed\n");

      // Just show analysis
      const analysis = analyzeMigration(true);

      // Show sample transformations for first few files
      console.log("\n📋 Sample transformations:");
      const sampleFiles = files.slice(0, 5);

      sampleFiles.forEach((filePath, index) => {
        console.log(`\n${index + 1}. ${filePath}`);

        // Show a few sample strings that would be replaced
        const fullPath = path.join(projectRoot, filePath);
        if (existsSync(fullPath)) {
          const content = readFileSync(fullPath, "utf8");
          const strings = content.match(/["']([A-Z][^"']{5,30}?)["']/g) || [];

          strings.slice(0, 3).forEach((str) => {
            const text = str.slice(1, -1); // Remove quotes
            const key = findExistingTranslation(text, existingTranslations);
            if (key) {
              console.log(`   "${text}" → {t('${key.split(".").slice(1).join(".")}')}`);
            }
          });
        }
      });

      console.log("\n💡 To apply these changes, run: node apply-migration.js --apply");
    } else {
      console.log("⚠️  WARNING: This will modify your files!\n");

      // Create a backup commit
      console.log("📋 Creating backup commit...");
      try {
        execSync("git add .", { cwd: projectRoot });
        execSync('git commit -m "Backup: before i18n migration"', { cwd: projectRoot });
        console.log("✅ Backup commit created");
      } catch (error) {
        console.warn("⚠️  Could not create backup commit:", error.message);
      }

      // Apply migration
      const results = applyMigration(files, existingTranslations);

      // Show results
      console.log("\n📊 Migration Results:");
      console.log("=".repeat(50));
      console.log(`Files processed: ${results.processed}`);
      console.log(`Files transformed: ${results.transformed}`);
      console.log(`Files skipped: ${results.skipped}`);
      console.log(`Total changes: ${results.totalChanges}`);
      console.log(`Errors: ${results.errors}`);

      if (results.details.length > 0) {
        console.log("\n📋 Files with changes:");
        results.details.forEach((detail) => {
          console.log(`  ${detail.file}: ${detail.changes} changes`);
        });
      }

      console.log("\n🎉 Migration completed!");
      console.log("\nNext steps:");
      console.log('1. Run "pnpm check-types" to verify no TypeScript errors');
      console.log('2. Run "pnpm i18n:generate-types" to update type definitions');
      console.log("3. Test the application: pnpm dev");
      console.log("4. Commit the changes if everything looks good");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { applyMigration };
