import { describe, expect, it } from "vitest";
import { parseImportFile } from "../imports.utils";

const createFile = (content: BlobPart[], name: string, type: string) =>
  new File(content, name, { type });

describe("imports.utils", () => {
  it("parses CSV files by header", async () => {
    const csv = "name,age\nAlice,30\n\nBob,25\n";
    const file = createFile([csv], "people.csv", "text/csv");

    const result = await parseImportFile(file);

    expect(result.type).toBe("csv");
    expect(result.rows).toEqual([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ]);
  });

  it("parses Excel files from first sheet", async () => {
    const { utils, write } = await import("xlsx");
    const sheet = utils.aoa_to_sheet([
      ["name", "age"],
      ["Alex", 31],
    ]);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, sheet, "Sheet1");

    const data = write(workbook, { type: "array", bookType: "xlsx" });
    const file = createFile(
      [data],
      "people.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ) as File & { arrayBuffer: () => Promise<ArrayBuffer> };
    file.arrayBuffer = async () =>
      data instanceof ArrayBuffer ? data : ((data as Uint8Array).buffer as ArrayBuffer);

    const result = await parseImportFile(file);

    expect(result.type).toBe("excel");
    expect(result.rows).toEqual([{ name: "Alex", age: 31 }]);
  });

  it("rejects unsupported files", async () => {
    const file = createFile(["hello"], "notes.txt", "text/plain");

    await expect(parseImportFile(file)).rejects.toThrow(
      "Unsupported file type. Please upload CSV or Excel.",
    );
  });
});
