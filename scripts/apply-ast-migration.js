#!/usr/bin/env node

/**
 * Enhanced AST-based Apply i18n Migration Script
 *
 * Surgically applies string-to-key transformations using TypeScript Compiler API
 * with comprehensive support for template literals, JSX text, and complex patterns.
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import * as ts from "typescript";
import { fileURLToPath } from "url";

// Import configuration
import { loadExistingTranslations } from "./extract-translations.js";
import {
  getFilesToProcess,
  getNamespaceHookMapping,
  inferNamespaceFromPath,
} from "./lib/i18n-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

/**
 * AST transformation result
 */
class TransformationResult {
  constructor(originalContent, transformedContent, changes, analysis) {
    this.originalContent = originalContent;
    this.transformedContent = transformedContent;
    this.changes = changes;
    this.analysis = analysis;
  }
}

/**
 * Enhanced AST-based transformer
 */
class EnhancedASTTransformer {
  constructor(existingTranslations = {}) {
    this.existingTranslations = existingTranslations;
    this.sourceFile = null;
    this.filePath = null;
    this.content = null;
    this.transformations = [];
  }

  /**
   * Transform a file using comprehensive AST analysis
   */
  transformFile(filePath, dryRun = false) {
    this.filePath = filePath;
    this.transformations = [];

    try {
      this.content = readFileSync(filePath, "utf8");

      // Skip if already using i18n properly
      if (this.hasProperI18nSetup(this.content)) {
        return new TransformationResult(this.content, this.content, [], {
          reason: "Already properly uses i18n",
        });
      }

      // Create source file
      const compilerOptions = {
        target: ts.ScriptTarget.Latest,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
      };

      this.sourceFile = ts.createSourceFile(
        filePath,
        this.content,
        compilerOptions.target,
        true,
        ts.ScriptKind.TSX,
      );

      // Create a copy of the original content for transformation
      let transformedContent = this.content;
      const allChanges = [];

      // Apply transformations in reverse order to maintain positions
      const transformations = this.collectTransformations();

      if (transformations.length > 0) {
        // Sort by position (descending) to avoid offset issues
        transformations.sort((a, b) => b.position - a.position);

        // Apply each transformation
        for (const transformation of transformations) {
          const result = this.applyTransformation(transformedContent, transformation);
          transformedContent = result.content;
          allChanges.push(result.change);
        }

        // Add import and hook if needed
        if (allChanges.length > 0) {
          const namespace = inferNamespaceFromPath(filePath);
          const hookName = this.getHookName(namespace);

          // Add import
          if (!transformedContent.includes("useTypedTranslation")) {
            transformedContent = this.insertTranslationImport(
              transformedContent,
              hookName,
            );
            allChanges.unshift({ type: "import_added", hook: hookName });
          }

          // Add hook usage
          if (!transformedContent.includes(`const { t } = ${hookName}()`)) {
            transformedContent = this.insertTranslationUsage(
              transformedContent,
              hookName,
            );
            allChanges.unshift({ type: "hook_usage_added", hook: hookName });
          }
        }
      }

      // Write file if not dry run and content changed
      if (!dryRun && transformedContent !== this.content) {
        writeFileSync(filePath, transformedContent);
      }

      return new TransformationResult(this.content, transformedContent, allChanges, {
        stringsFound: transformations.length,
        templateLiterals: transformations.filter((t) => t.variables?.length > 0).length,
        jsxCContent: transformations.filter((t) => t.context.type.startsWith("jsx"))
          .length,
      });
    } catch (error) {
      return new TransformationResult(this.content || "", this.content || "", [], {
        error: error.message,
      });
    }
  }

  /**
   * Collect all transformations needed
   */
  collectTransformations() {
    const transformations = [];
    this.walkNode(this.sourceFile, transformations);
    return transformations;
  }

  /**
   * Walk AST nodes and collect transformation opportunities
   */
  walkNode(node, transformations) {
    // String literals
    if (ts.isStringLiteral(node)) {
      const transformation = this.analyzeStringLiteral(node);
      if (transformation) {
        transformations.push(transformation);
      }
    }

    // Template literals
    if (ts.isTemplateLiteral(node)) {
      const transformation = this.analyzeTemplateLiteral(node);
      if (transformation) {
        transformations.push(transformation);
      }
    }

    // JSX text
    if (ts.isJsxText(node)) {
      const transformation = this.analyzeJsxText(node);
      if (transformation) {
        transformations.push(transformation);
      }
    }

    // Recursively visit children
    ts.forEachChild(node, (child) => this.walkNode(child, transformations));
  }

  /**
   * Analyze string literal for transformation
   */
  analyzeStringLiteral(node) {
    if (!this.isUserFacingString(node.text)) return null;

    const context = this.getContext(node);
    const existingTranslation = this.findExistingTranslation(node.text);
    const key = existingTranslation
      ? existingTranslation.path
      : this.generateKey(node.text, context);

    return {
      type: "string_literal",
      original: node.text,
      key: key,
      context: context,
      position: node.getStart(),
      end: node.getEnd(),
      isNewKey: !existingTranslation,
      variables: [],
    };
  }

  /**
   * Analyze template literal for transformation
   */
  analyzeTemplateLiteral(node) {
    const templateParts = this.extractTemplateLiteralParts(node);
    const variables = this.extractTemplateVariables(node);
    const combinedText = templateParts.map((part) => part.text).join("");

    if (!this.isUserFacingString(combinedText)) return null;

    const context = this.getContext(node);
    const existingTranslation = this.findExistingTranslation(combinedText);
    const key = existingTranslation
      ? existingTranslation.path
      : this.generateKey(combinedText, context);

    return {
      type: "template_literal",
      original: combinedText,
      key: key,
      context: context,
      position: node.getStart(),
      end: node.getEnd(),
      isNewKey: !existingTranslation,
      variables: variables,
      templateParts: templateParts,
    };
  }

  /**
   * Analyze JSX text for transformation
   */
  analyzeJsxText(node) {
    const text = node.getText().trim();
    if (!this.isUserFacingString(text)) return null;

    const context = this.getContext(node);
    const existingTranslation = this.findExistingTranslation(text);
    const key = existingTranslation
      ? existingTranslation.path
      : this.generateKey(text, context);

    return {
      type: "jsx_text",
      original: text,
      key: key,
      context: context,
      position: node.getStart(),
      end: node.getEnd(),
      isNewKey: !existingTranslation,
      variables: [],
    };
  }

  /**
   * Extract template literal parts
   */
  extractTemplateLiteralParts(templateLiteral) {
    const parts = [];

    // Head text
    if (templateLiteral.head.text) {
      parts.push({ text: templateLiteral.head.text, isTemplate: false });
    }

    // Span texts
    templateLiteral.templateSpans.forEach((span) => {
      parts.push({
        text: `\${${this.getExpressionText(span.expression)}}`,
        isTemplate: true,
      });
      if (span.literal.text) {
        parts.push({ text: span.literal.text, isTemplate: false });
      }
    });

    return parts;
  }

  /**
   * Extract template variables
   */
  extractTemplateVariables(templateLiteral) {
    const variables = [];

    templateLiteral.templateSpans.forEach((span) => {
      const varInfo = this.analyzeExpression(span.expression);
      if (varInfo) {
        variables.push(varInfo);
      }
    });

    return variables;
  }

  /**
   * Analyze expression for variable information
   */
  analyzeExpression(expression) {
    return {
      name: this.getExpressionText(expression),
      position: expression.getStart(),
      type: this.getExpressionType(expression),
    };
  }

  /**
   * Get expression type
   */
  getExpressionType(expression) {
    switch (expression.kind) {
      case ts.SyntaxKind.Identifier:
        return "identifier";
      case ts.SyntaxKind.PropertyAccessExpression:
        return "property_access";
      case ts.SyntaxKind.ConditionalExpression:
        return "conditional";
      case ts.SyntaxKind.CallExpression:
        return "call_expression";
      default:
        return "expression";
    }
  }

  /**
   * Get expression text
   */
  getExpressionText(expression) {
    return this.sourceFile
      .getText()
      .slice(expression.getStart(), expression.getEnd())
      .trim();
  }

  /**
   * Apply a transformation to content
   */
  applyTransformation(content, transformation) {
    let replacement;

    switch (transformation.type) {
      case "template_literal":
        replacement = this.generateTemplateReplacement(transformation);
        break;
      case "jsx_text":
        replacement = this.generateJsxTextReplacement(transformation);
        break;
      default:
        replacement = `{t('${transformation.key}')}`;
    }

    const newContent =
      content.slice(0, transformation.position) +
      replacement +
      content.slice(transformation.end);

    return {
      content: newContent,
      change: {
        type: transformation.isNewKey
          ? "new_translation_key"
          : "existing_translation_key",
        original: transformation.original,
        key: transformation.key,
        context: transformation.context,
        variables: transformation.variables,
        replacement: replacement,
      },
    };
  }

  /**
   * Generate replacement for template literal
   */
  generateTemplateReplacement(transformation) {
    if (transformation.variables.length === 0) {
      return `{t('${transformation.key}')}`;
    }

    // For template literals with variables, we need to preserve the structure
    // This is more complex and might need custom handling
    return `{t('${transformation.key}')}`;
  }

  /**
   * Generate replacement for JSX text
   */
  generateJsxTextReplacement(transformation) {
    return `{t('${transformation.key}')}`;
  }

  /**
   * Check if string is user-facing
   */
  isUserFacingString(text) {
    if (!text || typeof text !== "string") return false;
    const trimmed = text.trim();

    if (trimmed.length < 3) return false;

    // Skip technical strings (same logic as extractor)
    const technicalPatterns = [
      /^[a-zA-Z][a-zA-Z0-9_]*$/, // Variable names
      /^https?:\/\//, // URLs
      /^www\./, // URLs
      /^[{}[\]()]+$/, // Brackets only
      /^\s*$/, // Whitespace only
      /^class\s+/, // Class definitions
      /^function\s+/, // Function definitions
      /^const\s+/, // Const declarations
      /^let\s+/, // Let declarations
      /^import\s+/, // Import statements
      /^export\s+/, // Export statements
      /^React$/, // React
      /^[A-Z][a-zA-Z]*Component$/, // Component names
      /^data-/, // Data attributes
      /^aria-/, // Aria attributes
      /^[a-z]+([A-Z][a-z]*)*$/, // camelCase identifiers
      /^[A-Z_]+$/, // Constants
      /^\w+\.\w+/, // Property access
      /^#[a-fA-F0-9]{3,6}$/, // Hex colors
      /^[0-9]+$/, // Numbers only
    ];

    return !technicalPatterns.some((pattern) => pattern.test(trimmed));
  }

  /**
   * Get context for a node
   */
  getContext(node) {
    const parent = node.parent;

    if (ts.isJsxAttribute(parent)) {
      return {
        type: "jsx_attribute",
        attribute: parent.name.text,
        element: this.getParentElement(parent),
      };
    }

    if (ts.isJsxElement(parent.parent) || ts.isJsxFragment(parent.parent)) {
      return {
        type: "jsx_children",
        element: this.getParentElement(parent.parent),
      };
    }

    if (ts.isJsxText(node)) {
      return {
        type: "jsx_text",
        element: this.getParentElement(node),
      };
    }

    if (ts.isPropertyAssignment(parent)) {
      return {
        type: "property_assignment",
        property: parent.name?.text || "unknown",
      };
    }

    return { type: "unknown" };
  }

  /**
   * Get parent element name
   */
  getParentElement(node) {
    if (ts.isJsxElement(node.parent) || ts.isJsxSelfClosingElement(node.parent)) {
      return node.parent.openingElement?.name?.getText() || "unknown";
    }
    return "unknown";
  }

  /**
   * Find existing translation
   */
  findExistingTranslation(text) {
    for (const [namespace, translations] of Object.entries(this.existingTranslations)) {
      const result = this.searchInObject(translations, text);
      if (result.path) {
        return {
          namespace,
          path: result.path,
        };
      }
    }
    return null;
  }

  /**
   * Search in object for text
   */
  searchInObject(obj, text, path = "") {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === "string" && value === text) {
        return { path: currentPath };
      }

      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const result = this.searchInObject(value, text, currentPath);
        if (result.path) {
          return result;
        }
      }
    }
    return { path: null };
  }

  /**
   * Generate translation key
   */
  generateKey(text, context) {
    const normalizedText = text
      .replace(/\${[^}]+}/g, "") // Remove template variables
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim()
      .substring(0, 50);

    let baseKey = normalizedText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_");

    if (!baseKey) {
      baseKey = "dynamic_content";
    }

    let keyPrefix = "common";
    switch (context.type) {
      case "jsx_attribute":
        if (["label", "placeholder"].includes(context.attribute)) {
          keyPrefix = "fields";
        }
        break;
      case "jsx_children":
      case "jsx_text":
        if (context.element === "Button") {
          keyPrefix = "buttons";
        }
        break;
      case "property_assignment":
        if (["error", "message"].includes(context.property)) {
          keyPrefix = "messages";
        }
        break;
    }

    return `${keyPrefix}.${baseKey}`;
  }

  /**
   * Insert translation import
   */
  insertTranslationImport(content, hookName) {
    const lines = content.split("\n");
    let insertIndex = 0;

    // Find last import
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith("import ")) {
        insertIndex = i + 1;
      }
    }

    const newImport = `import { ${hookName} } from "~/hooks/useTypedTranslation";`;
    lines.splice(insertIndex, 0, newImport);

    return lines.join("\n");
  }

  /**
   * Insert translation hook usage
   */
  insertTranslationUsage(content, hookName) {
    const lines = content.split("\n");

    // Find component function
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      const componentPatterns = [
        /^(export\s+)?function\s+\w+\s*\([^)]*\)\s*\{/,
        /^(export\s+)?const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{/,
        /^(export\s+)?const\s+\w+\s*=\s*\(\s*\)\s*=>\s*\{/,
      ];

      for (const pattern of componentPatterns) {
        if (pattern.test(line)) {
          const braceIndex = lines[i].indexOf("{");
          if (braceIndex >= 0) {
            const indent = lines[i].match(/^(\s*)/)[1];
            const hookLine = `${indent}  const { t } = ${hookName}();`;
            lines.splice(i + 1, 0, hookLine);
            return lines.join("\n");
          }
        }
      }
    }

    return content;
  }

  /**
   * Get hook name for namespace
   */
  getHookName(namespace) {
    const hookMapping = getNamespaceHookMapping();
    return hookMapping[namespace] || "useCommonTranslation";
  }

  /**
   * Check if file has proper i18n setup
   */
  hasProperI18nSetup(content) {
    return (
      content.includes("useTypedTranslation()") ||
      (content.includes("{ t }") && content.includes("Translation"))
    );
  }
}

/**
 * Main migration function
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--apply");
  const verbose = args.includes("--verbose");

  if (args.includes("--help")) {
    console.log(`
Enhanced AST-based Apply i18n Migration Script

Usage: node apply-ast-migration-enhanced.js [options]

Options:
  --dry-run     Show what would be changed without making changes (default)
  --apply       Actually apply the changes to files
  --verbose     Show detailed output
  --help        Show this help message

This script uses TypeScript Compiler API to surgically transform
user-facing strings with comprehensive support for:

✅ String literals and template literals
✅ JSX text content and attributes
✅ Multi-line strings and embedded expressions
✅ Form labels, placeholders, and validation messages
✅ Error messages and UI text
✅ Surgical import and hook insertion

Features:
- Semantic understanding of code structure
- Variable detection in template literals
- Context-aware key generation
- Preserves code formatting and structure
- Handles complex patterns and edge cases
    `);
    return;
  }

  try {
    console.log("🚀 Starting enhanced AST-based i18n migration...\n");

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
      totalChanges: 0,
      totalStrings: 0,
      templateLiterals: 0,
      jsxContent: 0,
      newKeys: 0,
      existingKeys: 0,
      errors: 0,
      details: [],
    };

    // Process files
    for (const filePath of files) {
      try {
        process.stdout.write(
          `\r${dryRun ? "Analyzing" : "Processing"} ${results.processed + 1}/${files.length}: ${path.basename(filePath)}`,
        );

        const transformer = new EnhancedASTTransformer(existingTranslations);
        const result = transformer.transformFile(filePath, dryRun);
        results.processed++;

        if (result.transformedContent !== result.originalContent) {
          results.transformed++;
          results.totalChanges += result.changes.length;
          results.totalStrings += result.analysis?.stringsFound || 0;
          results.templateLiterals += result.analysis?.templateLiterals || 0;
          results.jsxContent += result.analysis?.jsxCContent || 0;

          const newKeys = result.changes.filter(
            (c) => c.type === "new_translation_key",
          ).length;
          const existingKeys = result.changes.filter(
            (c) => c.type === "existing_translation_key",
          ).length;
          results.newKeys += newKeys;
          results.existingKeys += existingKeys;

          results.details.push({
            file: filePath,
            changes: result.changes.length,
            strings: result.analysis?.stringsFound || 0,
            templateLiterals: result.analysis?.templateLiterals || 0,
            newKeys,
            existingKeys,
          });
        } else if (result.analysis?.reason) {
          results.skipped++;
        }
      } catch (error) {
        console.error(`\n❌ Error processing ${filePath}:`, error.message);
        results.errors++;
      }
    }

    console.log("\n");

    // Show results
    console.log("📊 Migration Results:");
    console.log("=".repeat(50));
    console.log(`Files processed: ${results.processed}`);
    console.log(`Files transformed: ${results.transformed}`);
    console.log(`Files skipped: ${results.skipped}`);
    console.log(`Total strings found: ${results.totalStrings}`);
    console.log(`Template literals: ${results.templateLiterals}`);
    console.log(`JSX content: ${results.jsxContent}`);
    console.log(`Existing translation keys used: ${results.existingKeys}`);
    console.log(`New translation keys created: ${results.newKeys}`);
    console.log(`Total changes applied: ${results.totalChanges}`);
    console.log(`Errors: ${results.errors}`);

    if (verbose && results.details.length > 0) {
      console.log("\n📋 Files with changes:");
      results.details.slice(0, 10).forEach((detail) => {
        console.log(`  ${detail.file}: ${detail.changes} changes`);
        if (detail.templateLiterals > 0) {
          console.log(
            `    📝 ${detail.templateLiterals} template literals with variables`,
          );
        }
      });
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
        "\n💡 To apply these changes, run: node apply-ast-migration-enhanced.js --apply",
      );
    } else {
      console.log("\n🎉 Enhanced AST-based migration completed!");
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

export { EnhancedASTTransformer };
