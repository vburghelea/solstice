import { describe, expect, it } from "vitest";
import { enforceApplyEligibility } from "../enforcement.helpers";

describe("enforceApplyEligibility", () => {
  const makeRel =
    (rel: { blocked?: boolean; blockedBy?: boolean; isConnection?: boolean }) =>
    async () => ({
      blocked: !!rel.blocked,
      blockedBy: !!rel.blockedBy,
      isConnection: !!rel.isConnection,
    });

  it("disallows when viewer blocks owner", async () => {
    const res = await enforceApplyEligibility({
      viewerId: "v",
      ownerId: "o",
      visibility: "public",
      getRelationship: makeRel({ blocked: true }),
    });
    expect(res.allowed).toBe(false);
    if (!res.allowed) expect(res.code).toBe("FORBIDDEN");
  });

  it("disallows when owner blocks viewer", async () => {
    const res = await enforceApplyEligibility({
      viewerId: "v",
      ownerId: "o",
      visibility: "public",
      getRelationship: makeRel({ blockedBy: true }),
    });
    expect(res.allowed).toBe(false);
  });

  it("disallows protected when not a connection", async () => {
    const res = await enforceApplyEligibility({
      viewerId: "v",
      ownerId: "o",
      visibility: "protected",
      getRelationship: makeRel({ isConnection: false }),
    });
    expect(res.allowed).toBe(false);
  });

  it("allows protected when connected", async () => {
    const res = await enforceApplyEligibility({
      viewerId: "v",
      ownerId: "o",
      visibility: "protected",
      getRelationship: makeRel({ isConnection: true }),
    });
    expect(res.allowed).toBe(true);
  });

  it("allows public when no blocks", async () => {
    const res = await enforceApplyEligibility({
      viewerId: "v",
      ownerId: "o",
      visibility: "public",
      getRelationship: makeRel({}),
    });
    expect(res.allowed).toBe(true);
  });
});
