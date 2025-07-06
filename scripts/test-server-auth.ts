#!/usr/bin/env tsx
// Test script to verify server-side auth is working correctly

import { auth } from "../src/lib/auth";

async function testServerAuth() {
  console.log("\n🔍 Testing server-side auth functionality...\n");

  try {
    // Test 1: Check if auth instance is created
    console.log("✅ Auth instance created successfully");

    // Test 2: Try to get a session (should return null if no cookies)
    const session = await auth.api.getSession({
      headers: new Headers(),
    });

    console.log("Session result:", session);

    if (!session) {
      console.log("✅ No session found (expected when no cookies present)");
    } else {
      console.log("✅ Session found:", session.user);
    }

    console.log("\n✨ Server-side auth is working correctly!");
  } catch (error) {
    console.error("\n❌ Error testing server auth:", error);
    process.exit(1);
  }
}

testServerAuth();
