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

  // Load English translations as reference
  const enTranslations = {};
  let hasErrors = false;

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

  if (hasErrors) {
    console.error("\n❌ Cannot sync translations due to missing English files!");
    process.exit(1);
  }

  // Sync other languages
  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang === "en") continue; // Skip English as it's the reference

    console.log(`📝 Syncing ${lang} translations...`);

    for (const ns of NAMESPACES) {
      const langPath = path.join(LOCALES_DIR, lang, `${ns}.json`);
      let translations = loadJsonFile(langPath) || {};

      const enKeys = getNestedKeys(enTranslations[ns]);
      const langKeys = getNestedKeys(translations);

      // Add missing keys with placeholder value
      let addedCount = 0;
      for (const key of enKeys) {
        if (!langKeys.includes(key)) {
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
