import { eq } from "drizzle-orm";
import { db } from "~/db";
import { roles } from "~/db/schema";

async function seedRoles() {
  console.log("🌱 Starting role seeding...");

  try {
    // Define default roles
    const defaultRoles = [
      {
        name: "Solstice Admin",
        description: "Platform administrator with full system access",
        permissions: { "*": true },
      },
      {
        name: "Quadball Canada Admin",
        description: "Quadball Canada organization administrator",
        permissions: { "quadball_canada.*": true },
      },
      {
        name: "Team Admin",
        description: "Team-specific administrator",
        permissions: { "team.*": true },
      },
      {
        name: "Event Admin",
        description: "Event-specific administrator",
        permissions: { "event.*": true },
      },
    ];

    // Insert roles
    for (const role of defaultRoles) {
      // Check if role already exists
      const existing = await db()
        .select()
        .from(roles)
        .where(eq(roles.name, role.name))
        .limit(1);

      if (existing.length === 0) {
        await db().insert(roles).values(role);
        console.log(`✅ Created role: ${role.name}`);
      } else {
        console.log(`⏭️  Role already exists: ${role.name}`);
      }
    }

    console.log("\n🎉 Role seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding roles:", error);
    process.exit(1);
  }
}

// Run the seed function
seedRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
