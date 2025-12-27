import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { getMembershipTypeSchema } from "./membership.schemas";
import type {
  MembershipOperationResult,
  MembershipStatus,
  UserMembership,
} from "./membership.types";

/**
 * List all active membership types available for purchase
 */
export const listMembershipTypes = createServerFn({ method: "GET" }).handler(
  async (): Promise<
    MembershipOperationResult<import("./membership.types").MembershipType[]>
  > => {
    await assertFeatureEnabled("qc_membership");
    try {
      // Import server-only modules inside the handler
      const { getDb } = await import("~/db/server-helpers");

      // Import database dependencies inside handler
      const { eq } = await import("drizzle-orm");
      const { membershipTypes } = await import("~/db/schema");

      const db = await getDb();

      const activeTypes = await db
        .select()
        .from(membershipTypes)
        .where(eq(membershipTypes.status, "active"))
        .orderBy(membershipTypes.priceCents);

      return {
        success: true,
        data: activeTypes,
      };
    } catch (error) {
      console.error("Error fetching membership types:", error);
      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to fetch membership types",
          },
        ],
      };
    }
  },
);

/**
 * Get a specific membership type by ID
 */
export const getMembershipType = createServerFn({ method: "GET" })
  .inputValidator(zod$(getMembershipTypeSchema))
  .handler(
    async ({
      data,
    }): Promise<
      MembershipOperationResult<import("./membership.types").MembershipType>
    > => {
      await assertFeatureEnabled("qc_membership");
      try {
        // Import server-only modules inside the handler
        const { getDb } = await import("~/db/server-helpers");

        // Import database dependencies inside handler
        const { eq } = await import("drizzle-orm");
        const { membershipTypes } = await import("~/db/schema");

        const db = await getDb();

        const [membershipType] = await db
          .select()
          .from(membershipTypes)
          .where(eq(membershipTypes.id, data.membershipTypeId))
          .limit(1);

        if (!membershipType) {
          return {
            success: false,
            errors: [
              {
                code: "NOT_FOUND",
                message: "Membership type not found",
              },
            ],
          };
        }

        return {
          success: true,
          data: membershipType,
        };
      } catch (error) {
        console.error("Error fetching membership type:", error);
        return {
          success: false,
          errors: [
            {
              code: "DATABASE_ERROR",
              message: "Failed to fetch membership type",
            },
          ],
        };
      }
    },
  );

/**
 * Get current user's membership status
 */
export const getUserMembershipStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<MembershipOperationResult<MembershipStatus>> => {
    await assertFeatureEnabled("qc_membership");
    try {
      // Import server-only modules inside the handler
      const [{ getDb }, { getAuth }] = await Promise.all([
        import("~/db/server-helpers"),
        import("~/lib/auth/server-helpers"),
      ]);

      const auth = await getAuth();
      const { getRequest } = await import("@tanstack/react-start/server");
      const { headers } = getRequest();
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

      // Import database dependencies inside handler
      const { and, eq, gte, sql } = await import("drizzle-orm");
      const { membershipTypes, memberships } = await import("~/db/schema");

      // Get active membership for the user
      const db = await getDb();

      const [currentMembership] = await db
        .select({
          membership: memberships,
          membershipType: membershipTypes,
        })
        .from(memberships)
        .innerJoin(membershipTypes, eq(memberships.membershipTypeId, membershipTypes.id))
        .where(
          and(
            eq(memberships.userId, session.user.id),
            eq(memberships.status, "active"),
            gte(memberships.endDate, sql`CURRENT_DATE`),
          ),
        )
        .orderBy(sql`${memberships.endDate} DESC`)
        .limit(1);

      if (!currentMembership) {
        return {
          success: true,
          data: {
            hasMembership: false,
          },
        };
      }

      const endDate = new Date(currentMembership.membership.endDate);
      const daysRemaining = Math.ceil(
        (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      const userMembership: UserMembership = {
        ...currentMembership.membership,
        membershipType: currentMembership.membershipType,
      };

      return {
        success: true,
        data: {
          hasMembership: true,
          currentMembership: userMembership,
          expiresAt: endDate,
          daysRemaining,
        },
      };
    } catch (error) {
      console.error("Error fetching membership status:", error);
      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to fetch membership status",
          },
        ],
      };
    }
  },
);
