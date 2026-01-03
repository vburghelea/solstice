import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertSqlWorkbenchReady,
  resetSqlWorkbenchGateCache,
} from "../sql-workbench-gate";

const getDbMock = vi.fn();

vi.mock("~/db/server-helpers", () => ({
  getDb: (...args: unknown[]) => getDbMock(...args),
}));

describe("sql workbench gate", () => {
  beforeEach(() => {
    getDbMock.mockReset();
    resetSqlWorkbenchGateCache();
  });

  it("fails when bi_readonly role is missing", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ table_name: "bi_v_organizations" }])
      .mockResolvedValueOnce([
        {
          relname: "bi_v_organizations",
          reloptions: ["security_barrier=true"],
        },
      ])
      .mockResolvedValueOnce([
        { table_name: "bi_v_organizations", privilege_type: "SELECT" },
      ])
      .mockResolvedValueOnce([]);
    const txExecute = vi.fn().mockResolvedValue([]);
    const transaction = vi.fn(
      async (cb: (tx: { execute: typeof txExecute }) => unknown) =>
        cb({ execute: txExecute }),
    );

    getDbMock.mockResolvedValue({ execute, transaction });

    await expect(
      assertSqlWorkbenchReady({
        organizationId: "org-1",
        isGlobalAdmin: false,
        datasetIds: ["organizations"],
      }),
    ).rejects.toThrow("missing role bi_readonly");
  });

  it("caches successful checks", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce([{ exists: 1 }])
      .mockResolvedValueOnce([{ table_name: "bi_v_organizations" }])
      .mockResolvedValueOnce([
        {
          relname: "bi_v_organizations",
          reloptions: ["security_barrier=true"],
        },
      ])
      .mockResolvedValueOnce([
        { table_name: "bi_v_organizations", privilege_type: "SELECT" },
      ])
      .mockResolvedValueOnce([]);
    const txExecute = vi.fn().mockResolvedValue([]);
    const transaction = vi.fn(
      async (cb: (tx: { execute: typeof txExecute }) => unknown) =>
        cb({ execute: txExecute }),
    );

    getDbMock.mockResolvedValue({ execute, transaction });

    await assertSqlWorkbenchReady({
      organizationId: "org-1",
      isGlobalAdmin: false,
      datasetIds: ["organizations"],
    });
    await assertSqlWorkbenchReady({
      organizationId: "org-1",
      isGlobalAdmin: false,
      datasetIds: ["organizations"],
    });

    expect(getDbMock).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledTimes(5);
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
