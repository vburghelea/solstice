import { fc, test as fcTest } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import {
  buildOrgMaps,
  collectDescendants,
  pickHighestRole,
  resolveOrganizationRole,
  rolePriority,
} from "~/features/organizations/organizations.access";
import {
  organizationRoleArb,
  orgTreeArb,
} from "~/tests/arbitraries/organization.arbitrary";

const emptyScopes = new Map<string, string[]>();

describe("organizations.access property tests", () => {
  fcTest.prop([orgTreeArb])("no access without membership or delegation", ({ orgs }) => {
    const { parentById } = buildOrgMaps(orgs);
    const membershipByOrg = new Map();

    for (const org of orgs) {
      const role = resolveOrganizationRole({
        organizationId: org.id,
        parentById,
        membershipByOrg,
        delegatedScopesByOrg: emptyScopes,
      });

      expect(role).toBeNull();
    }
  });

  fcTest.prop([orgTreeArb, organizationRoleArb, fc.nat()])(
    "parent membership grants non-decreasing access to descendants",
    ({ orgs }, parentRole, seed) => {
      fc.pre(orgs.length > 1);
      const { parentById, childrenByParent } = buildOrgMaps(orgs);
      const parents = orgs.filter(
        (org) => (childrenByParent.get(org.id) ?? []).length > 0,
      );
      fc.pre(parents.length > 0);

      const parent = parents[seed % parents.length];
      const membershipByOrg = new Map([[parent.id, parentRole]]);
      const descendants = Array.from(
        collectDescendants(childrenByParent, [parent.id]),
      ).filter((id) => id !== parent.id);

      fc.pre(descendants.length > 0);

      for (const childId of descendants) {
        const role = resolveOrganizationRole({
          organizationId: childId,
          parentById,
          membershipByOrg,
          delegatedScopesByOrg: emptyScopes,
        });

        expect(role).not.toBeNull();
        expect(rolePriority[role!]).toBeGreaterThanOrEqual(rolePriority[parentRole]);
      }
    },
  );

  fcTest.prop([orgTreeArb, organizationRoleArb, fc.nat()])(
    "membership in one child does not grant sibling access",
    ({ orgs }, memberRole, seed) => {
      const { parentById, childrenByParent } = buildOrgMaps(orgs);
      const parents = orgs.filter(
        (org) => (childrenByParent.get(org.id) ?? []).length > 1,
      );
      fc.pre(parents.length > 0);

      const parent = parents[seed % parents.length];
      const children = childrenByParent.get(parent.id) ?? [];
      fc.pre(children.length > 1);

      const firstIndex = seed % children.length;
      const siblingIndex = (firstIndex + 1) % children.length;
      const childId = children[firstIndex];
      const siblingId = children[siblingIndex];

      const membershipByOrg = new Map([[childId, memberRole]]);

      const siblingRole = resolveOrganizationRole({
        organizationId: siblingId,
        parentById,
        membershipByOrg,
        delegatedScopesByOrg: emptyScopes,
      });

      expect(siblingRole).toBeNull();
    },
  );

  fcTest.prop([
    fc.array(fc.option(organizationRoleArb, { nil: undefined }), { maxLength: 20 }),
  ])("role priority is deterministic", (roles) => {
    const forward = pickHighestRole(roles);
    const reversed = pickHighestRole([...roles].reverse());
    expect(forward).toBe(reversed);
  });
});
