#!/usr/bin/env node

/**
 * Improved AST-based Apply i18n Migration Script
 *
 * This script uses the robust ASTI18nTransformer for surgical, context-aware
 * string transformations that properly exclude technical content.
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Import the robust AST transformer
import { ASTI18nTransformer } from "./lib/ast-i18n-transformer.js";

// Import configuration
import {
  getFilesToProcess,
  inferNamespaceFromPath,
  loadExistingTranslations,
} from "./lib/i18n-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

/**
 * Enhanced file processor using the robust AST transformer
 */
class EnhancedFileProcessor {
  constructor(existingTranslations = {}) {
    this.existingTranslations = existingTranslations;
    this.transformer = new ASTI18nTransformer(existingTranslations);
  }

  /**
   * Process a single file with surgical precision
   */
  processFile(filePath, dryRun = false) {
    try {
      const content = readFileSync(filePath, "utf8");

      // Check if file needs hook placement fixing
      const hasEarlyTCalls = this.transformer.hasEarlyTCalls(content);
      const hasHookImport = content.includes("useTypedTranslation");
      const hasHookDefinition =
        content.includes("const { t } = ") && content.includes("Translation();");

      // Skip only if properly set up with correct hook placement
      if (
        this.transformer.hasProperI18nSetup(content) &&
        !hasEarlyTCalls &&
        hasHookImport &&
        hasHookDefinition
      ) {
        return {
          success: true,
          changed: false,
          reason: "Already properly uses i18n with correct hook placement",
          changes: [],
          stats: { processed: 1, skipped: 1 },
        };
      }

      // Infer namespace from file path
      const namespace = inferNamespaceFromPath(filePath);
      const hookName = this.transformer.getHookName(namespace);

      // Analyze and transform using the robust AST transformer
      const result = this.transformer.transformFile(filePath, namespace);

      // Check if file was excluded
      if (result.excluded) {
        return {
          success: true,
          changed: false,
          reason: result.reason,
          changes: [],
          stats: { processed: 1, excluded: 1 },
        };
      }

      if (result.changes.length === 0) {
        return {
          success: true,
          changed: false,
          reason: "No user-facing strings found",
          changes: [],
          stats: { processed: 1, noStrings: 1 },
        };
      }

      let transformedContent = result.content;

      // Add import and hook usage if changes were made OR if hook placement needs fixing
      const needsHookPlacement = hasEarlyTCalls && !hasHookDefinition;

      if (result.changes.length > 0 || needsHookPlacement) {
        // Add translation import if missing
        if (!transformedContent.includes("useTypedTranslation")) {
          transformedContent = this.transformer.insertTranslationImport(
            transformedContent,
            hookName,
          );
          result.changes.unshift({
            type: "import_added",
            hook: hookName,
            namespace,
          });
        }

        // Add hook usage if missing or poorly placed
        if (
          !transformedContent.includes(`const { t } = ${hookName}()`) ||
          needsHookPlacement
        ) {
          // Remove existing hook definitions if they exist but are poorly placed
          const hookRegex = new RegExp(
            `const\\s*\\{\\s*t\\s*\\}\\s*=\\s*${hookName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\(\\);?`,
            "g",
          );
          transformedContent = transformedContent.replace(hookRegex, "");

          transformedContent = this.transformer.insertTranslationUsage(
            transformedContent,
            hookName,
          );
          result.changes.unshift({
            type: needsHookPlacement ? "hook_placement_fixed" : "hook_usage_added",
            hook: hookName,
            namespace,
          });
        }
      }

      // Write file if not dry run
      if (!dryRun && transformedContent !== content) {
        writeFileSync(filePath, transformedContent, "utf8");
      }

      return {
        success: true,
        changed: transformedContent !== content,
        changes: result.changes,
        stats: {
          processed: 1,
          transformed: 1,
          stringsFound: result.stringLiterals,
          newKeys: result.newKeys,
          existingKeys: result.existingKeys,
        },
      };
    } catch (error) {
      return {
        success: false,
        changed: false,
        error: error.message,
        changes: [],
        stats: { processed: 1, errors: 1 },
      };
    }
  }
}

/**
 * Main migration function with improved reporting
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--apply");
  const verbose = args.includes("--verbose");

  if (args.includes("--help")) {
    console.log(`
Improved AST-based Apply i18n Migration Script

Usage: node improved-apply-ast-migration.js [options]

Options:
  --dry-run     Show what would be changed without making changes (default)
  --apply       Actually apply the changes to files
  --verbose     Show detailed output including each transformation
  --help        Show this help message

This script uses the robust ASTI18nTransformer for surgical transformations:

✅ Semantic understanding of code structure
✅ Proper context detection for user-facing strings
✅ Automatic exclusion of imports, CSS classes, and technical strings
✅ Surgical import and hook insertion
✅ Preserves code formatting and functionality

Key improvements over the original:
- Uses TypeScript Compiler API instead of regex patterns
- Properly identifies and protects technical content
- Better namespace inference and hook management
- More reliable transformation with fewer false positives
    `);
    return;
  }

  try {
    console.log("🚀 Starting improved AST-based i18n migration...\n");

    // Load existing translations
    console.log("📚 Loading existing translations...");
    const existingTranslations = loadExistingTranslations();
    console.log(`   Loaded ${Object.keys(existingTranslations).length} namespaces`);

    // Find files to process
    console.log("🔍 Finding files to process...");
    const files = await getFilesToProcess();
    console.log(`   Found ${files.length} files to process\n`);

    if (dryRun) {
      console.log("🔍 DRY RUN MODE - No files will be changed\n");
    }

    const results = {
      processed: 0,
      transformed: 0,
      skipped: 0,
      noStrings: 0,
      excluded: 0,
      errors: 0,
      totalChanges: 0,
      totalStrings: 0,
      newKeys: 0,
      existingKeys: 0,
      details: [],
    };

    const processor = new EnhancedFileProcessor(existingTranslations);

    // Process files
    for (let i = 0; i < files.length; i++) {
      const filePath = files[i];
      process.stdout.write(
        `\r${dryRun ? "Analyzing" : "Processing"} ${i + 1}/${files.length}: ${path.basename(filePath)}`,
      );

      try {
        const result = processor.processFile(filePath, dryRun);

        // Update stats
        results.processed += result.stats.processed || 0;
        results.transformed += result.stats.transformed || 0;
        results.skipped += result.stats.skipped || 0;
        results.noStrings += result.stats.noStrings || 0;
        results.excluded += result.stats.excluded || 0;
        results.errors += result.stats.errors || 0;
        results.totalChanges += result.changes.length;
        results.totalStrings += result.stats.stringsFound || 0;
        results.newKeys += result.stats.newKeys || 0;
        results.existingKeys += result.stats.existingKeys || 0;

        if (result.changed && verbose) {
          results.details.push({
            file: filePath,
            changes: result.changes.length,
            strings: result.stats.stringsFound || 0,
            newKeys: result.stats.newKeys || 0,
            existingKeys: result.stats.existingKeys || 0,
            reason: result.reason,
          });
        }

        if (result.error) {
          console.error(`\n❌ Error processing ${filePath}: ${result.error}`);
        }
      } catch (error) {
        console.error(`\n❌ Unexpected error processing ${filePath}:`, error.message);
        results.errors++;
      }
    }

    console.log("\n");

    // Show results
    console.log("📊 Migration Results:");
    console.log("=".repeat(50));
    console.log(`Files processed: ${results.processed}`);
    console.log(`Files transformed: ${results.transformed}`);
    console.log(`Files skipped (already i18n): ${results.skipped}`);
    console.log(`Files excluded (file type): ${results.excluded}`);
    console.log(`Files with no strings: ${results.noStrings}`);
    console.log(`Total user-facing strings found: ${results.totalStrings}`);
    console.log(`Existing translation keys used: ${results.existingKeys}`);
    console.log(`New translation keys created: ${results.newKeys}`);
    console.log(`Total changes applied: ${results.totalChanges}`);
    console.log(`Errors: ${results.errors}`);

    // Show detailed changes if verbose
    if (verbose && results.details.length > 0) {
      console.log("\n📋 Detailed Changes:");
      results.details.slice(0, 10).forEach((detail) => {
        console.log(`\n  ${path.basename(detail.file)}:`);
        console.log(`    Changes: ${detail.changes}`);
        console.log(`    Strings: ${detail.strings}`);
        console.log(`    New keys: ${detail.newKeys}`);
        console.log(`    Existing keys: ${detail.existingKeys}`);
      });

      if (results.details.length > 10) {
        console.log(`\n  ... and ${results.details.length - 10} more files`);
      }
    }

    if (results.newKeys > 0) {
      console.log(`\n🆕 ${results.newKeys} new translation keys were created`);
      if (!dryRun) {
        console.log("📝 Updating translation files...");
        try {
          execSync("pnpm i18n:extract", { stdio: "inherit", cwd: projectRoot });
          console.log("✅ Translation files updated");
        } catch (error) {
          console.warn("⚠️  Could not update translation files:", error.message);
        }
      }
    }

    if (dryRun) {
      console.log(
        "\n💡 To apply these changes, run: node improved-apply-ast-migration.js --apply",
      );
    } else {
      console.log("\n🎉 Improved AST-based migration completed!");
      console.log("\nNext steps:");
      console.log('1. Run "pnpm check-types" to verify no TypeScript errors');
      console.log('2. Run "pnpm i18n:generate-types" to update type definitions');
      console.log("3. Test the application: pnpm dev");
      console.log("4. Commit the changes if everything looks good");
    }

    // Show improvement summary
    const totalFiles = results.processed;
    const errorRate = ((results.errors / totalFiles) * 100).toFixed(1);
    const transformationRate = ((results.transformed / totalFiles) * 100).toFixed(1);

    console.log("\n📈 Quality Metrics:");
    console.log(`Transformation success rate: ${transformationRate}%`);
    console.log(`Error rate: ${errorRate}%`);
    console.log(
      `Average strings per transformed file: ${results.transformed > 0 ? (results.totalStrings / results.transformed).toFixed(1) : 0}`,
    );
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { EnhancedFileProcessor };
