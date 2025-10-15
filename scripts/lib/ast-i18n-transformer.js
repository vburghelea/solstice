#!/usr/bin/env node

/**
 * Production-ready AST-based i18n Transformer
 *
 * Uses TypeScript Compiler API for semantic, reliable code transformations
 * instead of fragile regex patterns.
 */

import { readFileSync } from "fs";
import * as ts from "typescript";

/**
 * String literal information with context
 */
class StringLiteralInfo {
  constructor(text, node, context, position, end) {
    this.text = text;
    this.node = node;
    this.context = context;
    this.position = position;
    this.end = end;
  }
}

/**
 * AST-based transformer for i18n migration
 */
class ASTI18nTransformer {
  constructor(existingTranslations = {}) {
    this.existingTranslations = existingTranslations;
    this.stringLiterals = [];
    this.imports = [];
    this.sourceFile = null;
    this.content = null;
  }

  /**
   * Analyze a TypeScript/TSX file for user-facing strings
   */
  analyzeFile(filePath) {
    this.content = readFileSync(filePath, "utf8");

    // Create source file with all compiler options
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

    // Reset collections
    this.stringLiterals = [];
    this.imports = [];

    // Walk the AST
    this.walkNode(this.sourceFile);

    return {
      stringLiterals: this.stringLiterals,
      imports: this.imports,
      sourceFile: this.sourceFile,
      content: this.content,
    };
  }

  /**
   * Recursively walk AST nodes and find relevant elements
   */
  walkNode(node) {
    // Check for import declarations
    if (ts.isImportDeclaration(node)) {
      this.imports.push(node);
    }

    // Check for string literals in user-facing contexts
    if (ts.isStringLiteral(node) && this.isUserFacingContext(node)) {
      const context = this.getContext(node);
      this.stringLiterals.push(
        new StringLiteralInfo(node.text, node, context, node.getStart(), node.getEnd()),
      );
    }

    // Recursively visit children
    ts.forEachChild(node, (child) => this.walkNode(child));
  }

  /**
   * Determine if a string literal is in a user-facing context
   */
  isUserFacingContext(node) {
    const parent = node.parent;
    if (!parent) return false;

    // Skip if it's a technical string
    if (this.isTechnicalString(node.text)) return false;

    // JSX text content (children of elements)
    if (ts.isJsxElement(parent) || ts.isJsxFragment(parent)) {
      return true;
    }

    // JSX attribute values
    if (ts.isJsxAttribute(parent)) {
      const attributeName = parent.name.text;
      return ["label", "placeholder", "title", "alt", "aria-label"].includes(
        attributeName,
      );
    }

    // Property assignments in objects
    if (ts.isPropertyAssignment(parent)) {
      const propertyName = parent.name?.text;
      if (
        [
          "message",
          "error",
          "description",
          "title",
          "text",
          "subtitle",
          "content",
        ].includes(propertyName)
      ) {
        return true;
      }
    }

    // Array elements (like button text arrays)
    if (ts.isArrayLiteralExpression(parent)) {
      // Check if the array is in a user-facing context
      const arrayParent = parent.parent;
      if (ts.isPropertyAssignment(arrayParent) || ts.isJsxAttribute(arrayParent)) {
        return true;
      }
    }

    // Return statements with user-facing content
    if (ts.isReturnStatement(parent)) {
      return this.isUserFacingContext(parent);
    }

    // Binary expressions where this is the right side and left side is user-facing
    if (
      ts.isBinaryExpression(parent) &&
      parent.operatorToken.kind === ts.SyntaxKind.PlusToken
    ) {
      return this.isUserFacingContext(parent);
    }

    return false;
  }

  /**
   * Check if string is technical and should not be translated
   */
  isTechnicalString(text) {
    if (!text || typeof text !== "string") return true;
    const trimmed = text.trim();

    const technicalPatterns = [
      /^[a-zA-Z][a-zA-Z0-9_]*$/, // Variable names
      /^https?:\/\//, // URLs
      /^[{}[\]()]+$/, // Brackets
      /^\s*$/, // Whitespace only
      /^class\s+/, // Class definitions
      /^function\s+/, // Function definitions
      /^const\s+/, // Const declarations
      /^let\s+/, // Let declarations
      /^import\s+/, // Import statements
      /^export\s+/, // Export statements
      /^React$/, // React
      /^[A-Z][a-zA-Z]*Component$/, // Component names
      /^[a-z]+([A-Z][a-z]*)*$/, // camelCase identifiers
      /^[A-Z_]+$/, // Constants
      /^data-/, // Data attributes
      /^aria-/, // Aria attributes
      /^\w+\.\w+/, // Property access
      /^#[a-fA-F0-9]{3,6}$/, // Hex colors
    ];

    return technicalPatterns.some((pattern) => pattern.test(trimmed));
  }

  /**
   * Get context information for a string literal
   */
  getContext(node) {
    const parent = node.parent;

    if (ts.isJsxAttribute(parent)) {
      return {
        type: "jsx_attribute",
        attribute: parent.name.text,
        element: parent.parent?.name?.text || "unknown",
      };
    }

    if (ts.isJsxElement(parent.parent)) {
      return {
        type: "jsx_children",
        element: parent.parent?.openingElement?.name?.text || "unknown",
      };
    }

    if (ts.isJsxFragment(parent.parent)) {
      return {
        type: "jsx_fragment_children",
      };
    }

    if (ts.isPropertyAssignment(parent)) {
      return {
        type: "property_assignment",
        property: parent.name?.text || "unknown",
      };
    }

    if (ts.isArrayLiteralExpression(parent)) {
      return {
        type: "array_element",
        parent: this.getContext(parent)?.type || "unknown",
      };
    }

    return { type: "unknown" };
  }

  /**
   * Find existing translation for text
   */
  findExistingTranslation(text) {
    for (const [namespace, translations] of Object.entries(this.existingTranslations)) {
      const result = this.searchInObject(translations, text);
      if (result.path) {
        return {
          key: `${namespace}.${result.path}`,
          namespace,
          path: result.path,
        };
      }
    }
    return null;
  }

  /**
   * Search for text in nested object and return path
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
   * Generate translation key based on text and context (for new keys)
   */
  generateTranslationKey(text, context) {
    // Convert text to key format
    const baseKey = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);

    // Add context prefix
    let keyPrefix = "common";
    switch (context.type) {
      case "jsx_attribute":
        if (["label", "placeholder"].includes(context.attribute)) {
          keyPrefix = "fields";
        } else if (["title", "alt"].includes(context.attribute)) {
          keyPrefix = "content";
        }
        break;
      case "jsx_children":
        if (context.element === "Button") {
          keyPrefix = "buttons";
        } else {
          keyPrefix = "content";
        }
        break;
      case "jsx_fragment_children":
        keyPrefix = "content";
        break;
      case "property_assignment":
        if (["error", "message"].includes(context.property)) {
          keyPrefix = "messages";
        } else if (["title", "subtitle"].includes(context.property)) {
          keyPrefix = "content";
        } else if (["label", "placeholder"].includes(context.property)) {
          keyPrefix = "fields";
        }
        break;
      case "array_element":
        keyPrefix = "content";
        break;
    }

    return `${keyPrefix}.${baseKey}`;
  }

  /**
   * Insert translation import at the correct position
   */
  insertTranslationImport(content, hookName) {
    const lines = content.split("\n");
    let insertIndex = 0;
    let lastImportLine = -1;

    // Find the last import statement
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith("import ") && !trimmed.includes("//")) {
        lastImportLine = i;
        insertIndex = i + 1;
      }
    }

    // Handle different import styles
    const newImport = `import { ${hookName} } from "~/hooks/useTypedTranslation";`;

    if (lastImportLine >= 0) {
      // Insert after last import, with proper spacing
      const lastImport = lines[lastImportLine];
      const hasTrailingSemicolon = lastImport.trim().endsWith(";");

      if (!hasTrailingSemicolon) {
        lines[lastImportLine] = lastImport + ";";
      }

      lines.splice(insertIndex, 0, newImport);
    } else {
      // No imports found, add at the top
      lines.unshift(newImport);
    }

    return lines.join("\n");
  }

  /**
   * Add translation hook usage after component declaration
   */
  insertTranslationUsage(content, hookName) {
    const lines = content.split("\n");

    // Find component function declarations
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for various component patterns
      const componentPatterns = [
        /^(export\s+)?function\s+\w+\s*\([^)]*\)\s*\{/,
        /^(export\s+)?const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{/,
        /^(export\s+)?const\s+\w+\s*=\s*\(\s*\)\s*=>\s*\{/,
      ];

      for (const pattern of componentPatterns) {
        if (pattern.test(line)) {
          // Find the opening brace and insert after it
          const braceIndex = lines[i].indexOf("{");
          if (braceIndex >= 0) {
            // Insert the hook usage on the next line with proper indentation
            const indent = lines[i].match(/^(\s*)/)[1];
            const hookLine = `${indent}  const { t } = ${hookName}();`;
            lines.splice(i + 1, 0, hookLine);
            return lines.join("\n");
          }
        }
      }
    }

    // Fallback: insert before first return statement
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith("return")) {
        const indent = lines[i].match(/^(\s*)/)[1];
        const hookLine = `${indent}const { t } = ${hookName}();`;
        lines.splice(i, 0, hookLine);
        return lines.join("\n");
      }
    }

    return content;
  }

  /**
   * Replace string literal with translation call
   */
  replaceStringWithTranslation(content, literalInfo) {
    const { position, end, text, context } = literalInfo;

    // Find existing translation first
    const existingTranslation = this.findExistingTranslation(text);
    const key = existingTranslation
      ? existingTranslation.path
      : this.generateTranslationKey(text, context);

    // Generate replacement based on context
    let replacement;
    if (
      context.type === "jsx_children" ||
      context.type === "jsx_fragment_children" ||
      context.type === "jsx_attribute"
    ) {
      replacement = `{t('${key}')}`;
    } else {
      replacement = `t('${key}')`;
    }

    // Replace in content
    return {
      content: content.slice(0, position) + replacement + content.slice(end),
      original: text,
      key,
      context: context,
      isNewKey: !existingTranslation,
    };
  }

  /**
   * Transform a file using semantic AST understanding
   */
  transformFile(filePath, namespace = "common") {
    const analysis = this.analyzeFile(filePath);
    const { stringLiterals, content } = analysis;

    if (stringLiterals.length === 0) {
      return { content, changes: [] };
    }

    let transformedContent = content;
    const changes = [];

    // Sort string literals by position (reverse order to maintain indices)
    const sortedLiterals = [...stringLiterals].sort((a, b) => b.position - a.position);

    // Replace string literals with translation calls
    for (const literal of sortedLiterals) {
      const replacement = this.replaceStringWithTranslation(transformedContent, literal);
      transformedContent = replacement.content;

      changes.push({
        type: replacement.isNewKey ? "new_translation_key" : "existing_translation_key",
        original: replacement.original,
        key: replacement.key,
        context: replacement.context,
        namespace: namespace,
      });
    }

    return {
      content: transformedContent,
      changes,
      stringLiterals: stringLiterals.length,
      newKeys: changes.filter((c) => c.type === "new_translation_key").length,
      existingKeys: changes.filter((c) => c.type === "existing_translation_key").length,
    };
  }

  /**
   * Get hook name for namespace
   */
  getHookName(namespace) {
    const hookMap = {
      common: "useCommonTranslation",
      auth: "useAuthTranslation",
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
      navigation: "useNavigationTranslation",
    };

    return hookMap[namespace] || "useCommonTranslation";
  }

  /**
   * Check if file already has proper i18n setup
   */
  hasProperI18nSetup(content) {
    return (
      content.includes("useTypedTranslation()") ||
      (content.includes("{ t }") && content.includes("Translation"))
    );
  }
}

export { ASTI18nTransformer };
