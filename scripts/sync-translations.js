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

function saveJsonFile(filePath, data) {
  try {
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content + "\n", "utf8");
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error.message);
    return false;
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
  const keys = key.split(".");
  return keys.reduce((current, keyPart) => {
    return current && typeof current === "object" ? current[keyPart] : undefined;
  }, obj);
}

function setNestedValue(obj, key, value) {
  const keys = key.split(".");
  const lastKey = keys.pop();
  const target = keys.reduce((current, keyPart) => {
    if (!current[keyPart] || typeof current[keyPart] !== "object") {
      current[keyPart] = {};
    }
    return current[keyPart];
  }, obj);

  target[lastKey] = value;
}

async function syncTranslations() {
  console.log("🔄 Syncing translation files...\n");

  // Load default language translations as reference
  const referenceTranslations = {};
  let hasErrors = false;

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

  if (hasErrors) {
    console.error(
      `\n❌ Cannot sync translations due to missing ${DEFAULT_LANGUAGE} files!`,
    );
    process.exit(1);
  }

  // Sync other languages
  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang === DEFAULT_LANGUAGE) continue; // Skip default language as it's the reference

    console.log(`📝 Syncing ${lang} translations...`);

    for (const ns of NAMESPACES) {
      const langPath = path.join(LOCALES_DIR, lang, `${ns}.json`);
      let translations = loadJsonFile(langPath) || {};

      const referenceKeys = getNestedKeys(referenceTranslations[ns]);
      const langKeys = getNestedKeys(translations);

      // Add missing keys with placeholder value (only if key doesn't exist)
      let addedCount = 0;
      for (const key of referenceKeys) {
        const existingValue = getNestedValue(translations, key);
        if (existingValue === undefined) {
          setNestedValue(translations, key, `TODO: Translate "${key}"`);
          addedCount++;
        }
      }

      // Save updated translations
      if (addedCount > 0) {
        if (saveJsonFile(langPath, translations)) {
          console.log(`   ✅ Added ${addedCount} missing keys to ${ns}.json`);
        } else {
          console.error(`   ❌ Failed to save ${ns}.json`);
          hasErrors = true;
        }
      } else {
        console.log(`   ✅ ${ns}.json is already in sync`);
      }
    }
  }

  if (hasErrors) {
    console.error("\n❌ Translation sync failed!");
    process.exit(1);
  } else {
    console.log("\n✅ All translations synced successfully!");
    console.log(
      "💡 Don't forget to update the placeholder values with actual translations.",
    );
    process.exit(0);
  }
}

// Run sync
syncTranslations().catch((error) => {
  console.error("❌ Error running sync:", error);
  process.exit(1);
});
