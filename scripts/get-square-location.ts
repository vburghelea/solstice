#!/usr/bin/env tsx
/**
 * Get valid Square Sandbox location ID
 */

import dotenv from "dotenv";
import type { Square } from "square";
import { SquareClient, SquareEnvironment, SquareError } from "square";

// Load environment variables
dotenv.config({ path: ".env" });

async function getLocations() {
  const accessToken = process.env["SQUARE_ACCESS_TOKEN"];

  if (!accessToken) {
    console.error("❌ SQUARE_ACCESS_TOKEN not found");
    process.exit(1);
  }

  const client = new SquareClient({
    token: accessToken,
    environment: SquareEnvironment.Sandbox,
  });

  try {
    // Try the same API call as in square-real.ts
    const testRequest: Square.checkout.CreatePaymentLinkRequest = {
      idempotencyKey: `test-${Date.now()}`,
      description: "Test",
      quickPay: {
        name: "Test Item",
        priceMoney: {
          amount: BigInt(100),
          currency: "CAD" as Square.Currency,
        },
        locationId: "test-location-id", // This will fail but show us the error
      },
    };

    console.log("Testing Square API with invalid location...");
    const result = await client.checkout.paymentLinks.create(testRequest);
    console.log("Result:", result);
  } catch (error: unknown) {
    if (error instanceof SquareError) {
      console.log("\n❌ Square API Error (expected):");
      for (const err of error.errors ?? []) {
        console.log(`  ${err.category}: ${err.code}`);
        console.log(`  ${err.detail}`);
        console.log(`  Field: ${err.field}`);
      }

      // Now try to get valid locations
      console.log("\n📍 Fetching valid locations...");
      try {
        const locationsApi = client.locations;
        const locations = await locationsApi.list();

        if (locations.locations && locations.locations.length > 0) {
          console.log(`\n✅ Found ${locations.locations.length} location(s):\n`);

          for (const location of locations.locations) {
            console.log(`Location ID: ${location.id}`);
            console.log(`Name: ${location.name}`);
            console.log(`Status: ${location.status}`);
            console.log(`---`);
          }

          console.log(`\n💡 Update your .env file with:`);
          console.log(`SQUARE_LOCATION_ID="${locations.locations[0].id}"`);
        }
      } catch (locError: unknown) {
        console.error("Failed to fetch locations:", locError);
      }
    } else {
      console.error("Unknown error:", error);
    }
  }
}

getLocations();
