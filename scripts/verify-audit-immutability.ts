import { sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "../src/db/connections";

const createAuditLogRow = async (db: Awaited<ReturnType<typeof getDb>>) => {
  const id = randomUUID();
  await db.execute(
    sql`
      INSERT INTO "audit_logs" ("id", "action", "action_category", "request_id", "entry_hash")
      VALUES (${id}, 'IMMUTABILITY_TEST', 'SECURITY', ${randomUUID()}, ${randomUUID()})
    `,
  );
  return id;
};

const expectBlocked = async (
  label: string,
  operation: () => Promise<void>,
): Promise<void> => {
  let blocked = false;
  try {
    await operation();
  } catch {
    blocked = true;
  }

  if (!blocked) {
    throw new Error(`${label} succeeded; audit log immutability is not enforced`);
  }

  console.log(`✅ ${label} blocked as expected`);
};

const runCheck = async () => {
  const db = await getDb();

  await db.execute(sql`BEGIN`);
  try {
    const id = await createAuditLogRow(db);
    await expectBlocked("UPDATE audit_logs", async () => {
      await db.execute(
        sql`UPDATE "audit_logs" SET "action" = 'IMMUTABILITY_TEST_UPDATE' WHERE "id" = ${id}`,
      );
    });
  } finally {
    await db.execute(sql`ROLLBACK`);
  }

  await db.execute(sql`BEGIN`);
  try {
    const id = await createAuditLogRow(db);
    await expectBlocked("DELETE audit_logs", async () => {
      await db.execute(sql`DELETE FROM "audit_logs" WHERE "id" = ${id}`);
    });
  } finally {
    await db.execute(sql`ROLLBACK`);
  }
};

runCheck()
  .then(() => {
    console.log("Audit log immutability verification complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Audit log immutability verification failed:", error);
    process.exit(1);
  });
