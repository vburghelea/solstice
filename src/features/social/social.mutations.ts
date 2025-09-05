import { createServerFn } from "@tanstack/react-start";
// Per-handler dynamic imports are used for drizzle and zod
import type { OperationResult } from "~/shared/types/common";
import {
  blockInputSchema,
  followInputSchema,
  unblockInputSchema,
  unfollowInputSchema,
} from "./social.schemas";

export const followUser = createServerFn({ method: "POST" })
  .validator(followInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<boolean>> => {
    try {
      const [{ getCurrentUser }, { getDb }, { getRelationship }] = await Promise.all([
        import("~/features/auth/auth.queries"),
        import("~/db/server-helpers"),
        import("./relationship.server"),
      ]);
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }
      if (currentUser.id === data.followingId) {
        return {
          success: false,
          errors: [{ code: "VALIDATION_ERROR", message: "Cannot follow yourself" }],
        };
      }

      const db = await getDb();
      const { user, userFollows, socialAuditLogs } = await import("~/db/schema");
      const { eq } = await import("drizzle-orm");

      // Check allowFollows on target
      const [target] = await db
        .select({ id: user.id, privacySettings: user.privacySettings })
        .from(user)
        .where(eq(user.id, data.followingId))
        .limit(1);
      if (!target)
        return {
          success: false,
          errors: [{ code: "NOT_FOUND", message: "User not found" }],
        };
      if (target.privacySettings) {
        try {
          const p = JSON.parse(target.privacySettings) as { allowFollows?: boolean };
          if (p.allowFollows === false) {
            return {
              success: false,
              errors: [
                { code: "FORBIDDEN", message: "User is not accepting new followers" },
              ],
            };
          }
        } catch {
          /* ignore parse errors */
        }
      }

      // Block checks
      const rel = await getRelationship(currentUser.id, data.followingId);
      if (rel.blocked || rel.blockedBy) {
        return {
          success: false,
          errors: [{ code: "BLOCKED", message: "Interaction not allowed" }],
        };
      }

      // Already following?
      const existing = await db.query.userFollows.findFirst({
        where: (f, { and, eq }) =>
          and(eq(f.followerId, currentUser.id), eq(f.followingId, data.followingId)),
      });
      if (existing) {
        return { success: true, data: true };
      }

      await db.insert(userFollows).values({
        id: crypto.randomUUID(),
        followerId: currentUser.id,
        followingId: data.followingId,
      });

      // Audit
      const { getWebRequest } = await import("@tanstack/react-start/server");
      const { headers } = getWebRequest();
      await db.insert(socialAuditLogs).values({
        id: crypto.randomUUID(),
        actorUserId: currentUser.id,
        targetUserId: data.followingId,
        action: "follow",
        metadata: { userAgent: headers.get("user-agent") || undefined },
      });

      return { success: true, data: true };
    } catch (error) {
      console.error("followUser error", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to follow user" }],
      };
    }
  });

export const unfollowUser = createServerFn({ method: "POST" })
  .validator(unfollowInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<boolean>> => {
    try {
      const [{ getCurrentUser }, { getDb }] = await Promise.all([
        import("~/features/auth/auth.queries"),
        import("~/db/server-helpers"),
      ]);
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();
      const { userFollows, socialAuditLogs } = await import("~/db/schema");
      const { eq } = await import("drizzle-orm");

      const existing = await db.query.userFollows.findFirst({
        where: (f, { and, eq }) =>
          and(eq(f.followerId, currentUser.id), eq(f.followingId, data.followingId)),
      });

      if (existing) {
        await db.delete(userFollows).where(eq(userFollows.id, existing.id));
      }

      // Audit
      const { getWebRequest } = await import("@tanstack/react-start/server");
      const { headers } = getWebRequest();
      await db.insert(socialAuditLogs).values({
        id: crypto.randomUUID(),
        actorUserId: currentUser.id,
        targetUserId: data.followingId,
        action: "unfollow",
        metadata: { userAgent: headers.get("user-agent") || undefined },
      });

      return { success: true, data: true };
    } catch (error) {
      console.error("unfollowUser error", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to unfollow user" }],
      };
    }
  });

export const blockUser = createServerFn({ method: "POST" })
  .validator(blockInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<boolean>> => {
    try {
      const [{ getCurrentUser }, { getDb }] = await Promise.all([
        import("~/features/auth/auth.queries"),
        import("~/db/server-helpers"),
      ]);
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }
      if (currentUser.id === data.userId) {
        return {
          success: false,
          errors: [{ code: "VALIDATION_ERROR", message: "Cannot block yourself" }],
        };
      }

      const db = await getDb();
      const { userBlocks, userFollows, socialAuditLogs } = await import("~/db/schema");

      const existing = await db.query.userBlocks.findFirst({
        where: (b, { and, eq }) =>
          and(eq(b.blockerId, currentUser.id), eq(b.blockeeId, data.userId)),
      });

      if (!existing) {
        await db.insert(userBlocks).values({
          id: crypto.randomUUID(),
          blockerId: currentUser.id,
          blockeeId: data.userId,
          reason: data.reason || null,
        });

        // Remove follows in both directions
        const { and, or, eq } = await import("drizzle-orm");
        await db
          .delete(userFollows)
          .where(
            or(
              and(
                eq(userFollows.followerId, currentUser.id),
                eq(userFollows.followingId, data.userId),
              ),
              and(
                eq(userFollows.followerId, data.userId),
                eq(userFollows.followingId, currentUser.id),
              ),
            ),
          );
      }

      // Audit
      const { getWebRequest } = await import("@tanstack/react-start/server");
      const { headers } = getWebRequest();
      await db.insert(socialAuditLogs).values({
        id: crypto.randomUUID(),
        actorUserId: currentUser.id,
        targetUserId: data.userId,
        action: "block",
        metadata: {
          userAgent: headers.get("user-agent") || undefined,
          reason: data.reason || undefined,
        },
      });

      return { success: true, data: true };
    } catch (error) {
      console.error("blockUser error", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to block user" }],
      };
    }
  });

export const unblockUser = createServerFn({ method: "POST" })
  .validator(unblockInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<boolean>> => {
    try {
      const [{ getCurrentUser }, { getDb }] = await Promise.all([
        import("~/features/auth/auth.queries"),
        import("~/db/server-helpers"),
      ]);
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();
      const { userBlocks, socialAuditLogs } = await import("~/db/schema");
      const { and, eq } = await import("drizzle-orm");

      await db
        .delete(userBlocks)
        .where(
          and(
            eq(userBlocks.blockerId, currentUser.id),
            eq(userBlocks.blockeeId, data.userId),
          ),
        );

      // Audit
      const { getWebRequest } = await import("@tanstack/react-start/server");
      const { headers } = getWebRequest();
      await db.insert(socialAuditLogs).values({
        id: crypto.randomUUID(),
        actorUserId: currentUser.id,
        targetUserId: data.userId,
        action: "unblock",
        metadata: { userAgent: headers.get("user-agent") || undefined },
      });

      return { success: true, data: true };
    } catch (error) {
      console.error("unblockUser error", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to unblock user" }],
      };
    }
  });
