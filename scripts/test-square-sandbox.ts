#!/usr/bin/env tsx
/**
 * Test Square Sandbox API connection and get valid location ID
 */

import dotenv from "dotenv";
import { SquareClient, SquareEnvironment, SquareError } from "square";

// Load environment variables
dotenv.config({ path: ".env" });

async function testSquareConnection() {
  console.log("🔧 Testing Square Sandbox Connection...\n");

  const accessToken = process.env["SQUARE_ACCESS_TOKEN"];
  const environment = process.env["SQUARE_ENV"];

  if (!accessToken) {
    console.error("❌ SQUARE_ACCESS_TOKEN not found in .env");
    process.exit(1);
  }

  console.log(`Environment: ${environment}`);
  console.log(`Access Token: ${accessToken.substring(0, 20)}...`);
  console.log();

  const client = new SquareClient({
    token: accessToken,
    environment:
      environment === "production"
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
  });

  try {
    // Test 1: List locations
    console.log("📍 Fetching locations...");
    const locationsResponse = await client.locations.list();
    const locationList = locationsResponse.locations ?? [];

    if (locationList.length > 0) {
      console.log(`✅ Found ${locationList.length} location(s):\n`);

      locationList.forEach((location) => {
        console.log(`  Location ID: ${location.id}`);
        console.log(`  Name: ${location.name}`);
        console.log(`  Status: ${location.status}`);
        console.log(`  Currency: ${location.currency}`);
        console.log(`  Country: ${location.country}`);
        console.log(
          `  Address: ${location.address?.addressLine1}, ${location.address?.locality}`,
        );
        console.log("  ---");
      });

      // Set the first location as default
      const defaultLocation = locationList[0];
      console.log(`\n💡 To use this location, update your .env file:`);
      console.log(`   SQUARE_LOCATION_ID="${defaultLocation.id}"`);
    } else {
      console.log(
        "⚠️  No locations found. You may need to create one in Square Dashboard.",
      );
    }

    // Test 2: Check catalog API
    console.log("\n📦 Testing Catalog API...");
    const catalogResponse = await client.catalog.list({
      types: "ITEM",
    });

    console.log(
      `✅ Catalog API is accessible. Found ${catalogResponse.data.length} item(s).`,
    );

    // Test 3: Check payments API
    console.log("\n💳 Testing Payments API...");
    const paymentsResponse = await client.payments.list({
      limit: 1,
    });

    console.log(
      `✅ Payments API is accessible. Found ${paymentsResponse.data.length} payment(s).`,
    );

    console.log("\n✨ Square Sandbox connection successful!");
  } catch (error: unknown) {
    console.error("\n❌ Square API Error:");

    if (error instanceof SquareError) {
      for (const err of error.errors ?? []) {
        console.error(`  - ${err.category}: ${err.code}`);
        console.error(`    ${err.detail}`);
      }
    } else {
      console.error(error);
    }

    process.exit(1);
  }
}

testSquareConnection();
