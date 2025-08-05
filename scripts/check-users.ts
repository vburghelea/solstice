import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getDb } from "../src/db/connections";
import { account, user } from "../src/db/schema";

type User = InferSelectModel<typeof user>;
type Account = InferSelectModel<typeof account>;

async function checkUsers() {
  console.log("Checking users in database...\n");

  try {
    const db = await getDb();

    // Get all users
    const users = await db.select().from(user);
    console.log(`Found ${users.length} users:`);

    // Show credential users separately
    const credentialAccounts = await db
      .select()
      .from(account)
      .where(sql`${account.providerId} = 'credential'`);
    const credentialUserIds = credentialAccounts.map((a: Account) => a.userId);

    console.log("\nCredential (email/password) users:");
    users
      .filter((u: User) => credentialUserIds.includes(u.id))
      .forEach((u: User) => {
        console.log(`- ${u.name || "No name"} (${u.email}) - ID: ${u.id}`);
        console.log(`  Created: ${u.createdAt}`);
        console.log(`  Email verified: ${u.emailVerified ? "Yes" : "No"}`);
      });

    console.log("\nOAuth users:");
    users
      .filter((u: User) => !credentialUserIds.includes(u.id))
      .forEach((u: User) => {
        console.log(`- ${u.name || "No name"} (${u.email}) - ID: ${u.id}`);
        console.log(`  Created: ${u.createdAt}`);
        console.log(`  Email verified: ${u.emailVerified ? "Yes" : "No"}`);
      });

    // Get all accounts (OAuth connections)
    console.log("\nChecking OAuth accounts:");
    const accounts = await db.select().from(account);
    console.log(`Found ${accounts.length} OAuth accounts:`);
    accounts.forEach((a: Account) => {
      console.log(`- Provider: ${a.providerId} - User ID: ${a.userId}`);
      console.log(`  Account ID: ${a.accountId}`);
      console.log(`  Has access token: ${a.accessToken ? "Yes" : "No"}`);
    });

    // Check for recent activity
    console.log("\nChecking recent user activity (last 24 hours):");
    const recentUsers = await db
      .select()
      .from(user)
      .where(sql`${user.createdAt} > NOW() - INTERVAL '24 hours'`);
    console.log(`${recentUsers.length} users created in the last 24 hours`);
  } catch (error) {
    console.error("Error checking users:", error);
  }

  process.exit(0);
}

checkUsers().catch(console.error);
