import fc from "fast-check";
import type { OrganizationRole } from "~/lib/auth/guards/org-guard";

export type OrgNode = {
  id: string;
  parentOrgId: string | null;
};

export const organizationRoleArb = fc.constantFrom<OrganizationRole>(
  "owner",
  "admin",
  "reporter",
  "viewer",
  "member",
);

export const delegationScopeArb = fc.constantFrom("admin", "reporting", "analytics");

const parentIndexArb = (index: number) =>
  index === 0 ? fc.constant(-1) : fc.integer({ min: -1, max: index - 1 });

export const orgTreeArb = fc
  .uniqueArray(fc.uuid(), { minLength: 1, maxLength: 12 })
  .chain((ids) =>
    fc.tuple(...ids.map((_id, index) => parentIndexArb(index))).map((parents) => {
      const orgs = ids.map((id, index) => ({
        id,
        parentOrgId: parents[index] === -1 ? null : ids[parents[index]],
      }));

      return { orgs };
    }),
  );
