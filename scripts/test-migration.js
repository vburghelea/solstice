#!/usr/bin/env node

/**
 * Test Migration Script
 *
 * This script tests the i18n migration on a small subset of files
 * to validate the approach before running on the full codebase.
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Import the migration class
import { I18nMigration } from "./auto-migrate-i18n.js";

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
 * Run migration test
 */
async function runTest() {
  console.log("🧪 Running i18n migration test...\n");

  // Create test files
  const testDir = createTestFiles();

  try {
    // Run migration on test directory only
    const migration = new I18nMigration({
      dryRun: true,
      verbose: true,
      includePatterns: [`${testDir}/**/*.{ts,tsx}`],
      backup: false,
    });

    await migration.run();

    console.log("\n📋 Test completed! Review the output above.");
    console.log("If the results look good, run:");
    console.log("  pnpm i18n:migrate:dry-run  # Preview changes on full codebase");
    console.log("  pnpm i18n:migrate:apply     # Apply changes to full codebase");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    throw error;
  } finally {
    // Clean up test files
    try {
      const { execSync } = await import("child_process");
      execSync(`rm -rf "${testDir}"`, { stdio: "inherit" });
      console.log("🧹 Cleaned up test files");
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
