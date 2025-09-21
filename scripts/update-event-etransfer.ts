import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";

// Load environment variables
config({ path: ".env" });

const sql = neon(process.env["DATABASE_URL"]!);
const db = drizzle(sql, { schema });

async function updateEventEtransfer() {
  console.log("🔍 Checking E2E Open Showcase event...");

  // Check current status
  const event = await db.query.events.findFirst({
    where: eq(schema.events.slug, "e2e-open-showcase"),
  });

  if (!event) {
    console.error("❌ Event 'e2e-open-showcase' not found!");
    process.exit(1);
  }

  console.log("Current e-transfer status:", {
    allowEtransfer: event.allowEtransfer,
    etransferRecipient: event.etransferRecipient,
    hasInstructions: !!event.etransferInstructions,
  });

  if (!event.allowEtransfer) {
    console.log("📝 Updating event to enable e-transfer...");

    await db
      .update(schema.events)
      .set({
        allowEtransfer: true,
        etransferRecipient: "payments@quadballcanada.com",
        etransferInstructions:
          "Please include the event name 'E2E Open Showcase' and your name in the e-transfer message. Security question: What sport? Answer: quadball",
      })
      .where(eq(schema.events.id, event.id));

    console.log("✅ Event updated successfully!");
  } else {
    console.log("✅ E-transfer is already enabled for this event");
  }

  process.exit(0);
}

updateEventEtransfer().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
