#!/usr/bin/env node

import crypto from "crypto";
import fs from "fs";
import path from "path";

// Check if BETTER_AUTH_SECRET already exists in any env file or environment
const envFiles = [".env", ".env.local", ".env.development", ".env.production"];
let secretExists = false;

// First check if secret exists in environment variables (for CI)
if (process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_SECRET !== "") {
  secretExists = true;
}

// Check env files
if (!secretExists) {
  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      if (
        content.includes("BETTER_AUTH_SECRET=") &&
        !content.includes('BETTER_AUTH_SECRET=""') &&
        !content.includes("BETTER_AUTH_SECRET=dev-secret-change-in-production")
      ) {
        secretExists = true;
        break;
      }
    }
  }
}

if (!secretExists) {
  const secret = crypto.randomBytes(32).toString("hex");
  console.log("\n🔐 BetterAuth secret not found. Generating a new one...");

  // In CI environments, fail the build
  if (process.env.CI || process.env.NETLIFY || process.env.VERCEL_ENV) {
    console.error("\n❌ ERROR: BETTER_AUTH_SECRET must be set in CI environments!");
    console.error("Add BETTER_AUTH_SECRET to your environment variables.\n");
    process.exit(1);
  }

  // In local development, create or update .env file
  const envFilePath = path.join(process.cwd(), ".env");
  let envContent = "";

  if (fs.existsSync(envFilePath)) {
    envContent = fs.readFileSync(envFilePath, "utf-8");
  }

  // Add the secret to the env content
  if (!envContent.includes("BETTER_AUTH_SECRET=")) {
    envContent += `\n# Generated auth secret - DO NOT COMMIT\nBETTER_AUTH_SECRET="${secret}"\n`;
  } else {
    // Replace existing empty or default secret
    envContent = envContent.replace(
      /BETTER_AUTH_SECRET=(""|dev-secret-change-in-production)?/,
      `BETTER_AUTH_SECRET="${secret}"`,
    );
  }

  fs.writeFileSync(envFilePath, envContent);
  console.log(`\n✅ Generated and saved BETTER_AUTH_SECRET to .env`);
  console.log("⚠️  Keep this secret safe and never commit it to version control!\n");
} else {
  console.log("✅ BetterAuth secret already configured\n");
}
