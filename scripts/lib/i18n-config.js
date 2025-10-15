/**
 * I18n Configuration Utility
 *
 * Centralized configuration loader that reads from i18next-parser.config.js
 * to ensure all scripts use the same configuration source of truth.
 */

import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");

/**
 * Load configuration from i18next-parser.config.js
 */
function loadParserConfig() {
  const configPath = path.join(projectRoot, "i18next-parser.config.js");

  if (!existsSync(configPath)) {
    throw new Error(`i18next-parser.config.js not found at ${configPath}`);
  }

  try {
    // Convert ES module export to CommonJS require by reading the file
    const configContent = readFileSync(configPath, "utf8");

    // Simple extraction of the export default object
    const match = configContent.match(/export default\s+({[\s\S]*})\s*;?\s*$/m);
    if (!match) {
      throw new Error("Could not parse i18next-parser.config.js");
    }

    // Use eval to parse the exported object (safe since we control the file)
    const config = eval(`(${match[1]})`);

    return config;
  } catch (error) {
    throw new Error(`Failed to load i18next-parser config: ${error.message}`);
  }
}

/**
 * Extract configuration values from parser config
 */
function getI18nConfig() {
  const parserConfig = loadParserConfig();
  const options = parserConfig.options || {};

  return {
    // File paths
    projectRoot,
    localesDir: path.resolve(
      projectRoot,
      options.resource?.loadPath
        ?.replace("{{lng}}", "")
        .replace("{{ns}}", "")
        .replace(/\/[^\/]*$/, "") || "src/lib/i18n/locales",
    ),
    tempLocalesDir: path.resolve(
      projectRoot,
      options.resource?.savePath
        ?.replace("{{lng}}", "")
        .replace("{{ns}}", "")
        .replace(/\/[^\/]*$/, "") || "temp-locales",
    ),

    // Languages and namespaces
    languages: options.lngs || ["en", "de", "pl"],
    defaultLanguage: options.defaultLng || "en",
    namespaces: options.ns || [],
    defaultNamespace: options.defaultNs || "common",

    // Input patterns for file discovery
    inputPatterns: parserConfig.input || ["src/**/*.{ts,tsx}"],

    // Function list (translation hooks)
    translationFunctions: options.func?.list || ["t", "i18next.t"],

    // File extensions to process
    fileExtensions: options.func?.extensions || [".ts", ".tsx"],

    // Formatting options
    jsonIndent: options.jsonIndent || options.resource?.jsonIndent || 2,
    lineEnding: options.lineEnding || options.resource?.lineEnding || "\n",

    // Parser options
    keepRemoved: options.keepRemoved !== false,
    debug: options.debug || false,
    sort: options.sort || false,

    // Original parser config for reference
    parserConfig,
  };
}

/**
 * Get namespace to hook mapping based on configuration
 */
function getNamespaceHookMapping() {
  const config = getI18nConfig();
  const mapping = {};

  // Build mapping from configured function list
  config.translationFunctions.forEach((funcName) => {
    if (funcName.startsWith("use") && funcName.endsWith("Translation")) {
      // Extract namespace from hook name (e.g., "useAuthTranslation" -> "auth")
      const namespace = funcName
        .replace("use", "")
        .replace("Translation", "")
        .toLowerCase();

      mapping[namespace] = funcName;
    }
  });

  // Add common mappings that might not be in the function list
  const commonMappings = {
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
    collaboration: "useCollaborationTranslation",
    consent: "useConsentTranslation",
    "game-systems": "useGameSystemsTranslation",
    gm: "useGmTranslation",
    inbox: "useInboxTranslation",
    members: "useMembersTranslation",
    ops: "useOpsTranslation",
    reviews: "useReviewsTranslation",
    roles: "useRolesTranslation",
    social: "useSocialTranslation",
  };

  // Merge configurations, giving priority to configured functions
  return { ...commonMappings, ...mapping };
}

/**
 * Infer namespace from file path using configured patterns
 */
function inferNamespaceFromPath(filePath) {
  const config = getI18nConfig();
  const normalizedPath = filePath.replace(/\\/g, "/");

  // Check for feature-based organization
  const featureMatch = normalizedPath.match(/\/features\/([^\/]+)/);
  if (featureMatch) {
    const feature = featureMatch[1];

    // Map feature names to namespaces
    const featureToNamespace = {
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
      "game-systems": "game-systems",
      gm: "gm",
      inbox: "inbox",
      collaboration: "collaboration",
      consent: "consent",
      members: "members",
      ops: "ops",
      reviews: "reviews",
      roles: "roles",
      social: "social",
    };

    const namespace = featureToNamespace[feature];
    if (namespace && config.namespaces.includes(namespace)) {
      return namespace;
    }
  }

  // Fallback to path-based detection
  for (const namespace of config.namespaces) {
    if (
      normalizedPath.includes(`/${namespace}/`) ||
      normalizedPath.includes(`-${namespace}`)
    ) {
      return namespace;
    }
  }

  // Default namespace
  return config.defaultNamespace;
}

/**
 * Get files to process based on input patterns
 */
async function getFilesToProcess() {
  const config = getI18nConfig();

  try {
    const { execSync } = await import("child_process");

    // Use the exact same patterns as i18next-parser
    const result = execSync(
      `find src -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v "\\(-test\\.\\|-spec\\.\\)\\.tsx\\?$" | grep -v "\\.d\\.ts$" | grep -v "\\.stories\\." | grep -v "i18n/"`,
      {
        encoding: "utf8",
        cwd: config.projectRoot,
      },
    );

    return result
      .trim()
      .split("\n")
      .filter(Boolean)
      .filter((file) => {
        // Additional filtering based on configuration
        return (
          !file.includes("routeTree.gen.ts") &&
          !file.includes("generated-types.ts") &&
          !file.includes("i18n/locales/")
        );
      });
  } catch (error) {
    console.warn(
      "Could not find files using find command, falling back to basic patterns:",
      error.message,
    );
    return [];
  }
}

/**
 * Validate that a namespace is configured
 */
function isValidNamespace(namespace) {
  const config = getI18nConfig();
  return config.namespaces.includes(namespace);
}

/**
 * Get all translation files for a language
 */
function getTranslationFiles(language = null) {
  const config = getI18nConfig();
  const languages = language ? [language] : config.languages;
  const files = {};

  languages.forEach((lang) => {
    files[lang] = {};

    config.namespaces.forEach((ns) => {
      const filePath = path.join(config.localesDir, lang, `${ns}.json`);
      files[lang][ns] = filePath;
    });
  });

  return files;
}

// Export the configuration
const config = getI18nConfig();
export default config;

export {
  getFilesToProcess,
  getI18nConfig,
  getNamespaceHookMapping,
  getTranslationFiles,
  inferNamespaceFromPath,
  isValidNamespace,
  loadParserConfig,
};
