import { describe, expect, it } from "vitest";
import type { FormDefinition } from "../forms.schemas";
import {
  isValidStorageKeyPrefix,
  parseFileFieldValue,
  validateFileField,
  validateFormPayload,
} from "../forms.utils";

const baseDefinition: FormDefinition = {
  fields: [
    {
      key: "name",
      type: "text",
      label: "Name",
      required: true,
      dataClassification: "none",
    },
    {
      key: "age",
      type: "number",
      label: "Age",
      required: false,
      dataClassification: "none",
      validation: [
        { type: "min", value: 18, message: "Must be an adult" },
        { type: "max", value: 65, message: "Too old" },
      ],
    },
    {
      key: "consent",
      type: "checkbox",
      label: "Consent",
      required: false,
      dataClassification: "none",
    },
    {
      key: "reason",
      type: "text",
      label: "Reason",
      required: true,
      dataClassification: "none",
      conditional: { field: "consent", operator: "equals", value: true },
      validation: [{ type: "min_length", value: 3, message: "Too short" }],
    },
    {
      key: "code",
      type: "text",
      label: "Code",
      required: false,
      dataClassification: "none",
      validation: [{ type: "pattern", value: "^SIN-[0-9]{3}$", message: "Invalid code" }],
    },
  ],
  settings: {
    allowDraft: true,
    requireApproval: false,
    notifyOnSubmit: [],
  },
};

describe("forms.utils", () => {
  it("validates required + conditional fields and rules", () => {
    const result = validateFormPayload(baseDefinition, {
      consent: true,
      age: 16,
      code: "BAD",
    });

    expect(result.missingFields).toEqual(expect.arrayContaining(["name", "reason"]));
    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        { field: "age", message: "Must be an adult" },
        { field: "code", message: "Invalid code" },
      ]),
    );
    expect(result.completenessScore).toBeLessThan(100);
  });

  it("skips conditional required fields when not active", () => {
    const result = validateFormPayload(baseDefinition, {
      name: "Alex",
      consent: false,
    });

    expect(result.missingFields).not.toContain("reason");
    expect(result.validationErrors).toEqual([]);
  });

  it("parses file payloads from single and array values", () => {
    const single = parseFileFieldValue({
      fileName: "doc.pdf",
      mimeType: "application/pdf",
      size: 1200,
    });

    const multiple = parseFileFieldValue([
      {
        fileName: "img.png",
        mimeType: "image/png",
        size: 200,
      },
      {
        fileName: "doc.pdf",
        mimeType: "application/pdf",
        size: 1000,
      },
    ]);

    expect(single).toHaveLength(1);
    expect(single[0]?.fileName).toBe("doc.pdf");
    expect(multiple).toHaveLength(2);
  });

  it("validates file uploads against config", () => {
    const definition: FormDefinition = {
      fields: [
        {
          key: "upload",
          type: "file",
          label: "Upload",
          required: true,
          dataClassification: "none",
          fileConfig: {
            allowedTypes: ["application/pdf"],
            maxFiles: 1,
            maxSizeBytes: 1024,
          },
        },
      ],
      settings: {
        allowDraft: true,
        requireApproval: false,
        notifyOnSubmit: [],
      },
    };

    const result = validateFileField(definition, "upload", [
      { fileName: "too-big.pdf", mimeType: "application/pdf", size: 4096 },
      { fileName: "bad.txt", mimeType: "text/plain", size: 10 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects invalid storage key prefixes", () => {
    expect(isValidStorageKeyPrefix("/forms/123/file.pdf", "forms/123")).toBe(true);
    expect(isValidStorageKeyPrefix("../forms/123/file.pdf", "forms/123")).toBe(false);
    expect(isValidStorageKeyPrefix("forms//123/file.pdf", "forms/123")).toBe(false);
  });
});
