import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeSqlWorkbenchQuery } from "../bi.sql-executor";
import * as guardrails from "../governance/query-guardrails";

const getDbMock = vi.fn();
const logQueryMock = vi.fn();

vi.mock("~/db/server-helpers", () => ({
  getDb: (...args: unknown[]) => getDbMock(...args),
}));

vi.mock("../governance", () => ({
  logQuery: (...args: unknown[]) => logQueryMock(...args),
}));

describe("executeSqlWorkbenchQuery", () => {
  beforeEach(() => {
    getDbMock.mockReset();
    logQueryMock.mockReset();
  });

  it("applies session settings and limits", async () => {
    const txExecute = vi.fn(async (query: { queryChunks?: unknown[] }) => {
      const raw = query?.queryChunks?.[0] as { value?: string[] } | undefined;
      const sqlText = raw?.value?.[0] ?? "";
      if (sqlText.startsWith("EXPLAIN (FORMAT JSON)")) {
        return [{ "QUERY PLAN": [{ Plan: { "Total Cost": 1 } }] }];
      }
      return [];
    });

    getDbMock.mockResolvedValue({
      transaction: async (cb: (tx: { execute: typeof txExecute }) => unknown) =>
        cb({ execute: txExecute }),
    });

    await executeSqlWorkbenchQuery({
      sqlText: "SELECT * FROM organizations",
      parameters: {},
      datasetId: "organizations",
      maxRows: 25,
      context: {
        userId: "user-1",
        organizationId: "org-1",
        orgRole: "reporter",
        isGlobalAdmin: false,
        permissions: new Set(["analytics.sql"]),
        hasRecentAuth: true,
        timestamp: new Date(),
      },
    });

    const readStatement = (arg: unknown) => {
      const query = arg as { queryChunks?: Array<{ value?: string[] }> };
      return query?.queryChunks?.[0]?.value?.[0] ?? "";
    };

    const statements = txExecute.mock.calls
      .map((call) => readStatement(call[0]))
      .filter((statement) => typeof statement === "string");

    expect(statements).toEqual(
      expect.arrayContaining([
        "SET LOCAL ROLE bi_readonly",
        "SET LOCAL app.org_id = 'org-1'",
        "SET LOCAL app.is_global_admin = 'false'",
        `SET LOCAL statement_timeout = ${guardrails.QUERY_GUARDRAILS.statementTimeoutMs}`,
      ]),
    );

    const explain = statements.find((statement) =>
      statement.startsWith("EXPLAIN (FORMAT JSON)"),
    );
    expect(explain).toContain(`LIMIT 25`);
    expect(logQueryMock).toHaveBeenCalled();
  });

  it("rejects queries that exceed cost limits", async () => {
    const txExecute = vi.fn(async (query: { queryChunks?: unknown[] }) => {
      const raw = query?.queryChunks?.[0] as { value?: string[] } | undefined;
      const sqlText = raw?.value?.[0] ?? "";
      if (sqlText.startsWith("EXPLAIN (FORMAT JSON)")) {
        return [
          {
            "QUERY PLAN": [
              {
                Plan: { "Total Cost": guardrails.QUERY_GUARDRAILS.maxEstimatedCost + 1 },
              },
            ],
          },
        ];
      }
      return [];
    });

    getDbMock.mockResolvedValue({
      transaction: async (cb: (tx: { execute: typeof txExecute }) => unknown) =>
        cb({ execute: txExecute }),
    });

    await expect(
      executeSqlWorkbenchQuery({
        sqlText: "SELECT * FROM organizations",
        parameters: {},
        datasetId: "organizations",
        context: {
          userId: "user-1",
          organizationId: "org-1",
          orgRole: "reporter",
          isGlobalAdmin: false,
          permissions: new Set(["analytics.sql"]),
          hasRecentAuth: true,
          timestamp: new Date(),
        },
      }),
    ).rejects.toThrow("SQL query exceeds cost limits");
  });

  it("defaults to UI row limits when maxRows is not provided", async () => {
    const txExecute = vi.fn(async (query: { queryChunks?: unknown[] }) => {
      const raw = query?.queryChunks?.[0] as { value?: string[] } | undefined;
      const sqlText = raw?.value?.[0] ?? "";
      if (sqlText.startsWith("EXPLAIN (FORMAT JSON)")) {
        return [{ "QUERY PLAN": [{ Plan: { "Total Cost": 1 } }] }];
      }
      return [];
    });

    getDbMock.mockResolvedValue({
      transaction: async (cb: (tx: { execute: typeof txExecute }) => unknown) =>
        cb({ execute: txExecute }),
    });

    await executeSqlWorkbenchQuery({
      sqlText: "SELECT * FROM organizations",
      datasetId: "organizations",
      context: {
        userId: "user-1",
        organizationId: "org-1",
        orgRole: "reporter",
        isGlobalAdmin: false,
        permissions: new Set(["analytics.sql"]),
        hasRecentAuth: true,
        timestamp: new Date(),
      },
    });

    const statements = txExecute.mock.calls
      .map((call) => {
        const query = call[0] as { queryChunks?: Array<{ value?: string[] }> };
        return query?.queryChunks?.[0]?.value?.[0] ?? "";
      })
      .filter((statement) => typeof statement === "string");

    const explain = statements.find((statement) =>
      statement.startsWith("EXPLAIN (FORMAT JSON)"),
    );
    expect(explain).toContain(`LIMIT ${guardrails.QUERY_GUARDRAILS.maxRowsUi}`);
  });

  it("respects export row limits when provided", async () => {
    const txExecute = vi.fn(async (query: { queryChunks?: unknown[] }) => {
      const raw = query?.queryChunks?.[0] as { value?: string[] } | undefined;
      const sqlText = raw?.value?.[0] ?? "";
      if (sqlText.startsWith("EXPLAIN (FORMAT JSON)")) {
        return [{ "QUERY PLAN": [{ Plan: { "Total Cost": 1 } }] }];
      }
      return [];
    });

    getDbMock.mockResolvedValue({
      transaction: async (cb: (tx: { execute: typeof txExecute }) => unknown) =>
        cb({ execute: txExecute }),
    });

    await executeSqlWorkbenchQuery({
      sqlText: "SELECT * FROM organizations",
      datasetId: "organizations",
      maxRows: guardrails.QUERY_GUARDRAILS.maxRowsExport,
      context: {
        userId: "user-1",
        organizationId: "org-1",
        orgRole: "reporter",
        isGlobalAdmin: false,
        permissions: new Set(["analytics.sql"]),
        hasRecentAuth: true,
        timestamp: new Date(),
      },
    });

    const statements = txExecute.mock.calls
      .map((call) => {
        const query = call[0] as { queryChunks?: Array<{ value?: string[] }> };
        return query?.queryChunks?.[0]?.value?.[0] ?? "";
      })
      .filter((statement) => typeof statement === "string");

    const explain = statements.find((statement) =>
      statement.startsWith("EXPLAIN (FORMAT JSON)"),
    );
    expect(explain).toContain(`LIMIT ${guardrails.QUERY_GUARDRAILS.maxRowsExport}`);
  });

  it("propagates concurrency guardrail errors", async () => {
    const acquireSpy = vi
      .spyOn(guardrails, "acquireConcurrencySlot")
      .mockImplementation(() => {
        throw new Error("Too many concurrent SQL queries for this user");
      });

    await expect(
      executeSqlWorkbenchQuery({
        sqlText: "SELECT * FROM organizations",
        datasetId: "organizations",
        context: {
          userId: "user-1",
          organizationId: "org-1",
          orgRole: "reporter",
          isGlobalAdmin: false,
          permissions: new Set(["analytics.sql"]),
          hasRecentAuth: true,
          timestamp: new Date(),
        },
      }),
    ).rejects.toThrow("Too many concurrent SQL queries for this user");

    acquireSpy.mockRestore();
  });
});
