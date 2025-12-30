import { describe, expect, it } from "vitest";
import { canTransitionGroupMemberStatus } from "../registration-groups.rules";

describe("Registration group member status transitions", () => {
  it("allows invited members to accept or decline", () => {
    expect(canTransitionGroupMemberStatus("invited", "active")).toBe(true);
    expect(canTransitionGroupMemberStatus("invited", "declined")).toBe(true);
  });

  it("allows pending members to become active", () => {
    expect(canTransitionGroupMemberStatus("pending", "active")).toBe(true);
  });

  it("allows active members to be removed", () => {
    expect(canTransitionGroupMemberStatus("active", "removed")).toBe(true);
  });

  it("allows re-inviting removed or declined members", () => {
    expect(canTransitionGroupMemberStatus("removed", "invited")).toBe(true);
    expect(canTransitionGroupMemberStatus("declined", "invited")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(canTransitionGroupMemberStatus("active", "declined")).toBe(false);
    expect(canTransitionGroupMemberStatus("removed", "active")).toBe(false);
  });
});
