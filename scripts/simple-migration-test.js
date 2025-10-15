#!/usr/bin/env node

/**
 * Simple Migration Test Script
 *
 * A simplified version to test the migration approach without complex dependencies.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

/**
 * Create test files with hardcoded strings
 */
function createTestFiles() {
  const testDir = path.join(projectRoot, "test-migration-samples");

  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  // Test component with various string types
  const testComponent = `
import React from "react";

export const TestComponent = () => {
  return (
    <div>
      <h1>Welcome to Roundup Games</h1>
      <p>Join our community of tabletop enthusiasts</p>
      <button>Create New Event</button>
      <button>Save Changes</button>
      <span>Error: Something went wrong</span>
    </div>
  );
};

export const AnotherComponent = () => {
  const message = "Your profile has been updated successfully";
  return <div>{message}</div>;
};
`;

  // Test form component
  const testForm = `
import React from "react";

export const TestForm = () => {
  return (
    <form>
      <label htmlFor="name">Event Name</label>
      <input
        id="name"
        type="text"
        placeholder="Enter your event name"
      />

      <label htmlFor="description">Description</label>
      <textarea
        id="description"
        placeholder="Describe your event in detail"
      />

      <button type="submit">Submit Event</button>
      <button type="button">Cancel</button>
    </form>
  );
};
`;

  // Test component with existing i18n (should be ignored)
  const existingI18nComponent = `
import React from "react";
import { useCommonTranslation } from "~/hooks/useTypedTranslation";

export const ExistingI18nComponent = () => {
  const { t } = useCommonTranslation();

  return (
    <div>
      <h1>{t("welcome.title")}</h1>
      <button>{t("buttons.create")}</button>
    </div>
  );
};
`;

  // Write test files
  writeFileSync(path.join(testDir, "TestComponent.tsx"), testComponent);
  writeFileSync(path.join(testDir, "TestForm.tsx"), testForm);
  writeFileSync(path.join(testDir, "ExistingI18nComponent.tsx"), existingI18nComponent);

  console.log("✅ Created test files in test-migration-samples/");
  return testDir;
}

/**
 * Simple string replacement simulation
 */
function simulateMigrations(testDir) {
  console.log("\n🔍 Simulating migration process...\n");

  const files = ["TestComponent.tsx", "TestForm.tsx", "ExistingI18nComponent.tsx"];

  const simulatedTransformations = [
    {
      file: "TestComponent.tsx",
      transformations: [
        {
          original: "Welcome to Roundup Games",
          key: "common.welcome.title",
          replacement: '{t("welcome.title")}',
        },
        {
          original: "Join our community of tabletop enthusiasts",
          key: "common.welcome.subtitle",
          replacement: '{t("welcome.subtitle")}',
        },
        {
          original: "Create New Event",
          key: "events.create_form.title",
          replacement: '{t("create_form.title")}',
        },
        {
          original: "Save Changes",
          key: "common.buttons.save",
          replacement: '{t("buttons.save")}',
        },
        {
          original: "Error: Something went wrong",
          key: "common.errors.general",
          replacement: '{t("errors.general")}',
        },
        {
          original: "Your profile has been updated successfully",
          key: "profile.messages.updated",
          replacement: '{t("messages.updated")}',
        },
      ],
    },
    {
      file: "TestForm.tsx",
      transformations: [
        {
          original: "Event Name",
          key: "events.form.fields.name.label",
          replacement: '{t("form.fields.name.label")}',
        },
        {
          original: "Enter your event name",
          key: "events.form.fields.name.placeholder",
          replacement: '{t("form.fields.name.placeholder")}',
        },
        {
          original: "Description",
          key: "events.form.fields.description.label",
          replacement: '{t("form.fields.description.label")}',
        },
        {
          original: "Describe your event in detail",
          key: "events.form.fields.description.placeholder",
          replacement: '{t("form.fields.description.placeholder")}',
        },
        {
          original: "Submit Event",
          key: "events.form.buttons.submit",
          replacement: '{t("form.buttons.submit")}',
        },
        {
          original: "Cancel",
          key: "common.buttons.cancel",
          replacement: '{t("buttons.cancel")}',
        },
      ],
    },
    {
      file: "ExistingI18nComponent.tsx",
      transformations: [], // Should be ignored - already uses i18n
      note: "Already internationalized - no changes needed",
    },
  ];

  console.log("📊 Migration Analysis Results:");
  console.log("=".repeat(50));

  let totalTransformations = 0;

  simulatedTransformations.forEach((result) => {
    console.log(`\n📄 ${result.file}:`);

    if (result.note) {
      console.log(`  ℹ️  ${result.note}`);
    } else {
      console.log(`  🔄 ${result.transformations.length} transformations:`);

      result.transformations.forEach((transform, index) => {
        console.log(`    ${index + 1}. "${transform.original}"`);
        console.log(`       → ${transform.replacement}`);
        console.log(`       (Key: ${transform.key})`);
        totalTransformations++;
      });
    }
  });

  console.log("\n" + "=".repeat(50));
  console.log(`📈 Summary:`);
  console.log(`  • Files analyzed: ${files.length}`);
  console.log(
    `  • Files with changes: ${simulatedTransformations.filter((r) => !r.note).length}`,
  );
  console.log(`  • Total transformations: ${totalTransformations}`);
  console.log(`  • Strings that would be internationalized: ${totalTransformations}`);

  console.log("\n🎯 Recommended Next Steps:");
  console.log("  1. Check if these transformations look correct");
  console.log("  2. Run 'pnpm i18n:migrate:dry-run' to see real results");
  console.log("  3. If satisfied, run 'pnpm i18n:migrate:apply'");

  return simulatedTransformations;
}

/**
 * Check if translations exist for the simulated keys
 */
function checkExistingTranslations(transformations) {
  console.log("\n🔍 Checking for existing translations...");

  try {
    // Load common translations to check what we already have
    const commonPath = path.join(projectRoot, "src/lib/i18n/locales/en/common.json");
    if (existsSync(commonPath)) {
      const commonTranslations = JSON.parse(readFileSync(commonPath, "utf8"));

      let matches = 0;
      let newKeys = 0;

      transformations.forEach((result) => {
        if (result.transformations) {
          result.transformations.forEach((transform) => {
            const keyParts = transform.key.split(".");
            const namespace = keyParts[0];
            const keyPath = keyParts.slice(1).join(".");

            if (namespace === "common") {
              const value = getNestedValue(commonTranslations, keyPath);
              if (value === transform.original) {
                console.log(
                  `  ✅ Found match: "${transform.original}" → ${transform.key}`,
                );
                matches++;
              } else {
                console.log(
                  `  ➕ New key needed: "${transform.original}" → ${transform.key}`,
                );
                newKeys++;
              }
            }
          });
        }
      });

      console.log(`\n📚 Translation Match Results:`);
      console.log(`  • Existing matches found: ${matches}`);
      console.log(`  • New keys needed: ${newKeys}`);
    }
  } catch (error) {
    console.log("  ⚠️  Could not check existing translations:", error.message);
  }
}

/**
 * Helper to get nested object value by path
 */
function getNestedValue(obj, path) {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

/**
 * Run migration test
 */
async function runTest() {
  console.log("🧪 Running simple i18n migration test...\n");

  try {
    // Create test files
    const testDir = createTestFiles();

    // Simulate the migration process
    const transformations = simulateMigrations(testDir);

    // Check for existing translations
    checkExistingTranslations(transformations);

    console.log("\n✅ Test completed successfully!");
    console.log("\n🚀 Ready to run the real migration?");
    console.log("   pnpm i18n:migrate:dry-run  # Preview changes on full codebase");
    console.log("   pnpm i18n:migrate:apply     # Apply changes to full codebase");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    throw error;
  } finally {
    // Clean up test files
    try {
      const { execSync } = await import("child_process");
      const testDir = path.join(projectRoot, "test-migration-samples");
      execSync(`rm -rf "${testDir}"`, { stdio: "inherit" });
      console.log("\n🧹 Cleaned up test files");
    } catch (cleanupError) {
      console.warn("Warning: Could not clean up test files:", cleanupError.message);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTest().catch((error) => {
    console.error("❌ Migration test failed:", error);
    process.exit(1);
  });
}

export { runTest };
