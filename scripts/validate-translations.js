#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import centralized configuration
import config from "./lib/i18n-config.js";

const LOCALES_DIR = config.localesDir;
const SUPPORTED_LANGUAGES = config.languages;
const NAMESPACES = config.namespaces;
const DEFAULT_LANGUAGE = config.defaultLanguage;

function loadJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

async function validateTranslations() {
  console.log("🔍 Validating translation files...\n");

  let hasErrors = false;
  const referenceTranslations = {};

  // Load default language translations as reference
  for (const ns of NAMESPACES) {
    const defaultLangPath = path.join(LOCALES_DIR, DEFAULT_LANGUAGE, `${ns}.json`);
    const translations = loadJsonFile(defaultLangPath);

    if (!translations) {
      console.error(
        `❌ Failed to load ${DEFAULT_LANGUAGE} translations for namespace: ${ns}`,
      );
      hasErrors = true;
      continue;
    }

    referenceTranslations[ns] = translations;
  }

  // Validate other languages
  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang === DEFAULT_LANGUAGE) continue; // Skip default language as it's the reference

    console.log(`📝 Validating ${lang} translations...`);

    for (const ns of NAMESPACES) {
      const langPath = path.join(LOCALES_DIR, lang, `${ns}.json`);
      const translations = loadJsonFile(langPath);

      if (!translations) {
        console.error(`❌ Failed to load ${lang} translations for namespace: ${ns}`);
        hasErrors = true;
        continue;
      }

      const referenceKeys = getNestedKeys(referenceTranslations[ns]);
      const langKeys = getNestedKeys(translations);

      // Check for missing keys
      const missingKeys = referenceKeys.filter((key) => !langKeys.includes(key));
      if (missingKeys.length > 0) {
        console.error(`❌ Missing keys in ${lang}/${ns}.json:`);
        missingKeys.forEach((key) => console.error(`   - ${key}`));
        hasErrors = true;
      }

      // Check for extra keys (not in reference language)
      const extraKeys = langKeys.filter((key) => !referenceKeys.includes(key));
      if (extraKeys.length > 0) {
        console.warn(
          `⚠️  Extra keys in ${lang}/${ns}.json (not in ${DEFAULT_LANGUAGE}):`,
        );
        extraKeys.forEach((key) => console.warn(`   - ${key}`));
      }

      // Check for empty values
      const emptyKeys = langKeys.filter((key) => {
        const value = getNestedValue(translations, key);
        return !value || value === "" || value === "__MISSING__";
      });

      if (emptyKeys.length > 0) {
        console.error(`❌ Empty or missing values in ${lang}/${ns}.json:`);
        emptyKeys.forEach((key) => console.error(`   - ${key}`));
        hasErrors = true;
      }
    }
  }

  if (hasErrors) {
    console.error("\n❌ Translation validation failed!");
    process.exit(1);
  } else {
    console.log("\n✅ All translations are valid!");
    process.exit(0);
  }
}

function getNestedKeys(obj, prefix = "") {
  let keys = [];

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getNestedKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

function getNestedValue(obj, key) {
  return key.split(".").reduce((current, keyPart) => {
    return current && current[keyPart];
  }, obj);
}

// Run validation
validateTranslations().catch((error) => {
  console.error("❌ Error running validation:", error);
  process.exit(1);
});
