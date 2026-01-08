import { describe, expect, it } from "vitest";
import { analyzeImport } from "../error-analyzer";
import type { FormDefinition } from "~/features/forms/forms.schemas";

const definition: FormDefinition = {
  fields: [
    {
      key: "email",
      type: "email",
      label: "Email",
      required: true,
      dataClassification: "none",
    },
    {
      key: "date",
      type: "date",
      label: "Date",
      required: false,
      dataClassification: "none",
    },
  ],
  settings: {
    allowDraft: false,
    requireApproval: false,
    notifyOnSubmit: [],
  },
};

describe("error-analyzer", () => {
  it("flags missing required mapping", () => {
    const result = analyzeImport({
      headers: ["Email"],
      rows: [{ Email: "user@example.com" }],
      schema: definition,
      mapping: { Email: "" },
    });

    const structural = result.errors.filter((error) => error.category === "structural");
    expect(structural.length).toBeGreaterThan(0);
  });
});
