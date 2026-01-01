import { describe, expect, it } from "vitest";
import { rewriteSqlTables } from "../sql-rewriter";

const normalizeSql = (sql: string) =>
  sql
    .replace(/\s+/g, " ")
    .replace(/\s*\.\s*/g, ".")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\bON\s*\(([^()]+)\)/gi, "ON $1")
    .replace(/\bINNER JOIN\b/gi, "JOIN")
    .trim();

const viewMap = {
  organizations: "bi_v_organizations",
  form_submissions: "bi_v_form_submissions",
  reporting_submissions: "bi_v_reporting_submissions",
};

describe("sql table rewriter", () => {
  it("rewrites single table and preserves qualified refs", () => {
    const result = rewriteSqlTables(
      "SELECT organizations.name FROM organizations",
      viewMap,
    );

    expect(normalizeSql(result.sql)).toBe(
      normalizeSql("SELECT organizations.name FROM bi_v_organizations AS organizations"),
    );
  });

  it("keeps explicit aliases", () => {
    const result = rewriteSqlTables("SELECT o.name FROM organizations o", viewMap);

    expect(normalizeSql(result.sql)).toBe(
      normalizeSql("SELECT o.name FROM bi_v_organizations AS o"),
    );
  });

  it("rewrites multiple joined tables", () => {
    const result = rewriteSqlTables(
      "SELECT * FROM organizations o JOIN form_submissions f ON f.organization_id = o.id",
      viewMap,
    );

    expect(normalizeSql(result.sql)).toBe(
      normalizeSql(
        "SELECT * FROM bi_v_organizations AS o JOIN bi_v_form_submissions AS f ON f.organization_id = o.id",
      ),
    );
  });

  it("rewrites tables inside CTEs", () => {
    const result = rewriteSqlTables(
      "WITH base AS (SELECT * FROM reporting_submissions) SELECT * FROM base",
      viewMap,
    );

    expect(normalizeSql(result.sql)).toBe(
      normalizeSql(
        "WITH base AS (SELECT * FROM bi_v_reporting_submissions AS reporting_submissions) SELECT * FROM base",
      ),
    );
  });
});
