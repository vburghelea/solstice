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

    // Check for JSX text nodes (user-facing text content)
    if (ts.isJsxText(node)) {
      const trimmedText = node.text.trim();
      // Skip empty or whitespace-only JSX text
      if (trimmedText && !this.isTechnicalString(trimmedText)) {
        const context = this.getContext(node);
        this.stringLiterals.push(
          new StringLiteralInfo(
            trimmedText,
            node,
            context,
            node.getStart(),
            node.getEnd(),
          ),
        );
      }
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

    // Very short strings or single characters are likely technical
    if (trimmed.length <= 2) return true;

    const technicalPatterns = [
      /^[a-zA-Z][a-zA-Z0-9_]*$/, // Single variable names (no spaces)
      /^https?:\/\//, // URLs
      /^[{}[\]()<>]+$/, // Only brackets
      /^\s*$/, // Whitespace only
      /^class\s+/, // Class definitions
      /^function\s+/, // Function definitions
      /^const\s+[a-zA-Z]/, // Const declarations
      /^let\s+[a-zA-Z]/, // Let declarations
      /^import\s+/, // Import statements
      /^export\s+/, // Export statements
      /^React$/, // React
      /^[A-Z][a-zA-Z]*Component$/, // Component names
      /^[a-z]+([A-Z][a-z]*)*$/, // camelCase identifiers (no spaces)
      /^[A-Z_]+$/, // All caps constants
      /^data-/, // Data attributes
      /^aria-/, // Aria attributes
      /^\w+\.\w+$/, // Simple property access
      /^#[a-fA-F0-9]{3,6}$/, // Hex colors
      // TypeScript-specific patterns (more specific)
      /^[a-zA-Z]+<.*>[^(]*$/, // Generic types without user content
      /^T[A-Z][a-zA-Z]*$/, // Type parameters
      /=>\s*{/, // Arrow function to object
      /:\s*[A-Z][a-zA-Z]*<.*>/, // Complex type annotations
      /^\s*[A-Z]+\s*<.*>[^(]*$/, // Generic type start
      /Promise<.*>/, // Promise types
      /Record<.*>/, // Record types
      /z\.infer<.*>/, // Zod inferred types
      /ServerFnResult<.*>/, // Server function result types
      /fn:\s*\([^)]*\)\s*=>/, // Function parameter types
      /options:\s*\{[^}]*\}/, // Options object types
      // More technical patterns (more specific)
      /^[,<>]\s*[A-Z]/, // Starts with generic type syntax
      /<T[^>]*>\s*[^(]*$/, // Type parameter syntax
      /async\s+function/, // Async function declarations
      /await\s+[a-zA-Z]/, // Await expressions
      /import\s+.*from\s*/, // Import statements
      /export\s+(const|function|class|interface)/, // Export declarations
      /^\s*\w+\s*:\s*\w+[,;]$/, // Object property types
      /return\s+\w+\s*as\s+/, // Type assertions in returns
    ];

    // If the string contains spaces and readable text, it's likely user-facing
    const hasSpaces = /\s/.test(trimmed);
    const hasReadableContent = /[a-zA-Z]{3,}/.test(trimmed);

    // If it has spaces and readable content, it's probably user-facing
    if (hasSpaces && hasReadableContent && trimmed.length > 5) {
      // But still check if it's a technical pattern with spaces
      const technicalWithSpaces = [
        /^const\s+\w+\s*=/,
        /^function\s+\w+\s*\(/,
        /^import\s+.*from/,
        /^export\s+(const|function|class)/,
        /:\s*[A-Z][a-zA-Z]*<.*>/,
        /<TData,\s*TResult>/,
        /^[,<>]\s*\w+.*>\s*\(/, // Generic function syntax
        /\w+,\s*TResult>/, // Generic parameter syntax
      ];

      return technicalWithSpaces.some((pattern) => pattern.test(trimmed));
    }

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

    // Handle JSX text nodes
    if (ts.isJsxText(node)) {
      // Find the containing JSX element or fragment
      let currentParent = parent;
      while (currentParent) {
        if (ts.isJsxElement(currentParent)) {
          return {
            type: "jsx_children",
            element: currentParent.openingElement?.name?.text || "unknown",
          };
        }
        if (ts.isJsxFragment(currentParent)) {
          return {
            type: "jsx_fragment_children",
          };
        }
        currentParent = currentParent.parent;
      }
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
   * Find existing translation for text in a specific namespace
   */
  findExistingTranslation(text, namespace = "common") {
    // First try to find in the specified namespace
    const namespaceTranslations = this.existingTranslations[namespace];
    if (namespaceTranslations) {
      const result = this.searchInObject(namespaceTranslations, text);
      if (result.path) {
        return {
          key: `${namespace}.${result.path}`,
          namespace,
          path: result.path,
        };
      }
    }

    // If not found in specified namespace, don't search other namespaces
    // This ensures we only use translations from the correct namespace
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
    let lastImportLine = -1;
    let inMultiLineImport = false;
    let insertionPoint = -1;

    // Find all import statements and the correct insertion point
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (
        trimmed === "" ||
        trimmed.startsWith("//") ||
        trimmed.startsWith("/*") ||
        trimmed.startsWith("*")
      ) {
        continue;
      }

      // Handle multi-line imports
      if (inMultiLineImport) {
        // Check if this line ends the multi-line import
        if (trimmed.includes("}") && trimmed.includes("from")) {
          inMultiLineImport = false;
          lastImportLine = i;
        }
        // Continue multi-line import
        continue;
      }

      // Check if this line starts a multi-line import
      if (
        (trimmed.startsWith("import ") &&
          trimmed.includes("{") &&
          !trimmed.includes("}")) ||
        trimmed.endsWith(",")
      ) {
        inMultiLineImport = true;
        lastImportLine = i;
        continue;
      }

      // Check for single-line import
      if (trimmed.startsWith("import ")) {
        lastImportLine = i;
        continue;
      }

      // If we reach here, we've hit non-import code
      if (lastImportLine >= 0) {
        // Insert after the last import, skip any empty lines
        insertionPoint = lastImportLine + 1;
        while (insertionPoint < lines.length && lines[insertionPoint].trim() === "") {
          insertionPoint++;
        }
        break;
      } else {
        // No imports found, insert at the top before any code
        insertionPoint = i;
        break;
      }
    }

    // If we didn't find an insertion point, put it at the end
    if (insertionPoint === -1) {
      insertionPoint = lines.length;
    }

    const newImport = `import { ${hookName} } from "~/hooks/useTypedTranslation";`;
    const hookDefinition = `const { t } = ${hookName}();`;

    // Insert import and hook definition
    lines.splice(insertionPoint, 0, newImport);
    lines.splice(insertionPoint + 1, 0, "");
    lines.splice(insertionPoint + 2, 0, hookDefinition);
    lines.splice(insertionPoint + 3, 0, "");

    return lines.join("\n");
  }

  /**
   * Check if file has early t() calls before component definitions
   */
  hasEarlyTCalls(content) {
    const lines = content.split("\n");
    let firstComponentIndex = lines.length;
    let firstTCallIndex = lines.length;

    // Find first component definition
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const componentPatterns = [
        /^export\s+function\s+\w+\s*\([^)]*\)\s*\{/,
        /^export\s+const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{/,
        /^export\s+const\s+\w+\s*=\s*\(\s*\)\s*=>\s*\{/,
        /^function\s+\w+\s*\([^)]*\)\s*\{/,
      ];

      if (componentPatterns.some((pattern) => pattern.test(line))) {
        firstComponentIndex = i;
        break;
      }
    }

    // Find first t() call that's not already in a hook definition
    for (let i = 0; i < lines.length; i++) {
      if (
        lines[i].includes("t(") &&
        (lines[i].includes("'") || lines[i].includes('"')) &&
        !lines[i].includes("const { t } =")
      ) {
        firstTCallIndex = i;
        break;
      }
    }

    return firstTCallIndex < firstComponentIndex;
  }

  /**
   * Check if file has user-facing strings before component definitions
   */
  hasEarlyUserFacingStrings(content) {
    const lines = content.split("\n");
    let firstComponentIndex = lines.length;
    let firstStringIndex = lines.length;

    // Find first component definition
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const componentPatterns = [
        /^export\s+function\s+\w+\s*\([^)]*\)\s*\{/,
        /^export\s+const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{/,
        /^export\s+const\s+\w+\s*=\s*\(\s*\)\s*=>\s*\{/,
        /^function\s+\w+\s*\([^)]*\)\s*\{/,
      ];

      if (componentPatterns.some((pattern) => pattern.test(line))) {
        firstComponentIndex = i;
        break;
      }
    }

    // Find first user-facing string that will be replaced with t()
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (this.containsUserFacingString(line)) {
        firstStringIndex = i;
        break;
      }
    }

    return firstStringIndex < firstComponentIndex;
  }

  /**
   * Check if a line contains user-facing strings
   */
  containsUserFacingString(line) {
    // Check for quoted strings that are likely user-facing
    const stringRegex = /["']([^"']+)["']/g;
    const matches = line.match(stringRegex);

    if (!matches) return false;

    // Filter out technical strings
    for (const match of matches) {
      const text = match.slice(1, -1); // Remove quotes
      if (!this.isTechnicalString(text) && text.length > 2) {
        return true;
      }
    }

    return false;
  }

  /**
   * Add translation hook usage at the appropriate location
   */
  insertTranslationUsage(content, hookName) {
    const lines = content.split("\n");

    // Since we now add the hook immediately after the import in insertTranslationImport,
    // we only need this method for cases where the import already exists but hook is missing
    const hasHookImport = content.includes(`import { ${hookName} }`);
    const hasHookDefinition = content.includes(`const { t } = ${hookName}()`);

    if (hasHookImport && !hasHookDefinition) {
      // Find the import line and add hook right after it, before any actual code
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`import { ${hookName} }`)) {
          // Look for the end of the import section and insert hook before first code
          let insertIndex = i + 1;

          // Skip empty lines after the import
          while (insertIndex < lines.length && lines[insertIndex].trim() === "") {
            insertIndex++;
          }

          // Insert hook before any actual code
          lines.splice(insertIndex, 0, `const { t } = ${hookName}();`);
          lines.splice(insertIndex + 1, 0, "");
          break;
        }
      }
    }

    return lines.join("\n");
  }

  /**
   * Replace string literal with translation call
   */
  replaceStringWithTranslation(content, literalInfo, namespace = "common") {
    const { position, end, text, context } = literalInfo;

    // Find existing translation in the specific namespace
    const existingTranslation = this.findExistingTranslation(text, namespace);

    // Only replace if an existing translation is found
    if (!existingTranslation) {
      return null; // Don't replace - leave the original string
    }

    const key = existingTranslation.path;

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
      isNewKey: false, // Always false since we only use existing translations
    };
  }

  /**
   * Transform a file using semantic AST understanding
   */
  transformFile(filePath, namespace = "common") {
    // Check if file should be excluded from processing
    if (this.shouldExcludeFile(filePath)) {
      return {
        content: this.content || readFileSync(filePath, "utf8"),
        changes: [],
        excluded: true,
        reason: "File type excluded from i18n processing",
      };
    }

    const analysis = this.analyzeFile(filePath);
    const { stringLiterals, content } = analysis;

    // Check if we need to fix hook placement even if no new strings
    const needsHookPlacementFix =
      (this.hasEarlyTCalls(content) || this.hasEarlyUserFacingStrings(content)) &&
      content.includes("useTypedTranslation") &&
      !content.includes(`const { t } = ${this.getHookName(namespace)}()`);

    if (stringLiterals.length === 0 && !needsHookPlacementFix) {
      return { content, changes: [] };
    }

    let transformedContent = content;
    const changes = [];

    // Sort string literals by position (reverse order to maintain indices)
    const sortedLiterals = [...stringLiterals].sort((a, b) => b.position - a.position);

    // Replace string literals with translation calls
    for (const literal of sortedLiterals) {
      const replacement = this.replaceStringWithTranslation(
        transformedContent,
        literal,
        namespace,
      );

      // Only process if replacement was successful (has existing translation)
      if (replacement) {
        transformedContent = replacement.content;

        changes.push({
          type: "existing_translation_key", // Always existing since we only use existing translations
          original: replacement.original,
          key: replacement.key,
          context: replacement.context,
          namespace: namespace,
        });
      }
    }

    return {
      content: transformedContent,
      changes,
      stringLiterals: stringLiterals.length,
      newKeys: 0, // No new keys are created anymore
      existingKeys: changes.length,
      hookPlacementFixed: needsHookPlacementFix,
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
   * Check if file should be excluded from i18n processing
   */
  shouldExcludeFile(filePath) {
    const path = filePath.toLowerCase();

    // Test files
    if (
      path.includes(".test.") ||
      path.includes("__tests__") ||
      path.includes(".spec.")
    ) {
      return true;
    }

    // Database schema files
    if (path.includes("/db/schema/") || path.includes(".schema.")) {
      return true;
    }

    // Query files and server-side code
    if (
      path.includes(".queries.") ||
      path.includes(".mutations.") ||
      path.includes(".repository.")
    ) {
      return true;
    }

    // Server utility files
    if (
      path.includes("/lib/server/") ||
      path.includes("server-helpers") ||
      path.includes("fn-utils")
    ) {
      return true;
    }

    // Migration and build scripts
    if (path.includes("/scripts/") || path.includes("/migrations/")) {
      return true;
    }

    // Type definition files
    if (
      path.endsWith(".d.ts") ||
      path.includes(".types.") ||
      path.includes(".db-types.")
    ) {
      return true;
    }

    // Configuration files
    if (
      path.includes("/config/") ||
      path.includes(".config.") ||
      path.includes(".json")
    ) {
      return true;
    }

    // Node modules and dist
    if (
      path.includes("/node_modules/") ||
      path.includes("/dist/") ||
      path.includes("/build/")
    ) {
      return true;
    }

    // Coverage and docs
    if (path.includes("/coverage/") || path.includes("/docs/")) {
      return true;
    }

    return false;
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
