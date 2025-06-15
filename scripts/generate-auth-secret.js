#!/usr/bin/env node

import crypto from "crypto";
import fs from "fs";
import path from "path";

// Check if BETTER_AUTH_SECRET already exists in any env file
const envFiles = [".env", ".env.local", ".env.development", ".env.production"];
let secretExists = false;

for (const file of envFiles) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    if (
      content.includes("BETTER_AUTH_SECRET=") &&
      !content.includes('BETTER_AUTH_SECRET=""')
    ) {
      secretExists = true;
      break;
    }
  }
}

if (!secretExists) {
  const secret = crypto.randomBytes(32).toString("hex");
  console.log("\n🔐 BetterAuth secret not found. Generating a new one...");
  console.log("\nAdd this to your .env.local file:");
  console.log(`\nBETTER_AUTH_SECRET="${secret}"\n`);
  console.log("⚠️  Keep this secret safe and never commit it to version control!\n");
} else {
  console.log("✅ BetterAuth secret already configured\n");
}
