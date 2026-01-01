#!/usr/bin/env tsx
/**
 * Verify SIN security lockout behavior by triggering failed logins
 * and inspecting security events + account locks.
 */

import { setTimeout as delay } from "node:timers/promises";

const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const baseUrl = process.env["VITE_BASE_URL"] ?? "http://localhost:5173";
// Email must be provided to avoid accidentally locking out hardcoded accounts
const email = requireEnv("SIN_LOCKOUT_EMAIL");
// Wrong password can have a default since it's intentionally incorrect
const wrongPassword = process.env["SIN_LOCKOUT_PASSWORD"] ?? "wrongpassword123";
const attempts = Number(process.env["SIN_LOCKOUT_ATTEMPTS"] ?? "5");
const pauseMs = Number(process.env["SIN_LOCKOUT_PAUSE_MS"] ?? "300");
const unlockAfter = process.env["SIN_LOCKOUT_UNLOCK"] === "true";

async function attemptLogin(index: number) {
  const response = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: wrongPassword }),
  });

  console.log(`Attempt ${index + 1}/${attempts}: status ${response.status}`);
  await response.text().catch(() => "");
}

async function run() {
  console.log(`Triggering ${attempts} failed logins for ${email}...`);
  for (let i = 0; i < attempts; i += 1) {
    await attemptLogin(i);
    if (pauseMs > 0) {
      await delay(pauseMs);
    }
  }

  const { getDb } = await import("~/db/server-helpers");
  const { accountLocks, securityEvents, user } = await import("~/db/schema");
  const { and, count, desc, eq, gte, isNull } = await import("drizzle-orm");

  const db = await getDb();
  const [targetUser] = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.email, email.toLowerCase()))
    .limit(1);

  if (!targetUser) {
    throw new Error(`User not found for ${email}`);
  }

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const [failCount] = await db
    .select({ total: count() })
    .from(securityEvents)
    .where(
      and(
        eq(securityEvents.userId, targetUser.id),
        eq(securityEvents.eventType, "login_fail"),
        gte(securityEvents.createdAt, fifteenMinutesAgo),
      ),
    );

  const [lock] = await db
    .select()
    .from(accountLocks)
    .where(and(eq(accountLocks.userId, targetUser.id), isNull(accountLocks.unlockedAt)))
    .orderBy(desc(accountLocks.lockedAt))
    .limit(1);

  console.log("Login fail events (last 15m):", failCount?.total ?? 0);
  console.log("Active lock:", lock ?? "none");

  const recentEvents = await db
    .select({
      id: securityEvents.id,
      eventType: securityEvents.eventType,
      createdAt: securityEvents.createdAt,
    })
    .from(securityEvents)
    .where(eq(securityEvents.userId, targetUser.id))
    .orderBy(desc(securityEvents.createdAt))
    .limit(6);

  console.log("Recent security events:");
  recentEvents.forEach((event) => {
    console.log(`- ${event.eventType} @ ${event.createdAt.toISOString()}`);
  });

  if (unlockAfter && lock) {
    const { unlockAccount } = await import("~/lib/security/lockout");
    await unlockAccount({
      userId: targetUser.id,
      reason: "Post-verification unlock",
      unlockedBy: targetUser.id,
    });
    console.log("Lock cleared.");
  }
}

run().catch((error) => {
  console.error("Security lockout verification failed:", error);
  process.exit(1);
});
