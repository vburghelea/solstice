import { describe, expect, it } from "vitest";

import { parseOAuthAllowedDomains } from "../env/oauth-domain";

describe("parseOAuthAllowedDomains", () => {
  it("returns an empty array when no domains are provided", () => {
    expect(parseOAuthAllowedDomains(undefined)).toEqual([]);
  });

  it("normalizes and de-duplicates comma-separated domains", () => {
    const input = "Example.com, partner.org ,EXAMPLE.com";
    expect(parseOAuthAllowedDomains(input)).toEqual(["example.com", "partner.org"]);
  });

  it("accepts pre-parsed domain arrays", () => {
    expect(parseOAuthAllowedDomains(["Team.ca", "league.org"])).toEqual([
      "team.ca",
      "league.org",
    ]);
  });

  it("throws an error when invalid domains are included", () => {
    expect(() => parseOAuthAllowedDomains("valid.com, bad_domain!")).toThrowError(
      /Invalid domain/,
    );
  });
});
