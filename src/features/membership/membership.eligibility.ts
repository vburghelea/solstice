import type { db } from "~/db";

export type MembershipEligibility = {
  hasActiveMembership: boolean;
  hasActiveDayPass: boolean;
};

export type MembershipEligibilityResult = MembershipEligibility & {
  requiresMembership: boolean;
  eligible: boolean;
};

type Db = Awaited<ReturnType<typeof db>>;

export const evaluateMembershipEligibility = (
  params: MembershipEligibility & { requiresMembership: boolean },
): MembershipEligibilityResult => {
  const eligible =
    !params.requiresMembership || params.hasActiveMembership || params.hasActiveDayPass;

  return {
    ...params,
    eligible,
  };
};

export const resolveMembershipEligibility = async (params: {
  db?: Db;
  userId: string;
  eventId?: string | null;
  asOf?: Date;
}): Promise<MembershipEligibility> => {
  const { and, eq, gte, sql } = await import("drizzle-orm");
  const { membershipPurchases, memberships } = await import("~/db/schema");
  const { getDb } = await import("~/db/server-helpers");
  const dbInstance = params.db ?? (await getDb());
  const asOf = params.asOf ?? new Date();
  const today = asOf.toISOString().split("T")[0];

  const [activeMembership] = await dbInstance
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, params.userId),
        eq(memberships.status, "active"),
        gte(memberships.endDate, sql`CURRENT_DATE`),
      ),
    )
    .limit(1);

  let activeDayPass: { id: string } | undefined;

  if (params.eventId) {
    [activeDayPass] = await dbInstance
      .select({ id: membershipPurchases.id })
      .from(membershipPurchases)
      .where(
        and(
          eq(membershipPurchases.userId, params.userId),
          eq(membershipPurchases.status, "active"),
          eq(membershipPurchases.eventId, params.eventId),
          gte(membershipPurchases.endDate, today),
        ),
      )
      .limit(1);
  }

  return {
    hasActiveMembership: Boolean(activeMembership),
    hasActiveDayPass: Boolean(activeDayPass),
  };
};
