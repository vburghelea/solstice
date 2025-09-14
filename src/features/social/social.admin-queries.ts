import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import type { OperationResult } from "~/shared/types/common";

const actionEnum = z.enum(["follow", "unfollow", "block", "unblock"]);

export const getSocialAuditsSchema = z
  .object({
    action: actionEnum.optional(),
    actorUserId: z.string().min(1).optional(),
    targetUserId: z.string().min(1).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
  })
  .optional();

export type GetSocialAuditsInput = z.infer<typeof getSocialAuditsSchema>;

export type SocialAuditRow = {
  id: string;
  action: z.infer<typeof actionEnum>;
  createdAt: Date;
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  metadata: Record<string, {}> | null;
  actorUserId: string | null;
  targetUserId: string | null;
  actor?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    uploadedAvatarPath: string | null;
  } | null;
  target?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    uploadedAvatarPath: string | null;
  } | null;
};

export const getSocialAudits = createServerFn({ method: "GET" })
  .validator((input: unknown) => getSocialAuditsSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<OperationResult<{ items: SocialAuditRow[]; totalCount: number }>> => {
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
        // Admin check
        const { PermissionService } = await import("~/features/roles/permission.service");
        const isAdmin = await PermissionService.isGlobalAdmin(currentUser.id);
        if (!isAdmin) {
          return {
            success: false,
            errors: [{ code: "FORBIDDEN", message: "Admin access required" }],
          };
        }

        const page = Math.max(1, data?.page ?? 1);
        const pageSize = Math.min(100, Math.max(1, data?.pageSize ?? 20));
        const offset = (page - 1) * pageSize;

        const db = await getDb();
        const { socialAuditLogs } = await import("~/db/schema");

        const whereClauses: unknown[] = [];
        if (data?.action) whereClauses.push(eq(socialAuditLogs.action, data.action));
        if (data?.actorUserId)
          whereClauses.push(eq(socialAuditLogs.actorUserId, data.actorUserId));
        if (data?.targetUserId)
          whereClauses.push(eq(socialAuditLogs.targetUserId, data.targetUserId));
        if (data?.from) whereClauses.push(gte(socialAuditLogs.createdAt, data.from));
        if (data?.to) whereClauses.push(lte(socialAuditLogs.createdAt, data.to));

        // Drizzle's typed predicates are complex; build a composite condition with safe casts
        const whereExpr =
          whereClauses.length > 0
            ? ((and as unknown as (...args: unknown[]) => unknown)(
                ...whereClauses,
              ) as unknown as import("drizzle-orm").SQL)
            : (sql`true` as import("drizzle-orm").SQL);

        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(socialAuditLogs)
          .where(whereExpr);

        const rows = await db
          .select({ log: socialAuditLogs })
          .from(socialAuditLogs)
          .where(whereExpr)
          .orderBy(desc(socialAuditLogs.createdAt))
          .limit(pageSize)
          .offset(offset);

        const items: SocialAuditRow[] = rows.map((r) => ({
          id: r.log.id,
          action: r.log.action as SocialAuditRow["action"],
          createdAt: r.log.createdAt!,
          // eslint-disable-next-line @typescript-eslint/no-empty-object-type
          metadata: (r.log.metadata as unknown as Record<string, {}>) ?? null,
          actorUserId: r.log.actorUserId ?? null,
          targetUserId: r.log.targetUserId ?? null,
        }));

        // Hydrate user info for avatars/links
        const ids = Array.from(
          new Set(
            items
              .flatMap((it) => [it.actorUserId, it.targetUserId])
              .filter((v): v is string => !!v),
          ),
        );
        if (ids.length > 0) {
          const { user } = await import("~/db/schema");
          const users = await db
            .select({
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              uploadedAvatarPath: user.uploadedAvatarPath,
            })
            .from(user)
            .where(inArray(user.id, ids));
          const map = new Map(users.map((u) => [u.id, u] as const));
          for (const it of items) {
            it.actor = it.actorUserId ? (map.get(it.actorUserId) ?? null) : null;
            it.target = it.targetUserId ? (map.get(it.targetUserId) ?? null) : null;
          }
        }

        return { success: true, data: { items, totalCount: count } };
      } catch (error) {
        console.error("getSocialAudits error", error);
        return {
          success: false,
          errors: [{ code: "SERVER_ERROR", message: "Failed to fetch social audits" }],
        };
      }
    },
  );

// types re-exported above
