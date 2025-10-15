#!/usr/bin/env node

/**
 * AST-based String Extractor
 *
 * Uses TypeScript Compiler API to exhaustively extract all user-facing strings
 * including those with variables, multi-line strings, and complex patterns.
 */

import { readFileSync } from "fs";
import * as ts from "typescript";

/**
 * String extraction result with context
 */
class StringExtraction {
  constructor(text, key, context, filePath, position, end, variables = []) {
    this.text = text;
    this.key = key;
    this.context = context;
    this.filePath = filePath;
    this.position = position;
    this.end = end;
    this.variables = variables; // Variables found in template literals
  }
}

/**
 * Template literal variable information
 */
class TemplateVariable {
  constructor(name, position, type = "identifier") {
    this.name = name;
    this.position = position;
    this.type = type; // 'identifier', 'expression', 'conditional'
  }
}

/**
 * AST-based string extractor with comprehensive pattern matching
 */
class ASTStringExtractor {
  constructor() {
    this.extractions = [];
    this.sourceFile = null;
    this.filePath = null;
  }

  /**
   * Extract all user-facing strings from a file
   */
  extractFromFile(filePath) {
    this.filePath = filePath;
    this.extractions = [];

    try {
      const content = readFileSync(filePath, "utf8");

      // Create source file with full compiler options
      const compilerOptions = {
        target: ts.ScriptTarget.Latest,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
      };

      this.sourceFile = ts.createSourceFile(
        filePath,
        content,
        compilerOptions.target,
        true,
        ts.ScriptKind.TSX,
      );

      // Walk the AST
      this.walkNode(this.sourceFile);
    } catch (error) {
      console.warn(`Warning: Could not parse ${filePath}: ${error.message}`);
    }

    return this.extractions;
  }

  /**
   * Recursively walk AST nodes and extract strings
   */
  walkNode(node) {
    if (!node || typeof node !== "object" || !node.kind) return;

    try {
      // Extract from different node types
      this.extractFromStringLiteral(node);
      this.extractFromTemplateLiteral(node);
      this.extractFromJsxText(node);
      this.extractFromJsxAttributes(node);
      this.extractFromPropertyAssignments(node);
      this.extractFromArrayLiterals(node);
      this.extractFromCallExpressions(node);

      // Recursively visit children with additional safety checks
      if (node.forEachChild) {
        node.forEachChild((child) => this.walkNode(child));
      } else {
        ts.forEachChild(node, (child) => this.walkNode(child));
      }
    } catch (error) {
      // Log the error but continue processing other nodes
      const nodeInfo = node.kind
        ? `kind ${ts.SyntaxKind[node.kind]}`
        : "unknown node type";
      console.warn(
        `Warning: Error processing ${nodeInfo} in ${this.filePath}: ${error.message}`,
      );
    }
  }

  /**
   * Extract from string literals
   */
  extractFromStringLiteral(node) {
    if (!ts.isStringLiteral(node)) return;
    if (!node || typeof node.text !== "string") return;

    try {
      // Skip if it's a technical string
      if (this.isTechnicalString(node.text)) return;

      // Check if it's in a user-facing context
      if (this.isUserFacingContext(node)) {
        const context = this.getContext(node);
        const key = this.generateKey(node.text, context);

        this.extractions.push(
          new StringExtraction(
            node.text,
            key,
            context,
            this.filePath,
            node.getStart(),
            node.getEnd(),
          ),
        );
      }
    } catch (error) {
      console.warn(
        `Warning: Error extracting string literal "${node?.text}" in ${this.filePath}: ${error.message}`,
      );
    }
  }

  /**
   * Extract from template literals (including those with variables)
   */
  extractFromTemplateLiteral(node) {
    if (!ts.isTemplateLiteral(node)) return;

    // Skip if not in user-facing context
    if (!this.isUserFacingContext(node)) return;

    const templateParts = this.extractTemplateLiteralParts(node);
    const variables = this.extractTemplateVariables(node);

    // Only extract if there's meaningful text content
    const hasText = templateParts.some((part) => part.text.trim().length > 0);
    if (!hasText) return;

    const context = this.getContext(node);
    const combinedText = templateParts.map((part) => part.text).join("");

    // Skip if the combined text is technical
    if (this.isTechnicalString(combinedText)) return;

    const key = this.generateKey(combinedText, context);

    this.extractions.push(
      new StringExtraction(
        combinedText,
        key,
        context,
        this.filePath,
        node.getStart(),
        node.getEnd(),
        variables,
      ),
    );
  }

  /**
   * Extract parts of a template literal
   */
  extractTemplateLiteralParts(templateLiteral) {
    const parts = [];

    // Add text from head
    if (templateLiteral.head.text) {
      parts.push({ text: templateLiteral.head.text, isTemplate: false });
    }

    // Add text from each span
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
   * Extract variables from template literals
   */
  extractTemplateVariables(templateLiteral) {
    const variables = [];

    templateLiteral.templateSpans.forEach((span) => {
      const variable = this.analyzeExpression(span.expression);
      if (variable) {
        variables.push(variable);
      }
    });

    return variables;
  }

  /**
   * Analyze an expression to extract variable information
   */
  analyzeExpression(expression) {
    if (!expression || typeof expression !== "object" || !expression.kind) {
      return new TemplateVariable("unknown", 0, "unknown");
    }

    try {
      switch (expression.kind) {
        case ts.SyntaxKind.Identifier:
          return new TemplateVariable(
            expression.text || "unknown",
            typeof expression.getStart === "function" ? expression.getStart() : 0,
            "identifier",
          );

        case ts.SyntaxKind.PropertyAccessExpression:
          const propertyAccess = this.getPropertyAccessText(expression);
          return new TemplateVariable(
            propertyAccess,
            typeof expression.getStart === "function" ? expression.getStart() : 0,
            "property_access",
          );

        case ts.SyntaxKind.ConditionalExpression:
          return new TemplateVariable(
            this.getExpressionText(expression),
            typeof expression.getStart === "function" ? expression.getStart() : 0,
            "conditional",
          );

        case ts.SyntaxKind.CallExpression:
          return new TemplateVariable(
            this.getExpressionText(expression),
            expression.getStart(),
            "call_expression",
          );

        default:
          return new TemplateVariable(
            this.getExpressionText(expression),
            expression.getStart(),
            "expression",
          );
      }
    } catch (error) {
      // Fallback for unexpected expression structures
      return new TemplateVariable(
        "unknown_expression",
        expression.getStart ? expression.getStart() : 0,
        "unknown",
      );
    }
  }

  /**
   * Get text representation of an expression
   */
  getExpressionText(expression) {
    if (!expression || !this.sourceFile || typeof expression !== "object") {
      return "unknown";
    }

    try {
      const start = expression.getStart?.();
      const end = expression.getEnd?.();

      if (typeof start !== "number" || typeof end !== "number" || start >= end) {
        return "unknown";
      }

      return this.sourceFile.getText().slice(start, end).trim();
    } catch (error) {
      return "unknown";
    }
  }

  /**
   * Get property access text
   */
  getPropertyAccessText(propertyAccess) {
    if (!propertyAccess) {
      return "unknown";
    }

    try {
      if (ts.isIdentifier(propertyAccess.expression)) {
        return `${propertyAccess.expression.text}.${propertyAccess.name.text}`;
      }
      return this.getExpressionText(propertyAccess);
    } catch (error) {
      return "unknown";
    }
  }

  /**
   * Extract from JSX text content
   */
  extractFromJsxText(node) {
    if (!ts.isJsxText(node)) return;

    const text = node.getText();
    const trimmedText = text.trim();

    // Skip empty text or whitespace-only text
    if (!trimmedText || trimmedText.length < 3) return;

    // Skip technical content
    if (this.isTechnicalString(trimmedText)) return;

    const context = {
      type: "jsx_text",
      parent: this.getParentElement(node),
    };

    const key = this.generateKey(trimmedText, context);

    this.extractions.push(
      new StringExtraction(
        trimmedText,
        key,
        context,
        this.filePath,
        node.getStart(),
        node.getEnd(),
      ),
    );
  }

  /**
   * Extract from JSX attributes
   */
  extractFromJsxAttributes(node) {
    if (!ts.isJsxAttribute(node)) return;
    if (!node.name || typeof node.name.text !== "string") return;

    const attributeName = node.name.text;

    // Only process user-facing attributes
    if (!this.isUserFacingAttribute(attributeName)) return;

    try {
      // Handle string literal values
      if (
        node.initializer &&
        node.initializer.expression &&
        ts.isStringLiteral(node.initializer.expression)
      ) {
        const text = node.initializer.expression.text;
        if (!this.isTechnicalString(text)) {
          const context = {
            type: "jsx_attribute",
            attribute: attributeName,
            element: this.getParentElement(node),
          };

          const key = this.generateKey(text, context);

          this.extractions.push(
            new StringExtraction(
              text,
              key,
              context,
              this.filePath,
              node.initializer.expression.getStart(),
              node.initializer.expression.getEnd(),
            ),
          );
        }
      }

      // Handle template literal values
      if (
        node.initializer &&
        node.initializer.expression &&
        ts.isTemplateLiteral(node.initializer.expression)
      ) {
        this.extractFromTemplateLiteral(node.initializer.expression);
      }
    } catch (error) {
      console.warn(
        `Warning: Error extracting JSX attribute "${attributeName}" in ${this.filePath}: ${error.message}`,
      );
    }
  }

  /**
   * Extract from property assignments
   */
  extractFromPropertyAssignments(node) {
    if (!ts.isPropertyAssignment(node)) return;

    const propertyName = node.name?.text;

    // Only process user-facing properties
    if (!this.isUserFacingProperty(propertyName)) return;

    // Handle string literal values
    if (node.initializer && ts.isStringLiteral(node.initializer)) {
      const text = node.initializer.text;
      if (!this.isTechnicalString(text)) {
        const context = {
          type: "property_assignment",
          property: propertyName,
        };

        const key = this.generateKey(text, context);

        this.extractions.push(
          new StringExtraction(
            text,
            key,
            context,
            this.filePath,
            node.initializer.getStart(),
            node.initializer.getEnd(),
          ),
        );
      }
    }

    // Handle template literal values
    if (node.initializer && ts.isTemplateLiteral(node.initializer)) {
      this.extractFromTemplateLiteral(node.initializer);
    }
  }

  /**
   * Extract from array literals
   */
  extractFromArrayLiterals(node) {
    if (!ts.isArrayLiteralExpression(node)) return;

    // Check if this array is in a user-facing context
    if (!this.isUserFacingContext(node)) return;

    node.elements.forEach((element) => {
      if (ts.isStringLiteral(element)) {
        const text = element.text;
        if (!this.isTechnicalString(text)) {
          const context = {
            type: "array_element",
            parent: this.getContext(node).type,
          };

          const key = this.generateKey(text, context);

          this.extractions.push(
            new StringExtraction(
              text,
              key,
              context,
              this.filePath,
              element.getStart(),
              element.getEnd(),
            ),
          );
        }
      }
    });
  }

  /**
   * Extract from function call arguments
   */
  extractFromCallExpressions(node) {
    if (!ts.isCallExpression(node)) return;

    // Check for specific functions that might contain user-facing strings
    if (this.isUserFacingCallExpression(node)) {
      node.arguments.forEach((arg) => {
        if (ts.isStringLiteral(arg)) {
          const text = arg.text;
          if (!this.isTechnicalString(text)) {
            const context = {
              type: "call_argument",
              function: this.getExpressionText(node.expression),
            };

            const key = this.generateKey(text, context);

            this.extractions.push(
              new StringExtraction(
                text,
                key,
                context,
                this.filePath,
                arg.getStart(),
                arg.getEnd(),
              ),
            );
          }
        }
      });
    }
  }

  /**
   * Check if a node is in a user-facing context
   */
  isUserFacingContext(node) {
    const parent = node.parent;
    if (!parent || typeof parent !== "object") return false;

    // JSX children
    if (ts.isJsxElement(parent) || ts.isJsxFragment(parent)) {
      return true;
    }

    // JSX attributes
    if (ts.isJsxAttribute(parent) && parent.name && parent.name.text) {
      return this.isUserFacingAttribute(parent.name.text);
    }

    // Property assignments
    if (ts.isPropertyAssignment(parent) && parent.name) {
      return this.isUserFacingProperty(parent.name?.text);
    }

    // Array elements
    if (ts.isArrayLiteralExpression(parent)) {
      return this.isUserFacingContext(parent);
    }

    // Return statements
    if (ts.isReturnStatement(parent)) {
      return true;
    }

    // Variable declarations with user-facing values
    if (ts.isVariableDeclaration(parent)) {
      return this.isUserFacingVariableDeclaration(parent);
    }

    return false;
  }

  /**
   * Check if attribute is user-facing
   */
  isUserFacingAttribute(attributeName) {
    const userFacingAttributes = [
      "label",
      "placeholder",
      "title",
      "alt",
      "aria-label",
      "description",
      "subtitle",
      "heading",
      "caption",
      "tooltip",
      "helptext",
      "errormessage",
      "validationmessage",
    ];

    return userFacingAttributes.includes(attributeName.toLowerCase());
  }

  /**
   * Check if property is user-facing
   */
  isUserFacingProperty(propertyName) {
    if (!propertyName) return false;

    const userFacingProperties = [
      "message",
      "error",
      "description",
      "title",
      "text",
      "subtitle",
      "content",
      "label",
      "placeholder",
      "heading",
      "caption",
      "tooltip",
      "helptext",
    ];

    return userFacingProperties.includes(propertyName.toLowerCase());
  }

  /**
   * Check if call expression is user-facing
   */
  isUserFacingCallExpression(node) {
    const expression = this.getExpressionText(node.expression);
    const userFacingFunctions = [
      "alert",
      "confirm",
      "prompt",
      "console.log",
      "toast",
      "notification",
      "showMessage",
    ];

    return userFacingFunctions.includes(expression);
  }

  /**
   * Check if variable declaration is user-facing
   */
  isUserFacingVariableDeclaration(node) {
    // Variables containing user-facing strings
    const userFacingPatterns = [
      /^(title|label|message|text|error|description)/i,
      /.*string$/i,
      /.*message$/i,
    ];

    return userFacingPatterns.some((pattern) => pattern.test(node.name.getText()));
  }

  /**
   * Check if string is technical and should not be extracted
   */
  isTechnicalString(text) {
    if (!text || typeof text !== "string") return true;
    const trimmed = text.trim();

    if (trimmed.length < 3) return true;

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
      /^\$[a-zA-Z]/, // Template variable references

      // CSS and Tailwind patterns
      /^[a-z]+-[a-z0-9]+(-[a-z0-9]+)*$/, // CSS classes with hyphens
      /^border[a-zA-Z0-9_-]+/, // Border utility classes
      /^bg-[a-zA-Z0-9_-]+/, // Background utility classes
      /^text-[a-zA-Z0-9_-]+/, // Text utility classes
      /^shadow[a-zA-Z0-9_-]+/, // Shadow utility classes
      /^p[a-z]-?[0-9]?/, // Padding utilities
      /^m[a-z]-?[0-9]?/, // Margin utilities
      /^w-[0-9]+/, // Width utilities
      /^h-[0-9]+/, // Height utilities
      /^flex/, // Flex utilities
      /^grid/, // Grid utilities
      /^rounded[a-z0-9_-]*$/, // Border radius utilities
      /^space-[xy]-[0-9]+/, // Space utilities
      /^gap-[0-9]+/, // Gap utilities

      // More technical patterns
      /^rgba?\([^)]+\)$/, // RGB/RGBA colors
      /^hsl\([^)]+\)$/, // HSL colors
      /^\d+px$/, // Pixel values
      /^\d+rem$/, // Rem values
      /^\d+em$/, // Em values
      /^\d+%$/, // Percentage values
      /^\d+vh$/, // Viewport height
      /^\d+vw$/, // Viewport width

      // Hex color with alpha/opacity
      /^#[a-fA-F0-9]{8}$/, // 8-digit hex (with alpha)
      /^#[a-fA-F0-9]{6}$/, // 6-digit hex
      /^#[a-fA-F0-9]{3,4}$/, // 3-4 digit hex

      // Complex CSS values (like the borderamber example)
      /^[a-zA-Z]+[0-9]+_?[a-zA-Z0-9_]*$/, // Alphanumeric with underscores (likely technical)
      /^[a-z]+[0-9]+[a-zA-Z]*[0-9]*_?[a-zA-Z0-9_]*$/, // Mixed alphanumeric patterns

      // TypeScript/JavaScript code fragments
      /^field_.*_.*:$/, // Field type annotations
      /^_[a-zA-Z0-9_]*_[a-f0-9]{4}$/, // Technical keys with hash suffixes
      /^_await_/, // Await expressions
      /^_const_/, // Const declarations
      /^_if_/, // If statements
      /^_else/, // Else statements
      /^_return/, // Return statements
      /^_catch_/, // Catch blocks
      /^_throw_/, // Throw statements
      /^_console\./, // Console statements
      /^_for_/, // For loops
      /^_while_/, // While loops
      /^_try/, // Try blocks

      // Database and API patterns
      /^_.*_eq_/, // Database equality comparisons
      /^_.*_where_/, // Database where clauses
      /^_.*_from_/, // Database from clauses
      /^_.*_select_/, // Database select statements
      /^_.*_insert_/, // Database insert statements
      /^_.*_update_/, // Database update statements
      /^_.*_delete_/, // Database delete statements

      // Technical patterns with underscores
      /^__[a-zA-Z0-9_]*__$/, // Double underscore patterns
      /^_[a-zA-Z0-9_]+_$/, // Single underscore patterns
      /^[a-z_]+$/, // Lowercase with underscores (likely technical)
      /^_.*_handler$/, // Function handlers
      /^_.*_context$/, // Context objects
      /^_.*_request$/, // Request objects

      // Code-like patterns
      /^[a-zA-Z]+\(.*\)$/, // Function calls
      /^[a-zA-Z]+\.[a-zA-Z]+\(.*\)$/, // Method calls
      /^[a-zA-Z]+\.[a-zA-Z]+$/, // Property access
      /^\$\{.*\}$/, // Template literals
      /^[{}[\](),;:]+$/, // Brackets and punctuation only
      /^=>$/, // Arrow function
      /^[<>&|]+$/, // Operators only

      // Programming language constructs
      /^async\s+/, // Async functions
      /^function\s+/, // Function declarations
      /^class\s+/, // Class declarations
      /^interface\s+/, // Interface declarations
      /^type\s+/, // Type declarations
      /^import\s+/, // Import statements
      /^export\s+/, // Export statements
      /^from\s+/, // From clauses
      /^default\s+/, // Default exports

      // Version control and build patterns
      /^v\d+\.\d+\.\d+$/, // Version numbers
      /^[a-f0-9]{7,40}$/, // Git hashes
      /^build:/, // Build prefixes
      /^dev:/, // Development prefixes

      // Configuration and environment patterns
      /^[A-Z_]+_URL$/, // Environment variables
      /^[A-Z_]+_KEY$/, // API keys
      /^[A-Z_]+_ID$/, // IDs in environment vars

      // Additional code fragment patterns
      /^[a-zA-Z_]+_null_/, // Null assignments
      /^[a-zA-Z_]+_if_/, // Conditional statements with underscores
      /^[a-zA-Z_]+_const_/, // Const declarations with underscores
      /^[a-zA-Z_]+_await_/, // Await expressions with underscores
      /^[a-zA-Z_]+_throw_/, // Throw statements with underscores
      /^[a-zA-Z_]+_return_/, // Return statements with underscores
      /^[a-zA-Z_]+_catch_/, // Catch blocks with underscores
      /^[a-zA-Z_]+_else_/, // Else statements with underscores
      /^[a-zA-Z_]+_console\./, // Console statements with underscores
      /^[a-zA-Z_]+_for_/, // For loops with underscores
      /^[a-zA-Z_]+_while_/, // While loops with underscores
      /^[a-zA-Z_]+_try_/, // Try blocks with underscores
      /^[a-zA-Z_]+_export_/, // Export statements with underscores

      // Long technical strings (likely code fragments)
      /^[a-zA-Z_]{20,}_[a-f0-9]{4}$/, // Long technical keys with hash
      /^[a-zA-Z_]{30,}$/, // Very long underscore strings
      /^_[a-zA-Z_]{20,}_[a-f0-9]{4}$/, // Long technical strings with hash

      // Specific patterns for the problematic examples
      /^_unknownfield_/, // Unknown field patterns
      /^_updatedfields/, // Updated fields patterns
      /^_detailslug_/, // Detail slug patterns
      /^_partitiontags/, // Partition tags patterns
      /^_cheeriocrawlingcontext/, // Cheerio crawler context
      /^field_.*_.*_>/, // Field type annotations ending with >
      /^: \$\s*$/, // Dollar sign patterns (template literals)

      // Function signature patterns
      /\(.*:.*\)\s*=>/, // Arrow function signatures
      /keyof typeof/, // TypeScript keyof typeof
      /[a-zA-Z]+\s*:\s*[a-zA-Z]+/, // Type annotations

      // Additional patterns for the remaining technical strings
      /^_for_/, // For loops and functions
      /^_createmockserverfn_/, // Mock server function creation
      /^_.*_server_fn_/, // Server function patterns
      /^dynamic_content_/, // Dynamic content placeholders
      /^_convert_to_string_and_esca/, // String escaping patterns
      /^widthdevice.*initialscale/, // Meta viewport tags
      /^_unknown_/, // Unknown type annotations
      /^return_fetcher_/, // Return fetcher patterns
      /^_wrapper_that_/, // Wrapper function patterns
      /^_tdata_/, // Type data patterns
      /^_tresult_/, // Type result patterns
      /^_promise/, // Promise patterns
      /^resolved/, // Resolved variable patterns
      /^_return_/, // Return statements with underscores
      /^_await_/, // Await expressions
      /^_const_/, // Const declarations with underscores
      /^_if_/, // If statements with underscores
      /^_else/, // Else statements with underscores
      /^_catch_/, // Catch blocks with underscores
      /^_console\./, // Console statements with underscores
      /^_throw_/, // Throw statements with underscores
      /^_export_/, // Export statements with underscores
      /^_import_/, // Import statements with underscores
      /^_function_/, // Function declarations with underscores
      /^_class_/, // Class declarations with underscores
      /^_interface_/, // Interface declarations with underscores
      /^_type_/, // Type declarations with underscores

      // TypeScript generics and type annotations
      /^_.*unknown.*>/, // Unknown type annotations
      /^_.*Promise/, // Promise type annotations
      /^_.*Record/, // Record type annotations
      /^_.*TData/, // Generic data types
      /^_.*TResult/, // Generic result types
      /^_.*fn_options/, // Function option types
      /^_.*value_is/, // Value type guards
      /^_.*hasfetcher/, // Fetcher data patterns
      /^_.*unwrap/, // Unwrapping patterns

      // Code fragments with punctuation and operators
      /^[,<>].*unknown/, // Generic type annotations starting with punctuation
      /^[,<>].*Promise/, // Promise types starting with punctuation
      /^[,<>].*Record/, // Record types starting with punctuation
      /^\),.*:/, // Function parameter lists
      /^=&gt;/, // Arrow operators
      /^=&gt;.*Promise/, // Arrow functions returning promises
      /^&amp;&amp;/, // Logical operators
      /^\|\|/, // OR operators
      /^[{}[\](),;:]+$/, // Brackets and punctuation only (enhanced)

      // Fragment patterns that indicate code
      /return.*fn.*options/, // Function return patterns
      /fetcher.*data.*value/, // Fetcher data patterns
      /server.*function.*data/, // Server function patterns
      /await.*resolved/, // Await resolved patterns
      /resolved\.json/, // JSON resolution patterns
      /isRecord.*hasFetcherData/, // Type guard patterns

      // Technical keys with hash suffixes that are actually code
      /^_[a-zA-Z_]*unknown[a-zA-Z_]*_[a-f0-9]{4}$/, // Unknown type patterns with hash
      /^_[a-zA-Z_]*promise[a-zA-Z_]*_[a-f0-9]{4}$/, // Promise patterns with hash
      /^_[a-zA-Z_]*tdata[a-zA-Z_]*_[a-f0-9]{4}$/, // Type data patterns with hash
      /^_[a-zA-Z_]*tresult[a-zA-Z_]*_[a-f0-9]{4}$/, // Type result patterns with hash
      /^_[a-zA-Z_]*fn_[a-zA-Z_]*_[a-f0-9]{4}$/, // Function patterns with hash

      // Code-like multiline fragments
      /^return.*\n.*\n.*\}/, // Multi-line return statements
      /^export.*function.*\n.*\n/, // Multi-line function exports
      /^if.*\n.*\n.*}/, // Multi-line if statements
      /^try.*\n.*\n.*catch/, // Multi-line try-catch blocks

      // Technical string patterns containing code fragments
      /value is Record/, // Type guard fragments
      /hasFetcherData/, // Fetcher data fragments
      /unwrapServerFnResult/, // Server function unwrapping
      /resolved\.data/, // Resolved data access
      /server functions return/, // Server function documentation

      // Brackets and operators that indicate code fragments
      /^[,<>{}()[\];]+$/, // Only brackets and punctuation
      /^[=&gt;&amp;\|]+$/, // Only operators
      /^return.*[{}[\](),;:]/, // Return with brackets
      /^export.*[{}[\](),;:]/, // Export with brackets
      /^import.*[{}[\](),;:]/, // Import with brackets

      // Meta and configuration patterns
      /^width=device-width.*initial-scale=1/, // Viewport meta tags (full pattern)
      /^charset=.*/, // Charset meta tags
      /meta.*viewport/, // Meta viewport references
      /meta.*charset/, // Meta charset references

      // Enhanced patterns for the specific examples found
      /^_.*_value_is_record_/, // Value is record type guards
      /^_.*_hasfetcherdata/, // Fetcher data detection
      /^return_fetcher_in_value_data_in_value/, // Fetcher detection logic
      /^_.*_server_fn_/, // Server function references
      /^_.*_unwrap/, // Unwrapping utilities
      /^_.*_json_as_/, // JSON parsing patterns
      /^_.*_simple_helper/, // Helper function patterns

      // Very short fragments that are likely code
      /^[,()]$/, // Single punctuation marks
      /^[{}]\s*$/, // Empty objects/arrays
      /^=&gt;\s*$/, // Arrow operators only
      /^-\s*\d/, // Negative numbers
      /^\^\s*\w/, // Exponentiation

      // Patterns that indicate inline code or technical documentation
      /response.*data.*default/, // Response documentation
      /response.*full.*raw/, // Response type documentation
      /calling.*server.*functions/, // Server function documentation
      /maintain.*consistency/, // Consistency documentation
      /helper.*only.*needed/, // Helper function documentation

      // Specific patterns for the problematic examples found
      /^createMockServerFn/, // Mock server function creation
      /createMockServerFn.*\n.*};/, // Mock server function export pattern
      /: createMockServerFn,\n};/, // Mock server function assignment pattern
      /^dynamic_content(_\d+)?$/, // Dynamic content placeholders
      /segments\.join/, // Array join operations
      /\.join\("/, // String join operations
      /value === "object"/, // Object type checking
      /Convert to string and esca/, // String escaping comments
      /returnValue.*stringValue/, // Return value patterns
      /val\.substring/, // Substring operations
      /\$\{.*\.join\(/, // Template literals with join
      /\$\{.*value ===/, // Template literals with conditionals
      /\$\{.*return/, // Template literals with return
      /\$\{.*\.substring/, // Template literals with substring

      // Enhanced template literal patterns for code fragments
      /\$\{[^}]*\.join\([^}]*\}\}/, // Template literals with method calls
      /\$\{[^}]*===[^}]*\}\}/, // Template literals with comparisons
      /\$\{[^}]*return[^}]*\}\}/, // Template literals with return statements
      /\$\{[^}]*\/\/[^}]*\}\}/, // Template literals with comments
      /\$\{\s*[^}]*\.\s*[^}]*\}\}/, // Template literals with property access

      // Multi-line code fragments in template literals
      /\$\{[^}]*\n[^}]*\}\}/, // Multi-line template literals
      /"\$\{[^}]*\n[^}]*\}"/, // Quoted multi-line template literals

      // Code assignment patterns
      /: \w+,\n};/, // Object property assignments
      /createMock.*Fn/, // Mock function creation
      /server.*fn.*test/, // Server function test patterns

      // String manipulation patterns that are technical
      /\.substring\(/, // Substring method calls
      /\.slice\(/, // Slice method calls
      /\.join\(/, // Join method calls
      /returnValue/, // Return value patterns

      // Comment patterns in strings
      /\/\//, // Single line comments
      /\/\*/, // Multi-line comments
      /\*\//, // Comment endings

      // Technical placeholder patterns
      /dynamic_content/, // Dynamic content placeholders
      /segments/, // Array segment patterns
      /stringValue/, // String value patterns

      // Code fragment patterns from game-systems and similar files
      /^updatedFields/, // Updated field operations
      /applyChange/, // Apply change function calls
      /detail\.slug/, // Detail property access
      /existingRow\./, // Existing row property access
      /externalRefs/, // External references
      /uploadedIds/, // Uploaded ID arrays
      /heroImageId/, // Hero image ID patterns
      /CheerioCrawlingContext/, // Web crawler context
      /requestHandler/, // Request handler patterns
      /Math\.random/, // Math random calls
      /setTimeout/, // Timeout functions
      /recordEvent/, // Event recording
      /console\.error/, // Console error calls
      /CRAWLER_USER_AGENT/, // Crawler user agent
      /unmappedCounts/, // Unmapped count variables

      // Variable assignment and declaration patterns (more specific)
      /^const\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=/, // Constant declarations with assignment
      /^let\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=/, // Let declarations with assignment
      /^var\s+[a-zA-Z_$][a-zA-Z-0-9_$]*\s*=/, // Var declarations with assignment
      /\.push\s*\(/, // Array push operations
      /\.length/, // Array/object length

      // Specific code fragment patterns that are still getting through
      /; i\+\+\)/, // Loop increment fragments
      /, number> =/, // TypeScript generic parameter fragments
      /\d+; attempt\+\+\)/, // Numbered attempt loop fragments
      /, tags=\$/, // GraphQL variable fragments
      /, images=\$/, // GraphQL variable fragments
      /\| null = null;\n      try/, // TypeScript nullable assignment with try block
      /• Slug:/, // This is a UI label, keep it but remove the bullet
      /^Asset #$/, // This is a UI label, keep it

      // Control flow patterns (more specific)
      /\bif\s+\(/, // If statements (word boundary)
      /\bcatch\s+\(/, // Catch blocks (word boundary)
      /\belse\b/, // Else statements (word boundary)
      /\bfor\s+\(/, // For loops (word boundary)
      /\bwhile\s+\(/, // While loops (word boundary)
      /\btry\s*{/, // Try blocks (word boundary)
      /\breturn\s+[^;{}]+/, // Return statements with content

      // Function and method patterns (more specific)
      /async\s+\w+\s*\(/, // Async function declarations
      /await\s+\w+\s*\./, // Await expressions with property access
      /await\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/, // Await expressions with function calls

      // String and code manipulation patterns (more specific)
      /as\s+string\s*\)/, // Type assertions (specific format)
      /null\s*===?\s*null/, // Null comparisons (specific format)
      /===\s*undefined/, // Undefined comparisons
      /typeof\s+\w+/, // Typeof operations

      // Remove overly broad patterns that catch legitimate user text
      // /===|!==|==|!=/, // Equality operators (too broad)
      // />=|<=|>|</, // Comparison operators (too broad)
      // /\+\+|--/, // Increment/decrement (too broad)
      // /\+=|-=|\*=|\/=/, // Assignment operators (too broad)

      // Object and array patterns
      /\[\s*\d+\s*\]/, // Array index access
      /\.\w+\s*:/, // Object property definitions
      /\{\s*\w+\s*:/, // Object literals
      /\[\s*\]/, // Empty arrays
      /\{\s*\}/, // Empty objects

      // Template literal and string patterns
      /\\n/, // Newline escapes
      /\\t/, // Tab escapes
      /\\\"/, // Quote escapes
      /\\\\/, // Backslash escapes
      /`.*\$\{.*\}.*`/, // Template literals
      /\$\{.*\}/, // Template expressions

      // Import/export patterns
      /import\s+/, // Import statements
      /export\s+/, // Export statements
      /from\s+['"]/, // From clauses
      /require\s*\(/, // Require calls

      // Type annotation patterns
      /:\s*\w+/, // Type annotations
      /:\s*\w+\[\]/, // Array type annotations
      /:\s*\w+\s*\|/, // Union types
      /<.*>/, // Generic types
      /extends\s+\w+/, // Class inheritance
      /implements\s+\w+/, // Interface implementation

      // Error handling patterns
      /throw\s+/, // Throw statements
      /Error\s*\(/, // Error constructors
      /catch\s*\(\w+\)/, // Catch parameter declarations
      /finally\s*{/, // Finally blocks

      // Web/HTTP patterns
      /User-Agent/, // User agent headers
      /headers/, // HTTP headers
      /request\./, // Request object access
      /response\./, // Response object access
      /url\s*===/, // URL comparisons

      // Database/storage patterns
      /insert\s*\(/, // Database insert
      /update\s*\(/, // Database update
      /delete\s*\(/, // Database delete
      /select\s+\w+/, // Database select
      /WHERE\s+/, // SQL where clauses
      /checksum/, // Data integrity patterns

      // More specific patterns for remaining technical strings
      /^: \w+,\n};$/, // Object assignment patterns
      /^\),.*:\s*\w+.*>\s*\(.*\)/, // Function parameter type annotations
      /^,.*>\s*\(.*options.*:\s*\w+.*\)/, // Generic function option types
      /^: .*Promise/, // Promise return type annotations
      /^fn.*options/, // Function option parameter patterns
      /^TData.*Promise/, // Generic data promise patterns
      /^TResult.*fn.*options/, // Generic result function patterns

      // Specific TypeScript generics patterns
      /^\),\s*unknown>/, // Unknown parameter types
      /^,\s*unknown>&/, // Unknown intersection types
      /^\),.*: Promise/, // Function return promises
      /^: TData.*Promise/, // Generic data promises
      /^, TResult>.*fn.*options/, // Generic result function options

      // Patterns that indicate these are type annotations or code fragments
      /^\),.*>.*\(/, // Parameter lists with generics
      /^:.*>\s*\(/, // Return types with generics
      /^fn.*\(.*options.*\)/, // Function definitions with options
      /^TData.*\}\).*Promise/, // Generic data with closing braces

      // Assignment and export patterns that are technical
      /^: \w+,\n};/, // Variable assignments with closing braces
      /createMockServerFn.*\n.*};/, // Mock function exports
      /\w+Fn,\n};/, // Function exports with Fn suffix

      // Very technical patterns that should never be user-facing
      /^:.*>\s*\(.*\).*=>/, // Arrow function type annotations
      /^\),.*:.*>\s*\(.*\)/, // Generic parameter lists
      /^T[A-Z]\w*\s*>/, // Generic type parameters
      /\w+Data.*Promise/, // Data promise patterns
      /\w+Result.*options/, // Result option patterns

      // Very short code fragments that are clearly technical
      /^const$/, // Just "const"
      /^return$/, // Just "return"
      /^: \w+$/, // Type annotations like ": $"
      /^,$/, // Just commas
      /^\w+:$/, // Property labels with colon
      /^_\d+$/, // Underscore with numbers
      /^;\s*\n\s*\}\s*\}\s*\n\s*\w+$/, // Multi-line code endings
      /^\w+:,$/, // Property labels with comma

      // Punctuation and operator patterns that indicate code
      /^[{}()[\];,]+$/, // Only brackets and punctuation
      /^[+\-*/%=<>]+$/, // Only operators
      /^;\s*\n\s*}\s*}\s*\n\s*return$/, // Return statement patterns

      // Generic programming patterns
      /^\w+,:$/, // Properties with commas
      /^,\s*\w+$/, // Commas with identifiers
      /^\w+\s*$/, // Single identifiers (likely variables)

      // Exact patterns for the remaining problematic strings
      /^\): \$$/, // Exact match for "): $"
      /^;\s*\n\s*\}\s*\}$/, // Exact match for ";\n  }\n}"
      /^_\d+$/, // Underscore with numbers (like __1)
      /^_$/, // Single underscore
      /^,\s*\w+:$/, // Comma with property and colon
      /^;\s*\n\s*\}\s*\}\s*\n\s*return\s*\w+$/, // Return statement patterns

      // Exact patterns for the remaining problematic strings
      /^,\n\): Promise$/, // Function return type annotation (exact match)
      /^\(resolved\)\)$/, // Resolved value pattern (exact match)
      /^, TResult>\n  fn \(options:$/, // Generic function type definition (without closing parenthesis)
      /^\), unknown>$/, // Unknown type parameter (exact match)
      /^, unknown>&$/, // Unknown intersection type (exact match)
      /^: TData \}\) => Promise$/, // Generic data promise (exact match)

      // More general patterns for similar fragments
      /^\),\s*\w+>$/, // Parameter type annotations
      /^,\s*\w+>$/, // Generic type annotations
      /^\(\w+\)\)$/, // Wrapped values
      /^\n\s*\): \w+>$/, // Multi-line return types
      /^\n\s+\w+ \(/, // Multi-line function definitions
      /^, \w+>\n.*fn.*\(/, // Multi-line generic function definitions
      /^, T\w+>\n.*fn.*\(/, // Multi-line generic function definitions with T-prefixed types

      // Pattern fragments that indicate these are code snippets
      /fn \(options:/, // Function option parameters
      /\} \) => Promise/, // Arrow function returns
      /\), unknown>/, // Unknown type parameters
      /, unknown>&/, // Unknown intersection types

      // Additional patterns for TypeScript fragments
      /^\),.*>.*\n.*fn/, // Generic function definitions
      /^:.*\}\).*=>.*Promise/, // Generic arrow functions
      /^\n.*fn.*\(.*options/, // Multi-line function options
      /\(resolved\)\)/, // Resolved value patterns
      /,\s*TResult>.*fn/, // Generic result functions

      // Template literal patterns
      /^\$\{.*\}$/, // Template literal expressions
      /^\$\{[^}]*\}$/, // Template literal with content
      /^\${[^}]*\}\s*\${/, // Multi-part template literals
      /^\${.*\}\s*$/, // Template literal ending

      // Meta tag patterns
      /^width=device-width/, // Viewport meta tags
      /^initial-scale=1/, // Initial scale meta tags
      /^charset=/, // Charset meta tags

      // Code comment patterns
      /^\/\*/, // JavaScript comments
      /^\/\*/, // Multi-line comments
      /^\s*\*\//, // Comment endings

      // Configuration and build patterns
      /eslint-disable/, // ESLint comments
      /typescript-eslint/, // TypeScript ESLint comments
      /@ts-expect-error/, // TypeScript expect error comments

      // Technical variable patterns
      /const\s+[a-zA-Z_]+/, // Variable declarations
      /let\s+[a-zA-Z_]+/, // Let variable declarations
      /var\s+[a-zA-Z_]+/, // Var variable declarations

      // String escaping patterns
      /\\n/, // Newline escapes
      /\\t/, // Tab escapes
      /\\\"/, // Quote escapes
      /\\'/, // Single quote escapes
      /\\\\/, // Backslash escapes

      // Database and API patterns
      /db\./, // Database access
      /query\./, // Query functions
      /mutation\./, // Mutation functions
      /router\./, // Router patterns
      /handler/, // Handler functions

      // React and JSX patterns
      /React\./, // React imports
      /useState/, // React hooks
      /useEffect/, // React hooks
      /import.*from/, // Import statements
    ];

    return technicalPatterns.some((pattern) => pattern.test(trimmed));
  }

  /**
   * Get context information for a node
   */
  getContext(node) {
    const parent = node.parent;
    if (!parent) return { type: "unknown" };

    try {
      if (ts.isJsxAttribute(parent) && parent.name) {
        return {
          type: "jsx_attribute",
          attribute: parent.name.text || "unknown",
          element: this.getParentElement(parent),
        };
      }

      if (
        parent.parent &&
        (ts.isJsxElement(parent.parent) || ts.isJsxFragment(parent.parent))
      ) {
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

      if (ts.isPropertyAssignment(parent) && parent.name) {
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

      if (ts.isCallExpression(parent)) {
        return {
          type: "call_argument",
          function: this.getExpressionText(parent.expression),
        };
      }
    } catch (error) {
      // Return safe default if context detection fails
      return { type: "unknown" };
    }

    return { type: "unknown" };
  }

  /**
   * Get parent element name for JSX nodes
   */
  getParentElement(node) {
    try {
      const parent = node.parent;
      if (!parent || typeof parent !== "object") return "unknown";

      if (ts.isJsxElement(parent) || ts.isJsxSelfClosingElement(parent)) {
        if (parent.openingElement && parent.openingElement.name) {
          return parent.openingElement.name.getText() || "unknown";
        }
      }
      return "unknown";
    } catch (error) {
      return "unknown";
    }
  }

  /**
   * Generate translation key from text and context
   */
  generateKey(text, context) {
    // Normalize text for key generation
    const normalizedText = text
      .replace(/\${[^}]+}/g, "") // Remove template variables
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim()
      .substring(0, 100); // Increased limit to prevent cutoff

    // Convert to key-friendly format
    let baseKey = normalizedText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_");

    // Avoid truncation mid-word - if we hit the limit, try to end at a word boundary
    if (normalizedText.length >= 100) {
      const lastUnderscore = baseKey.lastIndexOf("_");
      if (lastUnderscore > 50) {
        // Only shorten if we still have enough length
        baseKey = baseKey.substring(0, lastUnderscore);
      }
    }

    // Handle empty base key
    if (!baseKey) {
      baseKey = "dynamic_content";
    }

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
      case "jsx_text":
        if (context.element === "Button") {
          keyPrefix = "buttons";
        } else if (context.element === "Heading") {
          keyPrefix = "headings";
        } else {
          keyPrefix = "content";
        }
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
      case "call_argument":
        keyPrefix = "messages";
        break;
    }

    // Add a hash of the full text to avoid collisions for similar strings
    const textHash = this.simpleHash(text.substring(0, 50));
    const finalKey = baseKey.length > 20 ? `${baseKey}_${textHash}` : baseKey;

    return `${keyPrefix}.${finalKey}`;
  }

  /**
   * Simple hash function to generate short suffixes for key uniqueness
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 4); // 4-char alphanumeric
  }
}

export { ASTStringExtractor, StringExtraction, TemplateVariable };
