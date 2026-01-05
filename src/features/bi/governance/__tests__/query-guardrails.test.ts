import { describe, expect, it } from "vitest";
import {
  acquireConcurrencySlot,
  buildLimitedQuery,
  inlineParameters,
  stripTrailingSemicolons,
} from "../query-guardrails";

describe("query guardrails", () => {
  it("strips trailing semicolons", () => {
    expect(stripTrailingSemicolons("SELECT 1;  ")).toBe("SELECT 1");
  });

  it("wraps queries with limit", () => {
    expect(buildLimitedQuery("SELECT * FROM orgs", 10)).toBe(
      "SELECT * FROM (SELECT * FROM orgs) AS bi_limit_subquery LIMIT 10",
    );
  });

  it("inlines SQL parameters safely", () => {
    const result = inlineParameters(
      "SELECT * FROM orgs WHERE id = {{id}} AND active = {{active}}",
      { id: "org-1", active: true },
    );
    expect(result).toBe("SELECT * FROM orgs WHERE id = 'org-1' AND active = TRUE");
  });

  it("enforces concurrency limits", async () => {
    const releases: Array<() => Promise<void>> = [];
    try {
      releases.push(await acquireConcurrencySlot("user-1", "org-1"));
      releases.push(await acquireConcurrencySlot("user-1", "org-1"));
      await expect(acquireConcurrencySlot("user-1", "org-1")).rejects.toThrow(
        "Too many concurrent SQL queries for this user",
      );
    } finally {
      await Promise.all(releases.map((release) => release()));
    }
  });
});
