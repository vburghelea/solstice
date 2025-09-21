import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { zod$ } from "~/lib/server/fn-utils";
import type { MembershipOperationResult } from "./membership.types";

const getAllMembershipsSchema = z.object({
  status: z.enum(["all", "active", "expired", "cancelled"]).optional().default("all"),
  limit: z.number().optional().default(100),
  offset: z.number().optional().default(0),
});

export interface MembershipReportRow {
  id: string;
  userName: string;
  userEmail: string;
  membershipType: string;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
  priceCents: number;
  paymentId: string | null;
  createdAt: Date;
}

/**
 * Admin-only: Get all memberships with user information
 */
export const getAllMemberships = createServerFn({ method: "GET" })
  .validator(zod$(getAllMembershipsSchema))
  .handler(
    async ({ data }): Promise<MembershipOperationResult<MembershipReportRow[]>> => {
      try {
        // Import server-only modules inside the handler
        const [{ getDb }, { getAuth }] = await Promise.all([
          import("~/db/server-helpers"),
          import("~/lib/auth/server-helpers"),
        ]);

        const auth = await getAuth();
        const { getWebRequest } = await import("@tanstack/react-start/server");
        const { headers } = getWebRequest();
        const session = await auth.api.getSession({ headers });

        if (!session?.user?.id) {
          return {
            success: false,
            errors: [
              {
                code: "VALIDATION_ERROR",
                message: "User not authenticated",
              },
            ],
          };
        }

        // Check admin access
        const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
        await requireAdmin(session.user.id);

        // Import database dependencies inside handler
        const { and, eq, sql } = await import("drizzle-orm");
        const { memberships, membershipTypes, user } = await import("~/db/schema");

        const db = await getDb();

        // Build where conditions
        const conditions = [];
        if (data.status !== "all") {
          conditions.push(eq(memberships.status, data.status));
        }
        const query = db
          .select({
            id: memberships.id,
            userName: user.name,
            userEmail: user.email,
            membershipType: membershipTypes.name,
            startDate: memberships.startDate,
            endDate: memberships.endDate,
            status: memberships.status,
            priceCents: membershipTypes.priceCents,
            paymentId: memberships.paymentId,
            createdAt: memberships.createdAt,
          })
          .from(memberships)
          .innerJoin(user, eq(memberships.userId, user.id))
          .innerJoin(
            membershipTypes,
            eq(memberships.membershipTypeId, membershipTypes.id),
          )
          .orderBy(sql`${memberships.createdAt} DESC`)
          .limit(data.limit)
          .offset(data.offset);

        if (conditions.length > 0) {
          const results = await query.where(and(...conditions));
          return {
            success: true,
            data: results,
          };
        }

        const results = await query;
        return {
          success: true,
          data: results,
        };
      } catch (error) {
        console.error("Error fetching memberships:", error);

        if ((error as Error).message?.includes("Admin access required")) {
          return {
            success: false,
            errors: [
              {
                code: "VALIDATION_ERROR",
                message: "Admin access required",
              },
            ],
          };
        }

        return {
          success: false,
          errors: [
            {
              code: "DATABASE_ERROR",
              message: "Failed to fetch memberships",
            },
          ],
        };
      }
    },
  );
