export type PromptVariables = Record<
  string,
  string | number | boolean | null | undefined
>;

export type PromptRenderResult = {
  text: string;
  missing: string[];
};

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

export const extractPromptVariables = (template: string): string[] => {
  const matches = template.matchAll(VARIABLE_PATTERN);
  const names = new Set<string>();
  for (const match of matches) {
    if (match[1]) {
      names.add(match[1]);
    }
  }
  return [...names];
};

export const renderPrompt = (
  template: string,
  variables: PromptVariables = {},
  options?: { strict?: boolean },
): PromptRenderResult => {
  const missing = new Set<string>();
  const text = template.replace(VARIABLE_PATTERN, (_match, name: string) => {
    const value = variables[name];
    if (value == null) {
      missing.add(name);
      return "";
    }
    return String(value);
  });

  const missingList = [...missing];
  if (missingList.length > 0 && options?.strict !== false) {
    throw new Error(`Missing prompt variables: ${missingList.sort().join(", ")}`);
  }

  return { text, missing: missingList };
};
