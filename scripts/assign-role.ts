import { eq } from "drizzle-orm";
import { db } from "~/db";
import { roles, user, userRoles } from "~/db/schema";

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error(
    "Usage: pnpm tsx scripts/assign-role.ts <userEmail> <roleName> <assignedByEmail> [teamId] [eventId]",
  );
  console.error(
    "Example: pnpm tsx scripts/assign-role.ts admin@example.com 'Solstice Admin' admin@example.com",
  );
  process.exit(1);
}

const [userEmail, roleName, assignedByEmail, teamId, eventId] = args;

async function assignRole() {
  console.log(`🔐 Assigning role "${roleName}" to user "${userEmail}"...`);

  try {
    // Find the user
    const [targetUser] = await db()
      .select()
      .from(user)
      .where(eq(user.email, userEmail))
      .limit(1);

    if (!targetUser) {
      console.error(`❌ User not found: ${userEmail}`);
      process.exit(1);
    }

    // Find the assigner
    const [assigningUser] = await db()
      .select()
      .from(user)
      .where(eq(user.email, assignedByEmail))
      .limit(1);

    if (!assigningUser) {
      console.error(`❌ Assigning user not found: ${assignedByEmail}`);
      process.exit(1);
    }

    // Find the role
    const [role] = await db()
      .select()
      .from(roles)
      .where(eq(roles.name, roleName))
      .limit(1);

    if (!role) {
      console.error(`❌ Role not found: ${roleName}`);
      console.error(
        "Available roles: Solstice Admin, Quadball Canada Admin, Team Admin, Event Admin",
      );
      process.exit(1);
    }

    // Check if user already has this role with the same scope
    const existingAssignment = await db()
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, targetUser.id))
      .limit(1);

    const hasSameRole = existingAssignment.some(
      (assignment) =>
        assignment.roleId === role.id &&
        assignment.teamId === (teamId || null) &&
        assignment.eventId === (eventId || null),
    );

    if (hasSameRole) {
      console.log(`⏭️  User already has this role with the same scope`);
      process.exit(0);
    }

    // Validate scope requirements
    if (roleName === "Team Admin" && !teamId) {
      console.error("❌ Team Admin role requires a teamId");
      process.exit(1);
    }

    if (roleName === "Event Admin" && !eventId) {
      console.error("❌ Event Admin role requires an eventId");
      process.exit(1);
    }

    if (
      (roleName === "Solstice Admin" || roleName === "Quadball Canada Admin") &&
      (teamId || eventId)
    ) {
      console.error("❌ Global admin roles cannot have team or event scope");
      process.exit(1);
    }

    // Assign the role
    await db()
      .insert(userRoles)
      .values({
        userId: targetUser.id,
        roleId: role.id,
        teamId: teamId || null,
        eventId: eventId || null,
        assignedBy: assigningUser.id,
      });

    console.log(`✅ Successfully assigned ${roleName} to ${userEmail}`);
    if (teamId) console.log(`   Team scope: ${teamId}`);
    if (eventId) console.log(`   Event scope: ${eventId}`);
  } catch (error) {
    console.error("❌ Error assigning role:", error);
    process.exit(1);
  }
}

// Run the function
assignRole()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
