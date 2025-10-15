#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import i18next-parser config to get namespaces dynamically
const i18nConfig = await import("../i18next-parser.config.js");

const LOCALES_DIR = path.join(__dirname, "../src/lib/i18n/locales");
const SUPPORTED_LANGUAGES = i18nConfig.default.options.lngs;
const NAMESPACES = i18nConfig.default.options.ns;

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
  const enTranslations = {};

  // Load English translations as reference
  for (const ns of NAMESPACES) {
    const enPath = path.join(LOCALES_DIR, "en", `${ns}.json`);
    const translations = loadJsonFile(enPath);

    if (!translations) {
      console.error(`❌ Failed to load English translations for namespace: ${ns}`);
      hasErrors = true;
      continue;
    }

    enTranslations[ns] = translations;
  }

  // Validate other languages
  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang === "en") continue; // Skip English as it's the reference

    console.log(`📝 Validating ${lang} translations...`);

    for (const ns of NAMESPACES) {
      const langPath = path.join(LOCALES_DIR, lang, `${ns}.json`);
      const translations = loadJsonFile(langPath);

      if (!translations) {
        console.error(`❌ Failed to load ${lang} translations for namespace: ${ns}`);
        hasErrors = true;
        continue;
      }

      const enKeys = getNestedKeys(enTranslations[ns]);
      const langKeys = getNestedKeys(translations);

      // Check for missing keys
      const missingKeys = enKeys.filter((key) => !langKeys.includes(key));
      if (missingKeys.length > 0) {
        console.error(`❌ Missing keys in ${lang}/${ns}.json:`);
        missingKeys.forEach((key) => console.error(`   - ${key}`));
        hasErrors = true;
      }

      // Check for extra keys (not in English)
      const extraKeys = langKeys.filter((key) => !enKeys.includes(key));
      if (extraKeys.length > 0) {
        console.warn(`⚠️  Extra keys in ${lang}/${ns}.json (not in English):`);
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
