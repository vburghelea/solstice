import fc from "fast-check";

export type UserRoleRecord = {
  role: { name: string };
  teamId?: string | null;
  eventId?: string | null;
};

export const roleNameArb = fc.string({ minLength: 1, maxLength: 30 });

export const userRoleArb: fc.Arbitrary<UserRoleRecord> = fc.record({
  role: fc.record({ name: roleNameArb }),
  teamId: fc.option(fc.uuid(), { nil: null }),
  eventId: fc.option(fc.uuid(), { nil: null }),
});

export const userWithRolesArb: fc.Arbitrary<{ roles?: UserRoleRecord[] }> = fc.oneof(
  fc.record({ roles: fc.array(userRoleArb, { maxLength: 8 }) }),
  fc.constant({}),
);
