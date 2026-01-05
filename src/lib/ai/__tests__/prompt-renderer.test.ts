import { describe, expect, it } from "vitest";
import { extractPromptVariables, renderPrompt } from "../prompt-renderer";

describe("prompt-renderer", () => {
  it("extracts unique variables from template", () => {
    const template = "Hello {{name}} from {{org}} and {{name}} again.";
    expect(extractPromptVariables(template).sort()).toEqual(["name", "org"]);
  });

  it("renders with provided variables", () => {
    const result = renderPrompt("Team {{team}} has {{count}} players.", {
      team: "Ravens",
      count: 12,
    });
    expect(result.text).toBe("Team Ravens has 12 players.");
    expect(result.missing).toEqual([]);
  });

  it("returns missing variables when strict mode is disabled", () => {
    const result = renderPrompt("Welcome {{user}} to {{org}}.", {}, { strict: false });
    expect(result.text).toBe("Welcome  to .");
    expect(result.missing.sort()).toEqual(["org", "user"]);
  });

  it("throws when variables are missing in strict mode", () => {
    expect(() => renderPrompt("Welcome {{user}}.", {})).toThrow(
      "Missing prompt variables: user",
    );
  });
});
