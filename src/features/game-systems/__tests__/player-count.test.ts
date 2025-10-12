import { describe, expect, it } from "vitest";

import { formatPlayerCountLabel } from "../lib/player-count";

describe("formatPlayerCountLabel", () => {
  it("returns range when both bounds are defined", () => {
    expect(formatPlayerCountLabel({ minPlayers: 2, maxPlayers: 6 })).toBe("2-6 players");
  });

  it("handles minimum only", () => {
    expect(formatPlayerCountLabel({ minPlayers: 3 })).toBe("3+ players");
  });

  it("handles maximum only", () => {
    expect(formatPlayerCountLabel({ maxPlayers: 8 })).toBe("Up to 8 players");
  });

  it("falls back to TBD", () => {
    expect(formatPlayerCountLabel({})).toBe("Player count TBD");
  });
});
