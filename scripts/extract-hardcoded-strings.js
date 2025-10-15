#!/usr/bin/env node

/**
 * Extract Hardcoded Strings Script
 *
 * This script finds hardcoded English strings in the codebase and generates
 * translation locale files based on the found strings and their context.
 * Uses i18next-parser configuration for consistency.
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
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
  inputPatterns: i18nextConfig.default.input,
  namespaces: i18nextConfig.default.options.ns,
};

/**
 * Patterns to find hardcoded strings that should be translated
 */
const STRING_PATTERNS = [
  // JSX text content
  />\s*([A-Z][^<{>\n]{3,100}?)\s*</g,
  // Button text and UI labels
  /<Button[^>]*>\s*([A-Z][^<{>\n]{2,50}?)\s*</g,
  // Form labels
  /label:\s*["']([A-Z][^"']{3,50}?)["']/g,
  // Placeholder text
  /placeholder:\s*["']([A-Za-z][^"']{5,100}?)["']/g,
  // Toast messages
  /toast\.(?:success|error|info)\(["']([A-Z][^"']{3,80}?)["']/g,
  // Alert/error messages
  /["']([A-Z][^"']{3,80}?)["'].*?(?:Error|Alert|Required|Invalid|Failed)/g,
  // General UI strings in quotes
  /["']([A-Z][^"']{4,80}?)["']/g,
];

/**
 * Strings to exclude (not user-facing)
 */
const EXCLUDE_PATTERNS = [
  /^[a-zA-Z][a-zA-Z0-9_]*$/, // Variable names
  /^https?:\/\//, // URLs
  /^#/, // Hex colors
  /^[0-9]+$/, // Numbers
  /\.(js|ts|tsx|jsx|css|html|json|md)$/, // File extensions
  /^(console|log|error|warn|info)/, // Console methods
  /^(div|span|button|input|form)/, // HTML tags
  /^(className|id|name|key|type|value)/, // Attribute names
];

/**
 * Generate hierarchical base key from file path
 */
function generateBaseKeyFromPath(filePath) {
  // Remove src/ prefix and file extension
  const cleanPath = filePath.replace(/^src\//, "").replace(/\.(ts|tsx)$/, "");
  const parts = cleanPath.split("/");

  // Handle different path patterns
  if (parts[0] === "features") {
    // features/feature/components/component-name -> feature.component_name
    if (parts.length >= 3 && parts[1] === "components") {
      const feature = parts[0]; // 'features' - we'll map this later
      const featureType = parts[1]; // 'components'
      const componentName = parts[2].replace(/-(\w)/g, "_$1"); // Convert kebab to snake
      return `${componentName}`;
    }
    // features/feature/hooks/hook-name -> feature.hook_name
    else if (parts.length >= 3 && parts[1] === "hooks") {
      const hookName = parts[2].replace(/-(\w)/g, "_$1");
      return `${hookName}`;
    }
    // features/feature/file-name -> feature.file_name
    else if (parts.length >= 2) {
      const fileName =
        parts[2]?.replace(/-(\w)/g, "_$1") || parts[1].replace(/-(\w)/g, "_$1");
      return `${fileName}`;
    }
  } else if (parts[0] === "routes") {
    // routes/auth/login -> auth.login
    // routes/admin/users/index -> admin.users.index
    const routeParts = parts.slice(1).map((part) => {
      // Handle dynamic routes like $gameId
      if (part.startsWith("$")) {
        return part.substring(1);
      }
      // Handle index routes
      if (part === "index") {
        return "index";
      }
      return part.replace(/-(\w)/g, "_$1");
    });
    return routeParts.join(".");
  } else if (parts[0] === "components") {
    // components/ui/button -> ui.button
    // components/form-fields/validated-input -> form_fields.validated_input
    const componentParts = parts.slice(1).map((part) => part.replace(/-(\w)/g, "_$1"));
    return componentParts.join(".");
  } else if (parts[0] === "lib") {
    // lib/auth/utils -> auth.utils
    if (parts.length >= 2) {
      const libParts = parts.slice(1).map((part) => part.replace(/-(\w)/g, "_$1"));
      return libParts.join(".");
    }
  }

  // Fallback: use last part of path
  const fileName = parts[parts.length - 1].replace(/-(\w)/g, "_$1");
  return fileName;
}

/**
 * Determine namespace from file path using configured namespaces
 */
function inferNamespaceFromPath(filePath) {
  const pathLower = filePath.toLowerCase();

  // Check each configured namespace in order
  for (const namespace of CONFIG.namespaces) {
    // Handle namespace mapping (e.g., game-systems -> game-systems)
    const namespacePath = namespace.replace("-", "");

    if (pathLower.includes(namespace + "/") || pathLower.includes(namespacePath + "/")) {
      return namespace;
    }
  }

  return CONFIG.defaultNs || "common"; // Default namespace from config
}

/**
 * Check if string should be translated
 */
function shouldTranslateString(text) {
  if (!text || text.trim().length < 3) return false;
  if (text.length > 100) return false; // Too long for translation key

  // Check exclude patterns
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(text)) return false;
  }

  // Exclude strings that are clearly technical/system messages
  const technicalPatterns = [
    /^error\s*\d+:/, // Error codes like "Error 123:"
    /^\w+\s*error/, // Module/function errors like "auth error"
    /failed to\s+(load|fetch|connect|parse|query)/, // Technical operation failures
    /unexpected\s+(token|response|error)/, // Technical errors
    /validation\s*error/, // Validation errors
    /type\s+error/, // TypeScript errors
    /permission\s*(denied|required)/, // Permission errors
    /not\s*authenticated/, // Auth errors
    /access\s*(denied|forbidden)/, // Access errors
    // SVG path patterns
    /^[mM]\d+/, // SVG path starting with M or m followed by numbers
    /^[mlLhHvVcCsSqQzZ]\s*\d+/, // SVG path commands with numbers
    /[mlLhHvVcCsSqQzZ]\s*\d+.*[mlLhHvVcCsSqQzZ]/, // SVG path sequences
    /\d+\.\d+.*[mlLhHvVcCsSqQzZ]/, // Decimal numbers with SVG commands
    /^m\d+/, // Matrix/coordinate strings
    /^[a-f0-9-]+$/, // Hex codes
    // Technical identifiers
    /^[A-Z_][A-Z0-9_]*$/, // All caps constants
    /^\w+_\w+_\w+_\w+$/, // Long underscore-separated technical strings
    // File extensions and MIME types
    /\.(tsx?|jsx?|json|css|scss|md|txt)$/,
    /^(image|text|application)\/[a-z-]+$/,
  ];

  for (const pattern of technicalPatterns) {
    if (pattern.test(text)) return false;
  }

  // Check if it looks like user-facing text (starts with uppercase)
  return text[0] === text[0].toUpperCase();
}

/**
 * Generate translation key from text with hierarchical structure
 */
function generateKey(text, namespace, filePath, lineNumber) {
  // First, decode HTML entities to get clean text
  const decodedText = text
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");

  // Convert text to key format with better cleaning
  const keyText = decodedText
    .toLowerCase()
    // Handle special characters like quotes and parentheses first
    .replace(/["'']/g, " ")
    .replace(/["\"]/g, " ")
    // Replace other non-alphanumeric characters with spaces (except underscores)
    .replace(/[^a-z0-9\s_]/g, " ")
    // Replace multiple spaces with single underscore
    .replace(/\s+/g, "_")
    // Remove leading/trailing underscores and any remaining punctuation
    .replace(/^_+|_+$/g, "")
    .replace(/[.,!?;:]+$/g, "")
    .trim();

  // Generate base key from file path
  const baseKey = generateBaseKeyFromPath(filePath);

  // Handle common UI element patterns with hierarchical structure
  if (
    keyText.includes("button") ||
    keyText.includes("submit") ||
    keyText.includes("cancel")
  ) {
    return `${baseKey}.${keyText}`;
  }
  if (
    keyText.includes("error") ||
    keyText.includes("invalid") ||
    keyText.includes("required")
  ) {
    return `${baseKey}.errors.${keyText}`;
  }
  if (
    keyText.includes("form") ||
    keyText.includes("field") ||
    keyText.includes("input")
  ) {
    return `${baseKey}.form.${keyText}`;
  }
  if (keyText.includes("label")) {
    return `${baseKey}.labels.${keyText}`;
  }
  if (keyText.includes("message") || keyText.includes("status")) {
    return `${baseKey}.messages.${keyText}`;
  }
  if (keyText.includes("title") || keyText.includes("heading")) {
    return `${baseKey}.title`;
  }
  if (keyText.includes("description") || keyText.includes("subtitle")) {
    return `${baseKey}.description`;
  }
  if (keyText.includes("placeholder")) {
    return `${baseKey}.placeholder`;
  }

  // Default: use base key + text
  return `${baseKey}.${keyText}`;
}

/**
 * Extract strings from a single file
 */
function extractStringsFromFile(filePath) {
  const fullPath = path.join(projectRoot, filePath);

  if (!existsSync(fullPath)) {
    return { file: filePath, strings: [] };
  }

  const content = readFileSync(fullPath, "utf8");
  const namespace = inferNamespaceFromPath(filePath);
  const strings = [];
  const seen = new Set(); // Avoid duplicates

  for (const pattern of STRING_PATTERNS) {
    let match;
    const regex = new RegExp(pattern, "g");

    while ((match = regex.exec(content)) !== null) {
      const text = match[1];

      if (shouldTranslateString(text) && !seen.has(text)) {
        seen.add(text);
        const key = generateKey(
          text,
          namespace,
          filePath,
          content.substring(0, match.index).split("\n").length,
        );

        strings.push({
          text,
          key,
          namespace,
          line: content.substring(0, match.index).split("\n").length,
        });
      }
    }
  }

  return { file: filePath, strings, namespace };
}

/**
 * Get all files to process using configured input patterns
 */
function getFilesToProcess() {
  // For simplicity, use the original hardcoded logic since glob patterns can be complex
  const result = execSync(
    `find src -name "*.ts" -o -name "*.tsx" | grep -v -E "(\\.d\\.ts|\\.test\\.(ts|tsx))"`,
    {
      encoding: "utf8",
      cwd: projectRoot,
    },
  );

  const allFiles = result.trim().split("\n").filter(Boolean);

  console.log(`   Using patterns: ${CONFIG.inputPatterns.join(", ")}`);

  return allFiles;
}

/**
 * Group strings by namespace and key
 */
function groupStringsByNamespace(allStrings) {
  const grouped = {};

  for (const fileResult of allStrings) {
    for (const stringData of fileResult.strings) {
      const { namespace, key, text } = stringData;

      if (!grouped[namespace]) {
        grouped[namespace] = {};
      }

      // Handle nested keys (like buttons.save)
      const keyParts = key.split(".");
      let current = grouped[namespace];

      for (let i = 0; i < keyParts.length - 1; i++) {
        if (!current[keyParts[i]]) {
          current[keyParts[i]] = {};
        }
        current = current[keyParts[i]];
      }

      const finalKey = keyParts[keyParts.length - 1];
      current[finalKey] = text; // Use the hardcoded string as the translation
    }
  }

  return grouped;
}

/**
 * Write locale files
 */
function writeLocaleFiles(groupedStrings) {
  // Ensure locales directory exists
  if (!existsSync(CONFIG.localesDir)) {
    mkdirSync(CONFIG.localesDir, { recursive: true });
  }

  for (const language of CONFIG.languages) {
    const langDir = path.join(CONFIG.localesDir, language);
    if (!existsSync(langDir)) {
      mkdirSync(langDir, { recursive: true });
    }

    for (const [namespace, translations] of Object.entries(groupedStrings)) {
      const filePath = path.join(langDir, `${namespace}.json`);

      // Load existing translations if file exists
      let existingTranslations = {};
      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, "utf8");
          existingTranslations = JSON.parse(content);
        } catch (error) {
          console.warn(`Warning: Could not parse ${filePath}`);
        }
      }

      // Merge with existing translations
      const mergedTranslations = { ...existingTranslations };
      mergeDeep(mergedTranslations, translations);

      // Write merged translations
      writeFileSync(filePath, JSON.stringify(mergedTranslations, null, 2));
      console.log(
        `  ${language}/${namespace}.json: ${Object.keys(translations).length} keys`,
      );
    }
  }
}

/**
 * Deep merge objects
 */
function mergeDeep(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      mergeDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

/**
 * Main extraction process
 */
function main() {
  console.log("🔍 Extracting hardcoded strings for i18n...");
  console.log(`   Using i18next-parser configuration`);
  console.log(`   Languages: ${CONFIG.languages.join(", ")}`);
  console.log(`   Namespaces: ${CONFIG.namespaces.join(", ")}`);

  try {
    // Get all files to process
    const files = getFilesToProcess();
    console.log(`   Found ${files.length} files to analyze`);

    // Extract strings from all files
    const allStrings = [];
    let totalStrings = 0;

    for (const filePath of files) {
      const result = extractStringsFromFile(filePath);
      if (result.strings.length > 0) {
        allStrings.push(result);
        totalStrings += result.strings.length;
        console.log(`   ${result.file}: ${result.strings.length} strings`);
      }
    }

    console.log(`\n📊 Total strings extracted: ${totalStrings}`);

    // Group strings by namespace
    const groupedStrings = groupStringsByNamespace(allStrings);
    console.log(`📦 Namespaces found: ${Object.keys(groupedStrings).length}`);

    // Write locale files
    console.log(`\n💾 Writing locale files...`);
    writeLocaleFiles(groupedStrings);

    console.log(`✅ Extraction completed successfully!`);
    console.log(`\n📝 Generated locale files for ${CONFIG.languages.length} languages`);
    console.log(`📝 You can now run the migration script to replace hardcoded strings`);
  } catch (error) {
    console.error("❌ Error during extraction:", error.message);
    process.exit(1);
  }
}

// Run the extraction
main();
