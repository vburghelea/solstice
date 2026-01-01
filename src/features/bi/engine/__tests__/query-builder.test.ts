import { describe, expect, it } from "vitest";
import type { DatasetConfig } from "../../bi.types";
import { buildDatasetQueryPlan } from "../query-builder";

const dataset: DatasetConfig = {
  id: "organizations",
  name: "Organizations",
  baseTable: "organizations",
  joins: [
    {
      table: "users",
      type: "left",
      on: { left: "owner_id", right: "id" },
    },
  ],
  fields: [
    {
      id: "name",
      name: "Name",
      sourceColumn: "name",
      dataType: "string",
    },
    {
      id: "ownerEmail",
      name: "Owner Email",
      sourceColumn: "email",
      sourceTable: "users",
      dataType: "string",
    },
  ],
};

describe("buildDatasetQueryPlan", () => {
  it("maps selected fields to source columns", () => {
    const plan = buildDatasetQueryPlan(dataset, ["name", "ownerEmail"]);
    expect(plan.baseTable).toBe("organizations");
    expect(plan.joins?.length).toBe(1);
    expect(plan.columns).toEqual([
      { fieldId: "name", sourceColumn: "name", sourceTable: "organizations" },
      { fieldId: "ownerEmail", sourceColumn: "email", sourceTable: "users" },
    ]);
  });

  it("throws for unknown fields", () => {
    expect(() => buildDatasetQueryPlan(dataset, ["missing"])).toThrow(
      "Unknown field 'missing'",
    );
  });
});
