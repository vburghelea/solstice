#!/usr/bin/env node

/**
 * Automated i18n Migration Script
 *
 * This script extends the existing translation extraction system to automatically
 * replace hardcoded strings with translation keys and integrate with the existing
 * i18n infrastructure.
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Import existing extraction functions
import {
  flattenObject,
  initializeConfig,
  loadExistingTranslations,
} from "./extract-translations.js";

/**
 * String extraction patterns for different contexts
 */
const STRING_PATTERNS = {
  // JSX text content
  jsxText: {
    pattern: />([^<{>\n][^<{]*?)</g,
    context: "jsx_content",
    priority: "high",
  },

  // String literals in components
  stringLiteral: {
    pattern: /["']([^"']{3,})["']/g,
    context: "string_literal",
    priority: "medium",
  },

  // Template literals (simple ones)
  templateLiteral: {
    pattern: /`([^`$\n]{3,})`/g,
    context: "template_literal",
    priority: "medium",
  },

  // Form labels and placeholders
  formLabel: {
    pattern: /(label|placeholder):\s*["']([^"']+)["']/g,
    context: "form_field",
    priority: "high",
  },

  // Button text
  buttonText: {
    pattern: /<Button[^>]*>([^<{>\n]+)</g,
    context: "button",
    priority: "high",
  },

  // Error messages
  errorMessage: {
    pattern: /(message|error):\s*["']([^"']+)["']/g,
    context: "error_message",
    priority: "high",
  },
};

/**
 * Files and patterns to exclude from migration
 */
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /dist/,
  /coverage/,
  /\.test\./,
  /\.spec\./,
  /\.stories\./,
  /i18n\/locales/,
  /generated-types\.ts/,
  /routeTree\.gen\.ts/,
];

/**
 * Feature-based namespace mapping
 */
const FEATURE_NAMESPACE_MAP = {
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
  forms: "forms",
  navigation: "navigation",
  common: "common",
  errors: "errors",
};

/**
 * Translation key generation strategy
 */
class TranslationKeyGenerator {
  constructor(existingTranslations) {
    this.existingTranslations = existingTranslations;
    this.generatedKeys = new Map();
    this.keyConflicts = new Map();
  }

  /**
   * Generate a translation key for a given string and context
   */
  generateKey(text, filePath, context) {
    // Normalize text
    const normalizedText = text.trim().replace(/\s+/g, " ");

    // Check if we already have a key for this text
    if (this.generatedKeys.has(normalizedText)) {
      return this.generatedKeys.get(normalizedText);
    }

    // Try to find existing translation
    const existingKey = this.findExistingTranslation(normalizedText);
    if (existingKey) {
      this.generatedKeys.set(normalizedText, existingKey);
      return existingKey;
    }

    // Generate new key based on context
    const namespace = this.inferNamespace(filePath, context);
    const key = this.generateNewKey(normalizedText, namespace, context);

    this.generatedKeys.set(normalizedText, key);
    return key;
  }

  /**
   * Find existing translation for given text
   */
  findExistingTranslation(text) {
    const translations = this.existingTranslations?.en || {};

    for (const [namespace, nsTranslations] of Object.entries(translations)) {
      const flattened = flattenObject(nsTranslations);
      for (const [key, value] of Object.entries(flattened)) {
        if (value === text) {
          return `${namespace}.${key}`;
        }
      }
    }

    return null;
  }

  /**
   * Infer namespace from file path and context
   */
  inferNamespace(filePath, context) {
    // Extract feature from file path
    const pathParts = filePath.split("/");
    const featureIndex = pathParts.findIndex((part) => part === "features");

    if (featureIndex !== -1 && pathParts[featureIndex + 1]) {
      const feature = pathParts[featureIndex + 1];
      return FEATURE_NAMESPACE_MAP[feature] || "common";
    }

    // Fallback based on context
    switch (context) {
      case "button":
      case "jsx_content":
        return "common";
      case "form_field":
        return "forms";
      case "error_message":
        return "errors";
      case "auth":
        return "auth";
      default:
        return "common";
    }
  }

  /**
   * Generate a new translation key
   */
  generateNewKey(text, namespace, context) {
    // Convert text to a suitable key format
    const baseKey = this.textToKey(text);

    // Add context prefix if needed
    let key = baseKey;
    switch (context) {
      case "button":
        key = `buttons.${baseKey}`;
        break;
      case "form_field":
        key = `fields.${baseKey}`;
        break;
      case "error_message":
        key = `messages.${baseKey}`;
        break;
      case "jsx_content":
        key = `content.${baseKey}`;
        break;
    }

    return `${namespace}.${key}`;
  }

  /**
   * Convert text to a key-friendly format
   */
  textToKey(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50); // Limit length
  }
}

/**
 * File transformer for different file types
 */
class FileTransformer {
  constructor(keyGenerator, existingTranslations) {
    this.keyGenerator = keyGenerator;
    this.existingTranslations = existingTranslations;
    this.transformations = [];
  }

  /**
   * Transform a single file
   */
  transformFile(filePath) {
    const content = readFileSync(filePath, "utf8");
    const ext = path.extname(filePath);

    let transformedContent = content;
    const changes = [];

    switch (ext) {
      case ".tsx":
      case ".ts":
        transformedContent = this.transformTypeScriptFile(filePath, content, changes);
        break;
      case ".jsx":
      case ".js":
        transformedContent = this.transformJavaScriptFile(filePath, content, changes);
        break;
      default:
        return { content, changes: [] };
    }

    return { content: transformedContent, changes };
  }

  /**
   * Transform TypeScript/TSX files
   */
  transformTypeScriptFile(filePath, content, changes) {
    let transformedContent = content;

    // Add import statement if needed
    if (this.needsTranslationImport(content)) {
      transformedContent = this.addTranslationImport(transformedContent, filePath);
      changes.push({ type: "import_added", namespace: this.inferNamespace(filePath) });
    }

    // Apply string replacements
    for (const [patternName, patternConfig] of Object.entries(STRING_PATTERNS)) {
      transformedContent = this.applyPatternReplacement(
        transformedContent,
        patternConfig,
        filePath,
        changes,
        patternName,
      );
    }

    return transformedContent;
  }

  /**
   * Transform JavaScript/JSX files
   */
  transformJavaScriptFile(filePath, content, changes) {
    // Similar to TypeScript but without type-specific handling
    return this.transformTypeScriptFile(filePath, content, changes);
  }

  /**
   * Check if file needs translation import
   */
  needsTranslationImport(content) {
    return (
      !content.includes("useTypedTranslation") &&
      !content.includes("useTranslation") &&
      (content.match(/["'][^"']{3,}["']/) || []).length > 0
    );
  }

  /**
   * Add translation import statement
   */
  addTranslationImport(content, filePath) {
    const namespace = this.inferNamespace(filePath);
    const hookName = this.getHookName(namespace);

    // Find the last import statement
    const importRegex = /import[^;]+;/g;
    const imports = content.match(importRegex) || [];

    if (imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const insertPosition = content.lastIndexOf(lastImport) + lastImport.length;

      const newImport = `\nimport { ${hookName} } from "~/hooks/useTypedTranslation";`;
      return content.slice(0, insertPosition) + newImport + content.slice(insertPosition);
    } else {
      // No imports found, add at the top
      return `import { ${hookName} } from "~/hooks/useTypedTranslation";\n\n${content}`;
    }
  }

  /**
   * Apply pattern-based string replacement
   */
  applyPatternReplacement(content, patternConfig, filePath, changes, patternName) {
    let transformedContent = content;
    const matches = [...content.matchAll(patternConfig.pattern)];

    // Process matches in reverse order to maintain position indices
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const fullMatch = match[0];
      const extractedText = match[1] || match[2]; // Handle different capture groups

      if (this.shouldReplaceText(extractedText)) {
        const key = this.keyGenerator.generateKey(
          extractedText,
          filePath,
          patternConfig.context,
        );
        const replacement = this.generateReplacement(
          extractedText,
          key,
          patternConfig.context,
        );

        const startIndex = match.index;
        const endIndex = startIndex + fullMatch.length;

        transformedContent =
          transformedContent.slice(0, startIndex) +
          replacement +
          transformedContent.slice(endIndex);

        changes.push({
          type: "string_replaced",
          pattern: patternName,
          original: extractedText,
          key,
          replacement,
        });
      }
    }

    return transformedContent;
  }

  /**
   * Check if text should be replaced
   */
  shouldReplaceText(text) {
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
      /^var\s+/, // Var declarations
      /^import\s+/, // Import statements
      /^export\s+/, // Export statements
    ];

    return !excludePatterns.some((pattern) => pattern.test(text.trim()));
  }

  /**
   * Generate replacement code
   */
  generateReplacement(originalText, key, context) {
    const keyParts = key.split(".");
    const namespace = keyParts[0];
    const keyPath = keyParts.slice(1).join(".");

    switch (context) {
      case "jsx_content":
        return `{t('${keyPath}')}`;
      case "button":
        return `{t('${keyPath}')}`;
      case "form_field":
        // Handle form label/placeholder patterns
        return originalText; // Keep as is for now, needs special handling
      case "string_literal":
        return `t('${keyPath}')`;
      case "template_literal":
        return `{t('${keyPath}')}`;
      default:
        return `t('${keyPath}')}`;
    }
  }

  /**
   * Infer namespace from file path
   */
  inferNamespace(filePath) {
    const pathParts = filePath.split("/");
    const featureIndex = pathParts.findIndex((part) => part === "features");

    if (featureIndex !== -1 && pathParts[featureIndex + 1]) {
      const feature = pathParts[featureIndex + 1];
      return FEATURE_NAMESPACE_MAP[feature] || "common";
    }

    return "common";
  }

  /**
   * Get appropriate hook name for namespace
   */
  getHookName(namespace) {
    const hookMap = {
      common: "useCommonTranslation",
      auth: "useAuthTranslation",
      navigation: "useNavigationTranslation",
      games: "useGamesTranslation",
      events: "useEventsTranslation",
      teams: "useTeamsTranslation",
      forms: "useFormsTranslation",
      errors: "useErrorsTranslation",
      admin: "useAdminTranslation",
      campaigns: "useCampaignsTranslation",
      membership: "useMembershipTranslation",
      player: "usePlayerTranslation",
      profile: "useProfileTranslation",
      settings: "useSettingsTranslation",
    };

    return hookMap[namespace] || "useCommonTranslation";
  }
}

/**
 * Main migration class
 */
class I18nMigration {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      backup: options.backup !== false,
      verbose: options.verbose || false,
      includePatterns: options.includePatterns || ["src/**/*.{ts,tsx}"],
      excludePatterns: [...EXCLUDE_PATTERN, ...(options.excludePatterns || [])],
      ...options,
    };

    this.config = initializeConfig();
    this.existingTranslations = null;
    this.keyGenerator = null;
    this.stats = {
      filesProcessed: 0,
      stringsReplaced: 0,
      importsAdded: 0,
      errors: 0,
    };
  }

  /**
   * Run the migration
   */
  async run() {
    try {
      console.log("🚀 Starting automated i18n migration...");

      // Load existing translations
      await this.loadExistingTranslations();

      // Find files to process
      const files = await this.findFiles();
      console.log(`📁 Found ${files.length} files to process`);

      // Process files
      const results = await this.processFiles(files);

      // Generate report
      this.generateReport(results);

      if (!this.options.dryRun) {
        // Update translation files with new keys
        await this.updateTranslationFiles();

        // Generate types
        console.log("🔄 Generating TypeScript types...");
        execSync("pnpm i18n:generate-types", { stdio: "inherit", cwd: projectRoot });

        console.log("✅ Migration completed successfully!");
      } else {
        console.log("🔍 Dry run completed. Use --apply to make changes.");
      }
    } catch (error) {
      console.error("❌ Migration failed:", error.message);
      throw error;
    }
  }

  /**
   * Load existing translations
   */
  async loadExistingTranslations() {
    console.log("📚 Loading existing translations...");
    this.existingTranslations = loadExistingTranslations();
    this.keyGenerator = new TranslationKeyGenerator(this.existingTranslations);
  }

  /**
   * Find files to process
   */
  async findFiles() {
    const { globSync } = await import("tinyglobby");
    const files = [];

    for (const pattern of this.options.includePatterns) {
      const matchedFiles = globSync(pattern, { cwd: projectRoot });
      files.push(...matchedFiles);
    }

    // Filter out excluded files
    return files.filter((file) => {
      const fullPath = path.join(projectRoot, file);
      return !this.options.excludePatterns.some((pattern) => pattern.test(fullPath));
    });
  }

  /**
   * Process all files
   */
  async processFiles(files) {
    const results = [];
    const transformer = new FileTransformer(this.keyGenerator, this.existingTranslations);

    for (const file of files) {
      try {
        const result = await this.processFile(file, transformer);
        results.push(result);
        this.stats.filesProcessed++;

        if (this.options.verbose && result.changes.length > 0) {
          console.log(`  ✨ ${file}: ${result.changes.length} changes`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${file}:`, error.message);
        this.stats.errors++;
        results.push({ file, error: error.message, changes: [] });
      }
    }

    return results;
  }

  /**
   * Process a single file
   */
  async processFile(file, transformer) {
    const fullPath = path.join(projectRoot, file);
    const originalContent = readFileSync(fullPath, "utf8");

    const { content: transformedContent, changes } = transformer.transformFile(fullPath);

    // Update statistics
    this.stats.stringsReplaced += changes.filter(
      (c) => c.type === "string_replaced",
    ).length;
    this.stats.importsAdded += changes.filter((c) => c.type === "import_added").length;

    if (!this.options.dryRun && transformedContent !== originalContent) {
      // Create backup if enabled
      if (this.options.backup) {
        writeFileSync(`${fullPath}.backup`, originalContent);
      }

      // Write transformed content
      writeFileSync(fullPath, transformedContent);
    }

    return {
      file,
      changes,
      contentChanged: transformedContent !== originalContent,
      originalLength: originalContent.length,
      transformedLength: transformedContent.length,
    };
  }

  /**
   * Update translation files with new keys
   */
  async updateTranslationFiles() {
    console.log("💾 Updating translation files...");

    // Get all generated keys
    const newKeys = new Map();
    for (const [text, key] of this.keyGenerator.generatedKeys.entries()) {
      if (!this.keyGenerator.findExistingTranslation(text)) {
        newKeys.set(key, text);
      }
    }

    if (newKeys.size > 0) {
      console.log(`  Adding ${newKeys.size} new translation keys...`);

      // This would integrate with the existing extraction script
      // to add new keys to the appropriate JSON files
      execSync("pnpm i18n:extract", { stdio: "inherit", cwd: projectRoot });
    }
  }

  /**
   * Generate migration report
   */
  generateReport(results) {
    console.log("\n📊 Migration Report:");
    console.log(`  Files processed: ${this.stats.filesProcessed}`);
    console.log(`  Strings replaced: ${this.stats.stringsReplaced}`);
    console.log(`  Imports added: ${this.stats.importsAdded}`);
    console.log(`  Errors: ${this.stats.errors}`);

    const successfulFiles = results.filter((r) => !r.error && r.changes.length > 0);
    console.log(`  Files with changes: ${successfulFiles.length}`);

    if (this.options.verbose && successfulFiles.length > 0) {
      console.log("\n📝 Files with changes:");
      successfulFiles.forEach((result) => {
        console.log(`  ${result.file}: ${result.changes.length} changes`);
      });
    }

    // Show sample transformations
    const sampleChanges = results
      .flatMap((r) => r.changes)
      .filter((c) => c.type === "string_replaced")
      .slice(0, 5);

    if (sampleChanges.length > 0) {
      console.log("\n🔄 Sample transformations:");
      sampleChanges.forEach((change) => {
        console.log(`  "${change.original}" → {t('${change.key}')}`);
      });
    }
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--apply":
        options.dryRun = false;
        break;
      case "--verbose":
        options.verbose = true;
        break;
      case "--no-backup":
        options.backup = false;
        break;
      case "--help":
        console.log(`
Automated i18n Migration Script

Usage: node auto-migrate-i18n.js [options]

Options:
  --dry-run     Show what would be changed without making changes (default)
  --apply       Actually apply the changes
  --verbose     Show detailed output
  --no-backup   Don't create backup files
  --help        Show this help message

Examples:
  node auto-migrate-i18n.js --dry-run    # Preview changes
  node auto-migrate-i18n.js --apply      # Apply changes
  node auto-migrate-i18n.js --verbose    # Detailed output
        `);
        process.exit(0);
    }
  }

  // Default to dry-run for safety
  if (options.dryRun === undefined) {
    options.dryRun = true;
  }

  const migration = new I18nMigration(options);
  await migration.run();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });
}

export { FileTransformer, I18nMigration, TranslationKeyGenerator };
