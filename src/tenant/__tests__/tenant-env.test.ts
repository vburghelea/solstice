import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getServerTenantKey } from "~/tenant/tenant-env";

const originalTenantKey = process.env["TENANT_KEY"];
const originalViteTenantKey = process.env["VITE_TENANT_KEY"];

const resetEnv = () => {
  if (originalTenantKey === undefined) {
    delete process.env["TENANT_KEY"];
  } else {
    process.env["TENANT_KEY"] = originalTenantKey;
  }

  if (originalViteTenantKey === undefined) {
    delete process.env["VITE_TENANT_KEY"];
  } else {
    process.env["VITE_TENANT_KEY"] = originalViteTenantKey;
  }
};

beforeEach(() => {
  delete process.env["TENANT_KEY"];
  delete process.env["VITE_TENANT_KEY"];
});

afterEach(() => {
  resetEnv();
});

describe("tenant env resolution", () => {
  it("defaults to qc when no tenant keys are set", () => {
    expect(getServerTenantKey()).toBe("qc");
  });

  it("uses TENANT_KEY when provided", () => {
    process.env["TENANT_KEY"] = "viasport";
    expect(getServerTenantKey()).toBe("viasport");
  });

  it("uses VITE_TENANT_KEY when server key is missing", () => {
    process.env["VITE_TENANT_KEY"] = "viasport";
    expect(getServerTenantKey()).toBe("viasport");
  });

  it("throws when TENANT_KEY and VITE_TENANT_KEY mismatch", () => {
    process.env["TENANT_KEY"] = "qc";
    process.env["VITE_TENANT_KEY"] = "viasport";
    expect(() => getServerTenantKey()).toThrow(
      "Tenant key mismatch: TENANT_KEY=qc VITE_TENANT_KEY=viasport",
    );
  });
});
