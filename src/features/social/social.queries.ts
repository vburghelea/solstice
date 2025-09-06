import { createServerFn } from "@tanstack/react-start";
import { desc, eq, sql } from "drizzle-orm";
import type { OperationResult } from "~/shared/types/common";
import { getBlocklistInputSchema, relationshipInputSchema } from "./social.schemas";
import type { BlocklistItem, RelationshipSnapshot } from "./social.types";

export const getRelationshipSnapshot = createServerFn({ method: "GET" })
  .validator(relationshipInputSchema.parse)
  .handler(async ({ data }): Promise<OperationResult<RelationshipSnapshot>> => {
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

      const db = await getDb();
      const { user } = await import("~/db/schema");
      const { eq } = await import("drizzle-orm");

      const [target] = await db
        .select({ id: user.id, name: user.name, email: user.email, image: user.image })
        .from(user)
        .where(eq(user.id, data.userId))
        .limit(1);
      if (!target)
        return {
          success: false,
          errors: [{ code: "NOT_FOUND", message: "User not found" }],
        };

      // If viewing own profile, normalize relationship booleans and flag isSelf
      if (currentUser.id === data.userId) {
        return {
          success: true,
          data: {
            follows: false,
            followedBy: false,
            blocked: false,
            blockedBy: false,
            isConnection: false,
            targetUser: target,
            isSelf: true,
          },
        };
      }

      const rel = await getRelationship(currentUser.id, data.userId);
      return { success: true, data: { ...rel, targetUser: target, isSelf: false } };
    } catch (error) {
      console.error("getRelationshipSnapshot error", error);
      return {
        success: false,
        errors: [{ code: "SERVER_ERROR", message: "Failed to fetch relationship" }],
      };
    }
  });

export const getBlocklist = createServerFn({ method: "GET" })
  .validator((input: unknown) => getBlocklistInputSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<OperationResult<{ items: BlocklistItem[]; totalCount: number }>> => {
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

        const page = Math.max(1, data?.page ?? 1);
        const pageSize = Math.min(100, Math.max(1, data?.pageSize ?? 20));
        const offset = (page - 1) * pageSize;

        const db = await getDb();
        const { userBlocks, user } = await import("~/db/schema");

        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(userBlocks)
          .where(eq(userBlocks.blockerId, currentUser.id));

        const rows = await db
          .select({
            block: userBlocks,
            blocked: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
            },
          })
          .from(userBlocks)
          .innerJoin(user, eq(userBlocks.blockeeId, user.id))
          .where(eq(userBlocks.blockerId, currentUser.id))
          .orderBy(desc(userBlocks.createdAt))
          .limit(pageSize)
          .offset(offset);

        const items: BlocklistItem[] = rows.map((r) => ({
          id: r.block.id,
          user: r.blocked,
          reason: r.block.reason ?? null,
          createdAt: r.block.createdAt!,
        }));

        return { success: true, data: { items, totalCount: count } };
      } catch (error) {
        console.error("getBlocklist error", error);
        return {
          success: false,
          errors: [{ code: "SERVER_ERROR", message: "Failed to fetch blocklist" }],
        };
      }
    },
  );
