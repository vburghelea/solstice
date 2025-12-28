import { fc, test as fcTest } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { getTenantConfig } from "~/tenant";
import {
  roleNameArb,
  userRoleArb,
  userWithRolesArb,
} from "~/tests/arbitraries/user.arbitrary";
import { isAnyAdmin, userHasRole } from "../permission.service";

const globalAdminRoles = getTenantConfig().admin.globalRoleNames;
const anyAdminRoles = [...globalAdminRoles, "Team Admin", "Event Admin"];

const adminRoleArb = fc.constantFrom(...anyAdminRoles);
const adminUserArb = fc
  .tuple(adminRoleArb, fc.array(userRoleArb, { maxLength: 6 }))
  .map(([roleName, extraRoles]) => ({
    roles: [{ role: { name: roleName } }, ...extraRoles],
  }));

describe("permission helpers property tests", () => {
  fcTest.prop([userWithRolesArb, roleNameArb])(
    "userHasRole matches exact global role",
    (user, roleName) => {
      const expected =
        user.roles?.some(
          (userRole) =>
            userRole.role.name === roleName && !userRole.teamId && !userRole.eventId,
        ) ?? false;

      expect(userHasRole(user, roleName)).toBe(expected);
    },
  );

  fcTest.prop([adminUserArb, userRoleArb])(
    "adding roles never removes admin status",
    (user, newRole) => {
      expect(isAnyAdmin(user)).toBe(true);
      const next = { roles: [...(user.roles ?? []), newRole] };
      expect(isAnyAdmin(next)).toBe(true);
    },
  );

  fcTest.prop([
    fc.constantFrom({} as { roles?: Array<{ role: { name: string } }> }, {
      roles: [] as Array<{ role: { name: string } }>,
    }),
  ])("empty roles are never admin", (user) => {
    expect(isAnyAdmin(user)).toBe(false);
  });

  fcTest.prop([fc.uuid(), fc.uuid()])(
    "scoped roles require exact match",
    (teamId1, teamId2) => {
      fc.pre(teamId1 !== teamId2);

      const user = {
        roles: [{ role: { name: "Team Admin" }, teamId: teamId1 }],
      };

      expect(userHasRole(user, "Team Admin", { teamId: teamId1 })).toBe(true);
      expect(userHasRole(user, "Team Admin", { teamId: teamId2 })).toBe(false);
    },
  );
});
