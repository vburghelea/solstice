import { describe, expect, it } from "vitest";
import sqlFixtures from "../../__fixtures__/sql-test-cases.json";
import { parseAndValidateSql, validateAgainstDataset } from "../sql-parser";

const normalizeTables = (tables: string[]) =>
  tables.map((table) => table.toLowerCase()).sort();

describe("SQL parser", () => {
  it("rejects non-select statements", () => {
    for (const { sql, reason } of sqlFixtures.blockedStatements) {
      const result = parseAndValidateSql(sql);
      expect(result.isValid, reason).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("rejects multiple statements", () => {
    for (const sql of sqlFixtures.multiStatements) {
      const result = parseAndValidateSql(sql);
      expect(result.isValid).toBe(false);
    }
  });

  it("accepts valid select statements", () => {
    for (const sql of sqlFixtures.validQueries) {
      const result = parseAndValidateSql(sql);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    }
  });

  it("extracts tables from queries", () => {
    for (const { sql, tables } of sqlFixtures.tableExtraction) {
      const result = parseAndValidateSql(sql);
      expect(normalizeTables(result.tables)).toEqual(normalizeTables(tables));
    }
  });

  it("extracts parameters", () => {
    for (const { sql, parameters } of sqlFixtures.parameterExtraction) {
      const result = parseAndValidateSql(sql);
      expect(result.parameters.map((param) => param.name)).toEqual(parameters);
    }
  });

  it("rejects WITH statements that contain non-select bindings", () => {
    const result = parseAndValidateSql(
      "WITH dangerous AS (UPDATE users SET name = 'x') SELECT * FROM dangerous",
    );
    expect(result.isValid).toBe(false);
  });
});

describe("dataset validation", () => {
  const allowedTables = new Set(["bi_v_organizations", "bi_v_members"]);
  const allowedColumns = new Map([
    ["bi_v_organizations", new Set(["id", "name", "type", "status"])],
    ["bi_v_members", new Set(["id", "organization_id", "user_id", "role"])],
  ]);

  it("allows queries using only allowed tables", () => {
    const parsed = parseAndValidateSql("SELECT * FROM bi_v_organizations");
    const errors = validateAgainstDataset(parsed, allowedTables, allowedColumns);
    expect(errors).toHaveLength(0);
  });

  it("rejects queries with disallowed tables", () => {
    const parsed = parseAndValidateSql("SELECT * FROM users");
    const errors = validateAgainstDataset(parsed, allowedTables, allowedColumns);
    expect(errors).toContain('Table "users" is not in the allowed dataset');
  });

  it("rejects queries with disallowed join tables", () => {
    const parsed = parseAndValidateSql(
      "SELECT * FROM bi_v_organizations o JOIN secrets s ON s.org_id = o.id",
    );
    const errors = validateAgainstDataset(parsed, allowedTables, allowedColumns);
    expect(errors).toContain('Table "secrets" is not in the allowed dataset');
  });

  it("rejects access to disallowed columns", () => {
    const parsed = parseAndValidateSql("SELECT email FROM bi_v_organizations");
    const errors = validateAgainstDataset(parsed, allowedTables, allowedColumns);
    expect(errors.some((error) => error.includes("email"))).toBe(true);
  });

  it("allows column access through table aliases", () => {
    const parsed = parseAndValidateSql("SELECT o.name FROM bi_v_organizations o");
    const errors = validateAgainstDataset(parsed, allowedTables, allowedColumns);
    expect(errors).toHaveLength(0);
  });

  it("ignores CTE table references when validating datasets", () => {
    const parsed = parseAndValidateSql(
      "WITH active_orgs AS (SELECT * FROM bi_v_organizations) SELECT * FROM active_orgs",
    );
    const errors = validateAgainstDataset(parsed, allowedTables, allowedColumns);
    expect(errors).toHaveLength(0);
  });
});
