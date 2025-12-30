import type { RegistrationGroupMemberStatus } from "./registration-groups.types";

const transitionMap: Record<
  RegistrationGroupMemberStatus,
  Set<RegistrationGroupMemberStatus>
> = {
  invited: new Set(["invited", "active", "declined", "removed"]),
  pending: new Set(["pending", "active", "declined", "removed"]),
  active: new Set(["active", "removed"]),
  declined: new Set(["declined", "invited"]),
  removed: new Set(["removed", "invited"]),
};

export const canTransitionGroupMemberStatus = (
  current: RegistrationGroupMemberStatus,
  next: RegistrationGroupMemberStatus,
) => transitionMap[current]?.has(next) ?? false;
