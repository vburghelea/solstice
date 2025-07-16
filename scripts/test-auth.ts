import { auth } from "../src/lib/auth";
import { env, getAuthSecret, getBaseUrl } from "../src/lib/env.server";

async function testAuth() {
  console.log("Testing authentication setup...\n");

  // Test environment variables
  console.log("1. Environment variables:");
  console.log("   Base URL:", getBaseUrl());
  console.log("   Auth Secret:", getAuthSecret() ? "✅ Set" : "❌ Not set");
  console.log("   Google Client ID:", env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Not set");
  console.log(
    "   Google Client Secret:",
    env.GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ Not set",
  );

  // Test auth instance proxy
  try {
    console.log("\n2. Testing auth instance proxy...");
    // Access a property to trigger lazy initialization
    const authApi = auth.api;
    console.log("✅ Auth instance initialized successfully");
    console.log("   Auth API available:", typeof authApi === "object");
  } catch (error) {
    console.error("❌ Auth instance initialization failed:", error);
  }

  // Test auth configuration
  try {
    console.log("\n3. Testing auth configuration...");
    // Test if auth API has getSession method
    const hasGetSession = typeof auth.api?.getSession === "function";
    console.log("✅ Auth configuration loaded");
    console.log("   Session management available:", hasGetSession);
  } catch (error) {
    console.error("❌ Auth configuration failed:", error);
  }

  process.exit(0);
}

testAuth().catch(console.error);
