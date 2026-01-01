import { describe, expect, it } from "vitest";
import type { DatasetField, QueryContext } from "../../bi.types";
import {
  canViewSensitiveFields,
  checkFieldAccess,
  getFieldsToMask,
  maskPiiFields,
  queryIncludesPii,
} from "../field-acl";

const baseContext = (overrides?: Partial<QueryContext>): QueryContext => ({
  userId: "user-1",
  organizationId: "org-1",
  orgRole: "reporter",
  isGlobalAdmin: false,
  permissions: new Set(["analytics.view"]),
  hasRecentAuth: false,
  timestamp: new Date(),
  ...overrides,
});

const piiField: DatasetField = {
  id: "email",
  name: "Email",
  sourceColumn: "email",
  dataType: "string",
  piiClassification: "personal",
  allowFilter: true,
};

const normalField: DatasetField = {
  id: "status",
  name: "Status",
  sourceColumn: "status",
  dataType: "enum",
  allowFilter: true,
};

describe("canViewSensitiveFields", () => {
  it("returns true for wildcard permission", () => {
    expect(canViewSensitiveFields(new Set(["*"]))).toBe(true);
  });

  it("returns true for pii.read permission", () => {
    expect(canViewSensitiveFields(new Set(["pii.read"]))).toBe(true);
  });

  it("returns false without PII permission", () => {
    expect(canViewSensitiveFields(new Set(["analytics.view"]))).toBe(false);
  });
});

describe("checkFieldAccess", () => {
  it("masks PII when user lacks permission", () => {
    const result = checkFieldAccess(piiField, baseContext());
    expect(result.canAccess).toBe(true);
    expect(result.isPii).toBe(true);
    expect(result.shouldMask).toBe(true);
  });

  it("allows PII when user has permission", () => {
    const result = checkFieldAccess(
      piiField,
      baseContext({ permissions: new Set(["pii.read"]) }),
    );
    expect(result.canAccess).toBe(true);
    expect(result.shouldMask).toBe(false);
  });

  it("denies field when required permission missing", () => {
    const restricted: DatasetField = {
      ...normalField,
      requiredPermission: "analytics.admin",
    };
    const result = checkFieldAccess(restricted, baseContext());
    expect(result.canAccess).toBe(false);
  });
});

describe("getFieldsToMask", () => {
  it("returns PII fields for masking", () => {
    const fields = [piiField, normalField];
    const masked = getFieldsToMask(fields, baseContext());
    expect(masked).toEqual(["email"]);
  });
});

describe("maskPiiFields", () => {
  it("masks specified fields", () => {
    const row = { email: "user@example.com", status: "active" };
    const masked = maskPiiFields(row, ["email"]);
    expect(masked["email"]).toBe("***");
    expect(masked["status"]).toBe("active");
  });
});

describe("queryIncludesPii", () => {
  it("detects PII fields", () => {
    const result = queryIncludesPii(["email"], [piiField, normalField]);
    expect(result).toBe(true);
  });

  it("returns false when no PII fields", () => {
    const result = queryIncludesPii(["status"], [normalField]);
    expect(result).toBe(false);
  });
});
